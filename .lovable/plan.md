

## Correção — generate-script falhando com 401 Invalid JWT

### Causa raiz

Idêntica ao `update-member` e `invite-user`: a função `generate-script` tem `verify_jwt = true` no `supabase/config.toml` (linha 68). O gateway rejeita o JWT antes do código executar. A função já faz autenticação manual via `auth.getUser()`.

### Solução

1. **`supabase/config.toml`** — Mudar `verify_jwt` de `true` para `false` na função `generate-script`

2. **`supabase/functions/generate-script/index.ts`** — Trocar `auth.getUser()` por `auth.getClaims(token)` (padrão das funções corrigidas) e mudar respostas de erro para HTTP 200 com `{ error: "mensagem" }` no body

3. **Frontend** — Simplificar error handling nos 3 locais que chamam `generate-script`:
   - `ScriptGeneratorDialog.tsx` — remover extração de `error.context`, ler `data?.error` direto
   - `ClienteScripts.tsx` — idem
   - `ClientePlanoVendas.tsx` — idem

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/config.toml` | `generate-script` → `verify_jwt = false` |
| `supabase/functions/generate-script/index.ts` | getClaims + respostas HTTP 200 |
| `src/components/cliente/ScriptGeneratorDialog.tsx` | Simplificar error handling |
| `src/pages/cliente/ClienteScripts.tsx` | Simplificar error handling |
| `src/pages/cliente/ClientePlanoVendas.tsx` | Simplificar error handling |

