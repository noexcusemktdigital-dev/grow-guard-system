# Runbook: Investigar entries em job_failures (DLQ)

**Severidade:** P2
**Aplica a:** `job_failures` table — Dead Letter Queue do Sistema Noé

## Sintoma

- Contagem em `job_failures` cresce sem ser zerada
- Alertas automáticos de DLQ com jobs em estado `failed` há >1h
- Feature específica parou de funcionar (ex: notificações, sync de dados)
- Usuário reporta ação que "não aconteceu" após confirmação visual

## Diagnóstico

```sql
-- Visão geral do DLQ agrupado por tipo de erro
SELECT
  job_type,
  error_code,
  count(*) AS count,
  min(failed_at) AS oldest,
  max(failed_at) AS newest
FROM job_failures
WHERE resolved_at IS NULL
GROUP BY job_type, error_code
ORDER BY count DESC;
```

```sql
-- Detalhes dos jobs mais recentes não resolvidos
SELECT
  id,
  job_type,
  payload,
  error_message,
  error_code,
  attempt_count,
  failed_at,
  last_attempted_at
FROM job_failures
WHERE resolved_at IS NULL
ORDER BY failed_at DESC
LIMIT 20;
```

```sql
-- Jobs de um tipo específico com payload completo
SELECT id, payload, error_message, attempt_count, failed_at
FROM job_failures
WHERE job_type = '<JOB_TYPE>'
  AND resolved_at IS NULL
ORDER BY failed_at DESC;
```

## Análise por tipo de erro

### `network_timeout` ou `connection_refused`
- Serviço externo (Asaas, Meta API, etc.) estava fora do ar
- Verificar status pages dos providers
- Reprocessar após serviço voltar (ver mitigação abaixo)

### `invalid_payload` ou `schema_validation_failed`
- Payload do job está malformado
- Analisar o campo `payload` do job para identificar dado inválido
- Pode ser bug em code path que enfileirou o job
- NÃO reprocessar automaticamente — investigar código primeiro

### `permission_denied` ou `rls_violation`
- Job está tentando acessar dados sem permissão adequada
- Verificar se `service_role` está sendo usado onde necessário
- Pode indicar mudança de RLS policy sem atualizar workers

### `duplicate_key` ou `unique_violation`
- Job foi enfileirado 2× (problema de idempotência upstream)
- Marcar como resolvido sem reprocessar (dado já existe)

## Mitigação

### Reprocessar jobs com erro transiente (timeout, network)
```sql
-- Marcar para retry (zerar attempt_count para nova tentativa)
UPDATE job_failures
SET
  attempt_count = 0,
  last_attempted_at = NULL,
  error_message = 'Manual retry by ops: ' || error_message
WHERE job_type = '<JOB_TYPE>'
  AND error_code IN ('network_timeout', 'connection_refused')
  AND resolved_at IS NULL;
```

### Marcar como resolvido sem reprocessar (duplicatas, stale jobs)
```sql
UPDATE job_failures
SET resolved_at = now(), resolution_note = 'Closed: duplicate entry, data already exists'
WHERE id IN ('<ID1>', '<ID2>');
```

### Limpar DLQ de jobs antigos sem valor
```sql
-- Jobs com mais de 30 dias sem resolução (dado provavelmente stale)
UPDATE job_failures
SET resolved_at = now(), resolution_note = 'Auto-closed: stale job >30 days'
WHERE failed_at < now() - interval '30 days'
  AND resolved_at IS NULL;
```

## Causa raiz comum

- Provider externo temporariamente fora do ar (Asaas, Meta API)
- Bug introduzido em código que gera payload do job (schema inválido)
- Mudança de tabela sem migrar workers (RLS ou coluna renomeada)
- Falta de idempotência upstream duplicando jobs

## Prevenção

- Alerta: `job_failures WHERE resolved_at IS NULL AND failed_at < now() - interval '30 min'` → notify
- Revisar DLQ semanalmente — não deixar acumular
- Todos os jobs devem ser idempotentes (reprocessamento seguro)
- Monitorar `attempt_count > 3` como sinal de problema sistêmico
