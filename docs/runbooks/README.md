# Runbooks — Sistema Noé

Playbooks operacionais para incidentes recorrentes.

## Índice

| Runbook | Cenário | Severidade |
|---------|---------|------------|
| [webhook-hmac-failed](webhook-hmac-failed.md) | Webhooks Meta/WhatsApp rejeitando 100% | P0 |
| [asaas-payment-issues](asaas-payment-issues.md) | Cobrança duplicada / charge falhou | P1 |
| [idempotency-conflicts](idempotency-conflicts.md) | 409 idempotency_key_conflict no frontend | P2 |
| [rate-limit-tuning](rate-limit-tuning.md) | 429 burst em generate-* fns | P2 |
| [dsr-processing](dsr-processing.md) | Como atender Data Subject Request manual | P3 |
| [pg-cron-failures](pg-cron-failures.md) | Cron job não rodou ou falhou | P1 |
| [dlq-investigation](dlq-investigation.md) | Investigar entries em job_failures | P2 |
| [secret-rotation](secret-rotation.md) | Como rotacionar secrets Lovable | P0 |

## Padrão

Cada runbook:
- **Sintoma**: como o problema se manifesta
- **Diagnóstico**: queries/comandos pra confirmar
- **Mitigação**: passos para resolver agora
- **Causa raiz**: investigação pós-incidente
- **Prevenção**: o que mudar pra não acontecer de novo

## Severidade

- P0: production down or compromised
- P1: feature crítica afetada
- P2: degradação parcial
- P3: melhorias

## Como criar runbook novo

1. Copiar template (qualquer arquivo existente)
2. Adicionar entrada no índice acima
3. PR + review
