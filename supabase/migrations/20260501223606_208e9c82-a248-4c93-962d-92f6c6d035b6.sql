-- 1. Drop tabela antiga já renomeada (libera 8.3 GB)
DROP TABLE IF EXISTS public.automation_execution_logs_old CASCADE;

-- 2. Reset da queue (mantém só pendentes)
CREATE TABLE public.crm_automation_queue_new AS
SELECT * FROM public.crm_automation_queue
WHERE processed = false 
   OR (processed IS NULL AND created_at >= now() - interval '24 hours');

ALTER TABLE public.crm_automation_queue RENAME TO crm_automation_queue_old;
ALTER TABLE public.crm_automation_queue_new RENAME TO crm_automation_queue;
ALTER TABLE public.crm_automation_queue ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_crm_automation_queue_pending 
  ON public.crm_automation_queue (created_at) 
  WHERE processed = false OR processed IS NULL;
DROP TABLE IF EXISTS public.crm_automation_queue_old CASCADE;

-- 3. Reset histórico de leads (mantém 90 dias)
CREATE TABLE public.crm_lead_history_new AS
SELECT * FROM public.crm_lead_history WHERE created_at >= now() - interval '90 days';
ALTER TABLE public.crm_lead_history RENAME TO crm_lead_history_old;
ALTER TABLE public.crm_lead_history_new RENAME TO crm_lead_history;
ALTER TABLE public.crm_lead_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_crm_lead_history_lead_created 
  ON public.crm_lead_history (lead_id, created_at DESC);
DROP TABLE IF EXISTS public.crm_lead_history_old CASCADE;

-- 4. Notificações lidas > 60 dias
DELETE FROM public.client_notifications 
WHERE is_read = true AND created_at < now() - interval '60 days';

-- 5. Função retention diária
CREATE OR REPLACE FUNCTION public.daily_retention_cleanup()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_logs bigint:=0; v_queue bigint:=0; v_history bigint:=0; v_notif bigint:=0;
BEGIN
  DELETE FROM public.automation_execution_logs WHERE created_at < now() - interval '3 days';
  GET DIAGNOSTICS v_logs = ROW_COUNT;
  DELETE FROM public.crm_automation_queue WHERE processed = true AND created_at < now() - interval '24 hours';
  GET DIAGNOSTICS v_queue = ROW_COUNT;
  DELETE FROM public.crm_lead_history WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_history = ROW_COUNT;
  DELETE FROM public.client_notifications WHERE is_read = true AND created_at < now() - interval '60 days';
  GET DIAGNOSTICS v_notif = ROW_COUNT;
  RETURN jsonb_build_object('logs',v_logs,'queue',v_queue,'history',v_history,'notifications',v_notif,'cleaned_at',now());
END; $$;

-- 6. Agendar diária 03:00
DO $$ BEGIN PERFORM cron.unschedule('daily-retention-v2'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule('daily-retention-v2', '0 3 * * *', $$ SELECT public.daily_retention_cleanup(); $$);

-- 7. Índices compostos hot-path
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles (user_id, role);
CREATE INDEX IF NOT EXISTS idx_org_members_user_org ON public.organization_memberships (user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_user_unread
  ON public.client_notifications (user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_crm_leads_org_stage_updated
  ON public.crm_leads (organization_id, stage, updated_at DESC);