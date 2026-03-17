

## Plano: Liberar créditos somente após confirmação de pagamento

### Problema

Duas Edge Functions adicionam créditos **imediatamente** ao criar a cobrança, antes do pagamento ser confirmado:

1. **`asaas-create-subscription`** (linhas 248-267): Ao criar a assinatura, já soma créditos do plano na wallet e marca status como "active". O webhook depois adiciona créditos **novamente** no PAYMENT_CONFIRMED → resultado: créditos duplicados.

2. **`asaas-create-charge`** (não adiciona créditos — está correto).

3. **`asaas-buy-credits`** (não adiciona créditos — está correto). O webhook já trata a liberação de créditos corretamente para packs.

### Solução

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/asaas-create-subscription/index.ts` | Remover linhas 248-267 que adicionam créditos e marcam status "active". Marcar subscription como `pending_payment` em vez de `active`. Status e créditos serão liberados pelo webhook. |
| `supabase/functions/asaas-webhook/index.ts` | No bloco `sub` do PAYMENT_CONFIRMED (linhas 220-313): já está correto — ativa subscription e libera créditos. Nenhuma mudança necessária. |
| `src/pages/cliente/ClientePlanoCreditos.tsx` | Ajustar toast de sucesso para informar "Cobrança gerada! Créditos serão liberados após confirmação do pagamento." em vez de "Plano ativado!". |

### Detalhes técnicos

**`asaas-create-subscription/index.ts`** — remover bloco de créditos e mudar status:
```typescript
// ANTES: status "active" + créditos imediatos
// DEPOIS: status "pending_payment", sem créditos
await adminClient
  .from("subscriptions")
  .update({
    plan,
    status: "pending_payment",  // ← era "active"
    modules: null,
    sales_plan: null,
    marketing_plan: null,
    asaas_subscription_id: subscriptionData.id,
    asaas_billing_type: billing_type,
    expires_at: expiresAt.toISOString(),
    discount_percent: discountPercent,
    referral_org_id: referralOrgId,
  })
  .eq("organization_id", org.id);

// REMOVIDO: bloco que adicionava créditos (linhas 248-267)
```

**Frontend** — ajustar mensagem:
```typescript
onSuccess: (data) => {
  toast.success("Cobrança gerada! Seus créditos serão liberados após a confirmação do pagamento.");
  // ...
}
```

Isso garante que para **todos os fluxos** (assinatura, recarga de créditos, cobranças avulsas), os créditos só são liberados quando o Asaas confirma o pagamento via webhook.

