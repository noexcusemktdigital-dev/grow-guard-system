# Runbook: pg_cron job não rodou ou falhou

**Severidade:** P1
**Aplica a:** Todos os jobs agendados via `pg_cron` no Supabase

## Sintoma

- Dados de cleanup não foram executados (tabelas crescendo sem limite)
- `idempotency_keys` expiradas não foram removidas
- `webhook_events` antigos acumulando
- Job não aparece no histórico de execuções
- Supabase Dashboard → Database → Cron Jobs mostra status `failed`

## Diagnóstico

```sql
-- Ver todos os jobs cadastrados
SELECT jobid, jobname, schedule, command, active
FROM cron.job
ORDER BY jobname;
```

```sql
-- Histórico de execuções recentes (últimas 24h)
SELECT
  j.jobname,
  r.start_time,
  r.end_time,
  r.status,
  r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
WHERE r.start_time > now() - interval '24 hours'
ORDER BY r.start_time DESC;
```

```sql
-- Jobs que falharam
SELECT j.jobname, r.start_time, r.status, r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
WHERE r.status = 'failed'
ORDER BY r.start_time DESC
LIMIT 20;
```

```sql
-- Verificar se pg_cron está ativo
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

## Mitigação

### Job falhou (erro no comando SQL)
1. Ler `return_message` para identificar o erro
2. Testar o comando manualmente:
   ```sql
   -- Exemplo: cleanup de idempotency_keys
   DELETE FROM idempotency_keys WHERE expires_at < now();
   ```
3. Corrigir o SQL no job:
   ```sql
   SELECT cron.alter_job(
     job_id := <JOBID>,
     command := 'DELETE FROM idempotency_keys WHERE expires_at < now()'
   );
   ```

### Job não executou (schedule errado ou job inativo)
```sql
-- Reativar job
SELECT cron.alter_job(job_id := <JOBID>, active := true);

-- Ver próxima execução (cron schedule)
-- Usar https://crontab.guru/ para validar expressão
```

### Executar job manualmente (emergência)
```sql
-- Cleanup manual de tabelas (executar com service_role)
DELETE FROM idempotency_keys WHERE expires_at < now();
DELETE FROM webhook_events WHERE received_at < now() - interval '90 days';
DELETE FROM cron.job_run_details WHERE start_time < now() - interval '7 days';
```

### Job não existe (foi perdido em migration/reset)
```sql
-- Recriar job de cleanup
SELECT cron.schedule(
  'cleanup-expired-idempotency-keys',
  '0 * * * *',  -- a cada hora
  'DELETE FROM idempotency_keys WHERE expires_at < now()'
);

SELECT cron.schedule(
  'cleanup-old-webhook-events',
  '0 2 * * *',  -- todo dia às 2h
  'DELETE FROM webhook_events WHERE received_at < now() - interval ''90 days'''
);
```

## Causa raiz comum

- Migration SQL modificou a tabela e o comando do job ficou inválido
- Supabase reset (paused project) perdeu os jobs
- pg_cron não habilitado no projeto (extensão não instalada)
- Permissão insuficiente: job roda como `postgres` mas tabela tem RLS ativo

## Prevenção

- Documentar todos os jobs em migration SQL versionada (não apenas via Dashboard)
- Após reset ou restore de projeto, verificar `SELECT * FROM cron.job` antes de ir pra produção
- Jobs de cleanup devem usar `service_role` ou ter RLS bypass explícito
