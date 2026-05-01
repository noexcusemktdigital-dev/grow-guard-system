-- Remove existing schedule if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'billing-reminder-cron') THEN
    PERFORM cron.unschedule('billing-reminder-cron');
  END IF;
END $$;

-- Schedule daily billing reminder check at 09:00 UTC
SELECT cron.schedule(
  'billing-reminder-cron',
  '0 9 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/billing-reminder-check',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);