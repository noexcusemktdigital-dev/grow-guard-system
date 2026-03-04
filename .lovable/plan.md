

# Melhorar Tratamento de Chargebacks e Estornos no Webhook Asaas

## Status: ✅ Implementado

### O que foi corrigido

| Evento | Notifica Admin | Reverte Créditos | Atualiza Status |
|--------|:-:|:-:|:-:|
| CHARGEBACK_REQUESTED | ✅ | ✅ | ✅ |
| REFUNDED | ✅ | ✅ | ✅ |
| REFUND_IN_PROGRESS | ✅ | — | — |

### Refatorações aplicadas
- Extraída `notifyOrgMembers()` — reutilizada em todos os handlers
- Extraída `updatePaymentStatus()` — atualiza `client_payments`, `franchisee_system_payments` ou `franchisee_charges` conforme `externalReference`
- Chargeback agora reverte créditos e atualiza status para `"chargeback"`
- Refund agora notifica membros, atualiza status para `"refunded"` e insere `finance_revenue` negativa para `client_payment`
- Novo evento `PAYMENT_REFUND_IN_PROGRESS` registra log e notifica membros
