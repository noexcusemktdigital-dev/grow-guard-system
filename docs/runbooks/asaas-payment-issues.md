# Runbook: Cobrança Asaas duplicada ou falhou

**Severidade:** P1
**Aplica a:** `asaas-buy-credits`, `recharge-credits`, `asaas-create-charge`, `asaas-webhook`

## Sintoma

- Cliente reporta cobrança duplicada no cartão/boleto
- Pagamento Asaas `CONFIRMED` mas créditos não foram creditados na wallet
- Webhook Asaas reentrante processou 2× o mesmo evento
- Saldo negativo inesperado em `credit_wallets`

## Diagnóstico

### Cobrança duplicada
```sql
-- Verificar idempotency keys do user
SELECT key, fn_name, response_status, created_at, expires_at
FROM idempotency_keys
WHERE user_id = '<USER_UUID>'
ORDER BY created_at DESC
LIMIT 20;
```
Se key não existe pra mutação esperada → frontend NÃO enviou `Idempotency-Key` header.

### Pagamento approved mas créditos faltam
```sql
-- Eventos webhook recebidos
SELECT external_event_id, received_at, processed_at, payload_hash
FROM webhook_events
WHERE provider = 'asaas'
  AND received_at > now() - interval '1 day'
ORDER BY received_at DESC;
```
`processed_at IS NULL` = recebido mas não processado completamente.

### Verificar transações da wallet
```sql
SELECT ct.*, cw.balance
FROM credit_transactions ct
JOIN credit_wallets cw ON cw.organization_id = ct.organization_id
WHERE ct.organization_id = '<ORG_UUID>'
ORDER BY ct.created_at DESC
LIMIT 20;
```

### Webhook reentrante
Tabela `webhook_events` tem constraint UNIQUE em `(provider, external_event_id)` — se fn está processando 2x, é bug na fn ou race condition.
```
Lovable Dashboard → Functions → asaas-webhook → Logs
Buscar: external_event_id duplicado
```

## Mitigação

### Devolver cobrança duplicada
1. Asaas Dashboard → Cobranças → identificar 2× charges com mesmo valor/data
2. Estornar a duplicada via Asaas UI (ou API DELETE /charges/{id})
3. NÃO deletar entradas em `idempotency_keys` (manter histórico de auditoria)

### Creditar manualmente (créditos não chegaram)
```sql
-- 1. Verificar saldo atual
SELECT balance, organization_id FROM credit_wallets WHERE organization_id = '<ORG_UUID>';

-- 2. Inserir transação de crédito (executar com service_role)
INSERT INTO credit_transactions (organization_id, amount, kind, description, created_by)
VALUES ('<ORG_UUID>', 100, 'asaas_payment', 'Manual fix: charge <ASAAS_CHARGE_ID> confirmed, webhook failed', '<ADMIN_USER_UUID>');
```

### Reprocessar webhook perdido
Se `processed_at IS NULL` há >5min, o evento ficou preso. Verificar logs da fn para erro. Corrigir causa e reprocessar via Asaas Dashboard → Webhooks → Reenviar.

## Causa raiz comum

- Frontend não enviou `Idempotency-Key` header (PR de frontend-idempotency-key não deployed)
- Asaas webhook secret incorreta (passou checksum, mas processou com dados errados)
- Edge fn timeout no meio do processamento (créditos não chegaram a ser inseridos)
- Race condition: dois POSTs simultâneos antes do lock de idempotência

## Prevenção

- Synthetic test: invocar `asaas-buy-credits` 2× rápido → assert 1 cobrança no Asaas
- Alerta: `webhook_events.processed_at IS NULL` há > 5min → investigar
- Monitor: `credit_transactions` com `kind = 'asaas_payment'` sem par `webhook_events.processed_at` → drift alert
