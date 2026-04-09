-- Migration: Social Cron Jobs — Phase 4
-- Sistema Noe / Noexcuse — 2026-04-08
-- pg_cron jobs for social-metrics-sync and social-token-refresh

-- Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Daily metrics sync at 6 AM UTC
-- Calls social-metrics-sync edge function
SELECT cron.schedule(
  'social-metrics-sync-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/social-metrics-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Token refresh daily at 2 AM UTC
-- Calls social-token-refresh edge function (no auth required — handled internally)
SELECT cron.schedule(
  'social-token-refresh-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/social-token-refresh',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
