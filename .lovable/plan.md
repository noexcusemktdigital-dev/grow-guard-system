

## Diagnóstico — Workspace duplicado para micaellamcosta@gmail.com

### O que aconteceu

A usuária tem **duas organizações** criadas com 268ms de diferença:

| Organização | Nome | Criada em |
|---|---|---|
| `0058d2e2...` | Micaella Costa Arquitetura | 20:27:21.142 |
| `72cec3bd...` | Micaella de Moura Costa's Company | 20:27:21.411 |

### Causa raiz — Race condition dupla no `signup-saas`

O `signup-saas` é chamado de **dois lugares simultaneamente**:

1. **`SaasAuth.tsx` (linha 164)** — logo após o `signUp()`, com o nome da empresa do formulário
2. **`AuthContext.tsx` (linha 155)** — quando detecta que o usuário não tem role, com fallback `fullName + "'s Company"`

A verificação de idempotência na Edge Function (`existingRole` check na linha 82) **falha** porque ambas as chamadas chegam antes de qualquer role ser criada — as duas passam o guard e criam organizações separadas.

### Plano de correção

**1. Tornar `signup-saas` verdadeiramente idempotente (Edge Function)**

Usar um `INSERT ... ON CONFLICT` na tabela `user_roles` em vez de SELECT + INSERT separados. Se o INSERT falhar por conflito, verificar se o usuário já tem uma org e retornar sem criar duplicata.

Alternativa mais simples: adicionar um **advisory lock** no Postgres usando o `user_id` como chave, garantindo que apenas uma execução simultânea prossiga.

**2. Remover a chamada duplicada no `AuthContext.tsx`**

O `AuthContext` não deveria chamar `signup-saas`. Essa responsabilidade é exclusiva do `SaasAuth.tsx`. O AuthContext deve apenas buscar a role existente e, se não encontrar, aguardar (com retry) em vez de provisionar.

**3. Limpar os dados da usuária afetada**

- Remover a org duplicada `72cec3bd...` ("Micaella de Moura Costa's Company")
- Remover o membership correspondente
- Manter apenas a org real `0058d2e2...` ("Micaella Costa Arquitetura")

### Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/contexts/AuthContext.tsx` | Remover chamada a `signup-saas`; quando não há role, aguardar com retry em vez de provisionar |
| `supabase/functions/signup-saas/index.ts` | Adicionar lock/idempotência real com `INSERT ... ON CONFLICT` na user_roles antes de criar org |
| Migração SQL (dados) | Limpar org e membership duplicados da usuária |

### Detalhes técnicos

**Idempotência no signup-saas**: Antes de criar a organização, inserir a role com `ON CONFLICT DO NOTHING` e verificar se foi inserida. Se não foi (conflito), significa que outra chamada já está provisionando — retornar imediatamente.

```sql
INSERT INTO user_roles (user_id, role) VALUES ($1, 'cliente_admin')
ON CONFLICT (user_id, role) DO NOTHING
RETURNING id;
```

Se o `RETURNING` vier vazio, outra chamada já criou — retornar `{ message: "Already provisioned" }`.

**AuthContext**: Em vez de chamar `signup-saas`, fazer polling na `user_roles` por até 10s. Se não encontrar role após 10s, mostrar um erro ao usuário pedindo para recarregar.

