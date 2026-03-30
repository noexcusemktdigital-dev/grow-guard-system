

## Correção — Convite de usuário falhando (401 Invalid JWT no gateway)

### Causa raiz

Exatamente o mesmo bug que corrigimos no `update-member`: a função `invite-user` tem `verify_jwt = true` no `supabase/config.toml` (linha 96). O gateway rejeita o JWT antes do código executar, resultando em erro genérico. Os logs confirmam: só "booted", nenhum log de execução da função.

### Solução

1. **`supabase/config.toml`** — Mudar `verify_jwt` de `true` para `false` na função `invite-user` (linha 96). A autenticação já é feita manualmente dentro da função via `auth.getUser(token)`.

2. **`supabase/functions/invite-user/index.ts`** — Mudar todas as respostas de erro para HTTP 200 com `{ error: "mensagem" }` no body (mesmo padrão do `manage-member`), para que o frontend consiga ler a mensagem real em vez de receber "Edge Function returned a non-2xx status code".

3. **Frontend (onde `invite-user` é chamado)** — Ajustar o tratamento de erro para verificar `data?.error` diretamente, removendo o pattern instável de `ctx.json()`.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/config.toml` | `invite-user` → `verify_jwt = false` |
| `supabase/functions/invite-user/index.ts` | Respostas de erro usam HTTP 200 |
| `src/pages/Matriz.tsx` | Simplificar `handleInvite` error handling |
| `src/pages/cliente/ClienteConfiguracoes.tsx` | Idem (se tiver chamada de invite) |

