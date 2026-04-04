

## Plano — Cobrança automática de R$45/mês (WhatsApp Izitech) via Asaas

### Contexto

Atualmente, ao integrar WhatsApp via Izitech, a instância é criada mas nenhuma cobrança é gerada. O fluxo de cobrança precisa ser idêntico ao dos planos (Starter/Pro/Enterprise), usando a mesma infraestrutura Asaas (criar assinatura recorrente, gerar PIX/boleto, confirmar via webhook).

### Arquitetura da solução

```text
WhatsAppSetupWizard (step 3, após conectar)
  └─ Chama edge function "asaas-create-subscription" 
     com tipo especial: plan = "whatsapp" 
  └─ Asaas cria assinatura recorrente de R$45/mês
  └─ Exibe QR PIX / boleto inline no wizard

asaas-webhook (PAYMENT_CONFIRMED)
  └─ Reconhece externalReference "{orgId}|sub|whatsapp"
  └─ Marca whatsapp_subscription como ativo
```

### Mudanças

#### 1. `supabase/functions/asaas-create-subscription/index.ts`

Adicionar `whatsapp: 45` ao mapa `PLAN_PRICES`. Quando `plan === "whatsapp"`:
- Descrição: `"WhatsApp Izitech — NOE"`
- externalReference: `"{orgId}|sub|whatsapp"`
- NÃO atualizar a tabela `subscriptions` (o plano principal é separado)
- Em vez disso, salvar na tabela `whatsapp_instances` um campo `asaas_subscription_id`
- Pular créditos (WhatsApp não dá créditos)

#### 2. `supabase/functions/asaas-webhook/index.ts`

No bloco `refParts[1] === "sub"` e `planSlug === "whatsapp"`:
- NÃO atualizar `subscriptions` nem adicionar créditos
- Atualizar `whatsapp_instances` → `billing_status = 'active'`
- Log: "WhatsApp billing confirmed for org {id}"

#### 3. Migração SQL

Adicionar colunas à tabela `whatsapp_instances`:
- `asaas_subscription_id text`
- `billing_status text default 'pending'`

#### 4. `src/components/cliente/WhatsAppSetupWizard.tsx`

Após a instância ser conectada com sucesso (step 3, quando `izitechConnected = true`):
- Mostrar seção de pagamento com seleção de método (PIX, Boleto, Cartão)
- Chamar `supabase.functions.invoke("asaas-create-subscription", { body: { organization_id, plan: "whatsapp", billing_type } })`
- Exibir QR PIX / link de boleto inline (reutilizar componente `InlinePaymentView` do ClientePlanoCreditsHelpers)
- Mensagem: "Sua integração WhatsApp ficará ativa após confirmação do pagamento de R$45/mês"

#### 5. `src/pages/cliente/ClienteIntegracoes.tsx`

Exibir badge de status de pagamento nos cards de instância:
- `billing_status === 'active'` → Badge verde "Pago"
- `billing_status === 'pending'` → Badge amarela "Pagamento pendente"

### Fluxo completo

1. Usuário escolhe Izitech → digita nome → cria instância → escaneia QR → conecta
2. Wizard mostra tela de pagamento: "Escolha como pagar R$45/mês"
3. Usuário seleciona PIX/Boleto → sistema gera cobrança no Asaas
4. Exibe QR PIX ou link do boleto
5. Webhook confirma pagamento → marca `billing_status = 'active'`

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| Migração SQL | Adicionar `asaas_subscription_id` e `billing_status` em `whatsapp_instances` |
| `supabase/functions/asaas-create-subscription/index.ts` | Suportar `plan: "whatsapp"` (R$45, sem créditos) |
| `supabase/functions/asaas-webhook/index.ts` | Tratar `whatsapp` no bloco de subscription |
| `src/components/cliente/WhatsAppSetupWizard.tsx` | Adicionar step de pagamento após conexão |
| `src/pages/cliente/ClienteIntegracoes.tsx` | Badge de billing status nos cards |

