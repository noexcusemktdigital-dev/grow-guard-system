

# Melhorar Tratamento de Chargebacks e Estornos no Webhook Asaas

## Situação Atual

O webhook já trata `PAYMENT_CHARGEBACK_REQUESTED` e `PAYMENT_REFUNDED`, mas com lacunas:

| Evento | Notifica Admin | Reverte Créditos | Atualiza Status do Pagamento |
|--------|:-:|:-:|:-:|
| CHARGEBACK_REQUESTED | ✅ | ❌ | ❌ |
| REFUNDED | ❌ | ✅ | ❌ |

## O que será corrigido

### 1. Chargeback completo
- **Reverter créditos** da wallet (como já faz no refund)
- **Atualizar status** de `client_payments`, `franchisee_system_payments` ou `franchisee_charges` para `"chargeback"` baseado no `externalReference`
- Manter notificação existente

### 2. Refund completo
- **Adicionar notificação** para todos os membros da org (hoje só reverte créditos silenciosamente)
- **Atualizar status** dos registros de pagamento para `"refunded"` baseado no `externalReference`
- Para `client_payments`, também inserir receita negativa em `finance_revenues`

### 3. Novos eventos Asaas
- `PAYMENT_REFUND_IN_PROGRESS` — registrar log e notificar que estorno está em andamento

## Arquivo modificado

| Arquivo | Ação |
|---------|------|
| `supabase/functions/asaas-webhook/index.ts` | Expandir handlers de chargeback e refund com reversão de status + notificações |

## Lógica principal

```text
CHARGEBACK_REQUESTED:
  1. Notifica membros (já existe)
  2. Reverte créditos via externalReference ou valueToCreditAmount (NOVO)
  3. Atualiza status do pagamento original para "chargeback" (NOVO)
  4. Registra credit_transaction (já existe)

REFUNDED:
  1. Reverte créditos (já existe)
  2. Notifica membros com detalhes do estorno (NOVO)
  3. Atualiza status do pagamento para "refunded" (NOVO)
  4. Para client_payment: insere finance_revenue negativa (NOVO)

REFUND_IN_PROGRESS (NOVO):
  1. Notifica membros que estorno está sendo processado
  2. Registra log em credit_transactions
```

