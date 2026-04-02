

## Plano — Corrigir erro de pagamento (assinatura de planos)

### Diagnóstico

Dois problemas encontrados:

1. **`verify_jwt = true` no config.toml** — A edge function `asaas-create-subscription` está configurada com `verify_jwt = true`, o que faz o Supabase validar o JWT na infraestrutura antes de o código rodar. Com o sistema de signing-keys do Lovable Cloud, isso causa falha silenciosa (non-2xx status). Os logs mostram boot/shutdown sem nenhum log de request, confirmando que a requisição nunca chega ao código.

2. **Preços desatualizados na edge function** — O frontend usa `UNIFIED_PLANS` com preços R$349, R$739, R$1429, mas a edge function tem hardcoded `starter: 397, pro: 797, enterprise: 1497`. Isso causaria erro "Invalid plan tier" ou cobrança com valor errado.

### Correção

#### 1. Remover `verify_jwt = true` das funções de pagamento no config.toml

Remover (ou setar para `false`) as entradas de `verify_jwt` para:
- `asaas-create-subscription`
- `asaas-create-charge`
- Qualquer outra função de pagamento com `verify_jwt = true`

A autenticação já é feita manualmente no código via `userClient.auth.getUser()`.

#### 2. Atualizar PLAN_PRICES na edge function

Sincronizar os preços com os valores reais:
```
starter: 349
pro: 739
enterprise: 1429
```

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/config.toml` | Remover `verify_jwt = true` das funções de pagamento |
| `supabase/functions/asaas-create-subscription/index.ts` | Atualizar `PLAN_PRICES` para 349/739/1429 |

### Resultado

- Clientes e franqueados conseguem assinar planos via PIX, Boleto e Cartão
- Preços cobrados correspondem aos exibidos na interface

