# Cron schedule reduction (FIX 4)

Quando o DB voltar a aceitar conexões, rode o SQL abaixo via SQL Editor do
backend (Lovable Cloud → SQL). Substitua os jobnames pelos exatos retornados
em `SELECT jobname FROM cron.job;` se forem diferentes.

```sql
-- Lista os jobs atuais
SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobname;

-- agent-followup-cron: 15min → 30min
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'agent-followup-cron' LIMIT 1),
  schedule := '*/30 * * * *'
);

-- crm-run-automations: 5min → 10min
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'crm-run-automations' LIMIT 1),
  schedule := '*/10 * * * *'
);

-- process-email-queue: 5min → 10min
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'process-email-queue' LIMIT 1),
  schedule := '*/10 * * * *'
);
```

Os early-exits no código (já aplicados) garantem que cada execução custe ~1
query leve (`SELECT count head:true`) quando não há trabalho a fazer.
