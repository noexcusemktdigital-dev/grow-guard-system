
-- Enable pg_net extension for async HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Add followup_config column to whatsapp_contacts if not exists
ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS followup_config jsonb DEFAULT NULL;
