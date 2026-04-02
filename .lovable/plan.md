

## Plano — Corrigir convites que permanecem "pendentes" após aceitação

### Diagnóstico

O fluxo atual na página `/welcome` (Welcome.tsx) tenta marcar o convite como aceito chamando `manage-member` com `action: "accept_invitation"` **após** o `updateUser`. Porém, há dois problemas:

1. **Sessão de recovery instável**: Após `verifyOtp` + `updateUser` numa sessão de recuperação, o token JWT pode estar inválido ou expirado para chamadas subsequentes. A edge function `manage-member` valida o JWT via `userClient.auth.getUser()` — se falhar, retorna erro silencioso (status 200 com `{ error }`) e o `catch` no frontend não captura.

2. **Falha silenciosa**: O `try/catch` em Welcome.tsx (linhas 156-166) só captura exceções de rede. Se a edge function retorna `{ error: "Sessão inválida" }` com status 200, o frontend ignora — o convite nunca é marcado como aceito.

### Correção

#### 1. Edge Function `manage-member` — aceitar sem exigir sessão válida

Para a ação `accept_invitation`, não faz sentido exigir autenticação completa — o usuário acabou de criar a senha e está prestes a fazer signOut. Mover o tratamento de `accept_invitation` para **antes** da validação de auth, usando apenas o `email` com o service role key (já é o que faz internamente).

#### 2. Welcome.tsx — verificar resposta da edge function

Verificar se a resposta contém `error` e logar adequadamente. Também garantir que a chamada acontece **antes** do `signOut`.

#### 3. Fallback: marcar como aceito no primeiro login

Adicionar lógica no `AuthContext` ou no fluxo de login: quando um usuário faz login e existe um `pending_invitation` com seu email e `accepted_at IS NULL`, marcá-lo automaticamente como aceito. Isso cobre casos onde o Welcome.tsx falhou.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/manage-member/index.ts` | Mover `accept_invitation` para antes da validação de auth |
| `src/pages/Welcome.tsx` | Verificar resposta da edge function, logar erros |
| `src/contexts/AuthContext.tsx` | Fallback: marcar convites pendentes como aceitos no login |

### Resultado

- Convites são marcados como aceitos de forma confiável ao criar senha
- Fallback no login garante que mesmo se o Welcome falhar, o próximo login corrige
- Sem mais usuários "fantasma pendentes" após aceitar convite

