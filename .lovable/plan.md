# Plano do Projeto NOE

## P11 — Correção Integração Asaas ✅

**Status: Implementado**

Correções aplicadas:
1. ✅ Helper `getOrCreateAsaasCustomer` em `_shared/asaas-customer.ts` — previne duplicatas via busca por `externalReference`
2. ✅ Helper `fetchPixQrCode` com retry (2x, 1.5s delay)
3. ✅ Validação de CPF/CNPJ obrigatório (removido fallback "00000000000")
4. ✅ Auth padronizada com `getClaims()` em todas as functions
5. ✅ Webhook: token validado ANTES do parse do body
6. ✅ Webhook: `PAYMENT_CHARGEBACK_REQUESTED` com notificação
7. ✅ Webhook: parse de `externalReference` para credit packs (`{orgId}|credits|{packId}`)
8. ✅ Webhook: parse de `extra_user` charges
9. ✅ `valueToCreditAmount` mantido como fallback legado

### Arquivos modificados
- `supabase/functions/_shared/asaas-customer.ts` (novo)
- `supabase/functions/asaas-create-charge/index.ts`
- `supabase/functions/asaas-create-subscription/index.ts`
- `supabase/functions/asaas-charge-system-fee/index.ts`
- `supabase/functions/asaas-charge-client/index.ts`
- `supabase/functions/asaas-list-payments/index.ts`
- `supabase/functions/asaas-webhook/index.ts`
