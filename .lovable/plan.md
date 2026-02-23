

# Corrigir Webhook para Retornar 200

## Problema

Quando o Asaas envia um evento para um `asaas_customer_id` que ainda nao esta vinculado a nenhuma organizacao, o webhook retorna status **404**. O Asaas interpreta isso como erro e envia alertas por email.

## Solucao

Alterar a resposta de "organizacao nao encontrada" de **404** para **200**, com uma mensagem informativa no body. O log de warning continua no console para debug interno, mas o Asaas para de reportar como falha.

## Detalhe tecnico

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/asaas-webhook/index.ts` | Trocar `status: 404` por `status: 200` na linha 68, e ajustar a mensagem para `{ ok: true, skipped: true, reason: "Organization not found for customer" }` |

Apenas 1 linha precisa mudar. O comportamento interno permanece o mesmo (log de warning + nenhuma acao no banco).

