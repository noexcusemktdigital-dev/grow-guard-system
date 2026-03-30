

## Correção — Não consegue cancelar/editar cobranças do Asaas pelo sistema

### Causa raiz

Mesmo bug das funções anteriores: `asaas-manage-payment` tem `verify_jwt = true` no `supabase/config.toml` (linha 37). O gateway rejeita o JWT antes da função executar. Além disso, as respostas de erro usam status HTTP não-200, fazendo o SDK perder o body da mensagem.

### Solução

1. **`supabase/config.toml`** — Mudar `verify_jwt` de `true` para `false` na função `asaas-manage-payment`

2. **`supabase/functions/asaas-manage-payment/index.ts`** — Mesmo padrão das funções corrigidas:
   - Trocar `anonClient.auth.getUser()` por extração manual do token + validação
   - Mudar todas as respostas de erro para HTTP 200 com `{ error: "mensagem" }` no body

3. **`src/hooks/useClientPayments.ts`** — O `useManagePayment` já lê `data?.error` corretamente, mas precisa do mesmo refresh de sessão que as outras mutations têm

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/config.toml` | `asaas-manage-payment` → `verify_jwt = false` |
| `supabase/functions/asaas-manage-payment/index.ts` | Auth manual + respostas HTTP 200 |
| `src/hooks/useClientPayments.ts` | Verificar consistência do error handling |

