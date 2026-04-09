-- Migration: Google Ads Metrics Cron Job — Phase 5
-- Sistema Noe / Noexcuse — 2026-04-08
-- pg_cron job for social-ads-metrics (daily Google Ads campaign performance sync)

-- Extensions already enabled by 20260408730000_social_cron_jobs.sql
-- Idempotent re-enable just in case
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Daily Google Ads metrics sync at 6:30 AM UTC (30 min after social-metrics-sync)
-- Calls social-ads-metrics edge function with CRON_SECRET auth
SELECT cron.schedule(
  'social-ads-metrics-daily',
  '30 6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/social-ads-metrics',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
