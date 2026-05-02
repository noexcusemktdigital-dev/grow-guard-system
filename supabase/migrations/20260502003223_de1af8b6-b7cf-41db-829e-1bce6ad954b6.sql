
-- Relax cron schedules: agent-followup 15→30min, crm-run-automations 5→10min
DO $$
DECLARE
  v_jobid BIGINT;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'agent-followup-cron';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(v_jobid, schedule := '*/30 * * * *');
  END IF;

  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'crm-run-automations';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(v_jobid, schedule := '*/10 * * * *');
  END IF;
END $$;
