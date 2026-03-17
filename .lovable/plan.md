

## Plano: Exibir dados de pagamento inline na assinatura de planos

### Problema
Existem **dois problemas principais**:

1. **SubscriptionDialog fecha imediatamente** após criar a assinatura, sem mostrar o QR Code PIX, boleto ou link de pagamento por cartão. O usuário não tem como pagar diretamente na plataforma.

2. **Edge function `asaas-create-subscription`** não retorna os dados do primeiro pagamento gerado (invoice_url, PIX QR code, bank_slip_url). A API do Asaas, ao criar uma subscription, gera automaticamente o primeiro pagamento — mas a função não busca esses dados.

O fluxo de **compra de créditos** (`CreditPackDialog` + `asaas-buy-credits`) já funciona corretamente, pois mostra o `InlinePaymentView` com PIX/boleto/cartão.

### Solução

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/asaas-create-subscription/index.ts` | Após criar a subscription, buscar o primeiro pagamento via `GET /subscriptions/{id}/payments` e retornar `invoice_url`, `bank_slip_url`, `pix_qr_code_base64`, `pix_copy_paste` e `value` na resposta |
| `src/pages/cliente/ClientePlanoCreditos.tsx` | Converter `SubscriptionDialog` para funcionar como `CreditPackDialog`: ao invés de fechar o dialog no sucesso, exibir o `InlinePaymentView` com os dados de pagamento retornados |

### Detalhes técnicos

**`asaas-create-subscription/index.ts`** — após criar subscription, buscar primeiro pagamento:
```typescript
// Fetch first payment from the subscription
let invoiceUrl = null;
let bankSlipUrl = null;
let pixQrCodeBase64 = null;
let pixCopyPaste = null;

const paymentsRes = await asaasFetch(`${ASAAS_BASE}/subscriptions/${subscriptionData.id}/payments`, {
  method: "GET",
  headers: { access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
});
if (paymentsRes.ok) {
  const paymentsData = await paymentsRes.json();
  const firstPayment = paymentsData.data?.[0];
  if (firstPayment) {
    invoiceUrl = firstPayment.invoiceUrl;
    bankSlipUrl = firstPayment.bankSlipUrl;
    // For PIX, fetch QR code
    if (billing_type === "PIX" && firstPayment.id) {
      const pix = await fetchPixQrCode(asaasApiKey, firstPayment.id);
      pixQrCodeBase64 = pix.encodedImage;
      pixCopyPaste = pix.payload;
    }
  }
}

// Return with payment data
return { 
  success: true,
  invoice_url: invoiceUrl,
  bank_slip_url: bankSlipUrl,
  pix_qr_code_base64: pixQrCodeBase64,
  pix_copy_paste: pixCopyPaste,
  value: finalPrice,
  billing_type,
  ...
};
```

**`ClientePlanoCreditos.tsx` — SubscriptionDialog** — adicionar estado `paymentResult` e mostrar `InlinePaymentView`:
```tsx
const [paymentResult, setPaymentResult] = useState<any>(null);

// onSuccess: instead of closing, show payment view
onSuccess: (data) => {
  toast.success("Cobrança gerada! Créditos serão liberados após confirmação.");
  setPaymentResult(data);
  qc.invalidateQueries(...);
  // Do NOT close dialog
},

// In render:
{paymentResult ? (
  <InlinePaymentView result={paymentResult} billingType={billingType} onClose={() => handleClose(false)} />
) : (
  // existing form
)}
```

### Fluxo resultante
1. Usuário escolhe plano → seleciona PIX/Boleto/Cartão → clica "Confirmar"
2. Edge function cria subscription + busca primeiro pagamento
3. Dialog exibe: QR Code PIX / iframe do boleto / iframe do cartão (invoice_url)
4. Pagamento confirmado pelo Asaas via webhook → créditos liberados

