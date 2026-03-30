
## Diagnóstico

Não, isso não faz sentido como regra de plano. O erro atual não é “limite do Trial”.

### Causa real encontrada

A falha está acontecendo antes da lógica de exclusão rodar.

Evidências:
- A requisição para `functions/v1/update-member` está saindo com `Authorization: Bearer ...`
- O backend responde `401`
- O corpo da resposta é: `{"code":401,"message":"Invalid JWT"}`
- O runtime error também aponta: `supabase/functions/update-member/index.ts` com `Invalid JWT`

Isso significa:
- o usuário está logado
- a sessão chega no navegador
- mas a função `update-member` está sendo rejeitada na validação de JWT da própria plataforma antes/de/na autenticação da função

Então:
- não é bloqueio de Trial
- não é limite de usuários
- não é regra de negócio de exclusão
- é um problema de autenticação/validação do token nesse endpoint específico

## O que corrigir

### 1. Tornar a autenticação da `update-member` consistente com as outras funções que já funcionam
Revisar `supabase/functions/update-member/index.ts` para alinhar exatamente o padrão das funções autenticadas estáveis do projeto:
- validar `Authorization` com `Bearer `
- criar client com `SUPABASE_ANON_KEY`
- usar `auth.getUser()`
- retornar erro detalhado de autenticação no corpo quando falhar

Hoje o arquivo já parece parecido, mas o comportamento real indica que ele precisa ser refeito no mesmo padrão das funções que estão funcionando (`whatsapp-setup`, `generate-script`, etc.), eliminando qualquer diferença sutil.

### 2. Evitar dupla dependência de validação JWT
Como `update-member` já está configurada com `verify_jwt = true` no `supabase/config.toml`, a função ainda faz validação manual via `auth.getUser()`.

Plano recomendado:
- manter a validação manual para identificar o usuário autenticado
- mas ajustar a função para seguir exatamente o mesmo fluxo das outras funções protegidas
- se o erro persistir, a alternativa segura é revisar a configuração da função no `config.toml` para o modo compatível com o restante do projeto

### 3. Melhorar observabilidade dessa função
Adicionar logs claros em `update-member` para descobrir em qual etapa quebra:
- início da requisição
- presença do header Authorization
- resultado do `auth.getUser()`
- caller id
- organização alvo
- action remove/update

Assim, se voltar a falhar, a causa fica explícita em vez de parecer “erro de plano”.

### 4. Manter exclusão liberada para todos os planos
A lógica de produto deve permanecer:
- adicionar usuários depende do limite do plano
- excluir usuários não depende do plano

Não vou adicionar nenhuma trava de plano para exclusão, porque isso seria incorreto.

### 5. Ajustar o frontend para mostrar a mensagem real quando houver 401
No `EditMemberDialog.tsx`, manter tratamento de erro robusto para exibir:
- “Sessão expirada”
- “Acesso não autorizado”
- “Você não pode remover a si mesmo”
- etc.

Isso evita o erro genérico mesmo quando o backend rejeitar a chamada.

## Arquivos a revisar

- `supabase/functions/update-member/index.ts`
- `supabase/config.toml`
- `src/components/EditMemberDialog.tsx`

## Resultado esperado

Após o ajuste:
- admins Trial, Basic, Pro ou Standard poderão excluir usuários normalmente
- somente bloqueios reais continuarão valendo:
  - remover a si mesmo
  - remover o último super admin
  - falta real de permissão
- o sistema deixará claro quando o problema for sessão/JWT e não plano

## Observação importante

Também apareceu um warning separado no console do `EditMemberDialog` sobre `ref` em componentes do `AlertDialog`. Isso não parece ser a causa do 401, mas vale corrigir depois porque pode gerar comportamento estranho no modal de confirmação.

## Detalhes técnicos

```text
Fluxo atual observado:

UI -> POST /functions/v1/update-member
   -> Authorization Bearer presente
   -> gateway/runtime responde 401 Invalid JWT
   -> função não chega na lógica de remover membership
   -> usuário vê erro ao remover
```

```text
Conclusão:
Erro de autenticação do endpoint
!=
limite de plano
!=
restrição de Trial
```
