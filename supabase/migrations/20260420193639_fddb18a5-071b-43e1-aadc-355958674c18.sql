
-- =========================================================
-- FASE 1: ÍNDICES CRÍTICOS
-- =========================================================

-- Fila de automações: 94% sequential scans
CREATE INDEX IF NOT EXISTS idx_crm_queue_org_unprocessed
  ON public.crm_automation_queue(organization_id, created_at)
  WHERE processed = false;

CREATE INDEX IF NOT EXISTS idx_crm_queue_lead
  ON public.crm_automation_queue(lead_id);

CREATE INDEX IF NOT EXISTS idx_crm_queue_retry
  ON public.crm_automation_queue(next_retry_at)
  WHERE processed = false AND next_retry_at IS NOT NULL;

-- Notificações não lidas (75% seq scans)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.client_notifications(user_id, created_at DESC)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_org_user
  ON public.client_notifications(organization_id, user_id, created_at DESC);

-- Mensagens WhatsApp (95% seq scans)
CREATE INDEX IF NOT EXISTS idx_whatsapp_msgs_contact_date
  ON public.whatsapp_messages(organization_id, contact_id, created_at DESC);

-- Histórico CRM
CREATE INDEX IF NOT EXISTS idx_crm_lead_history_lead
  ON public.crm_lead_history(lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crm_lead_history_org_date
  ON public.crm_lead_history(organization_id, created_at DESC);

-- Logs de execução de automação
CREATE INDEX IF NOT EXISTS idx_automation_logs_org_date
  ON public.automation_execution_logs(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_logs_lead
  ON public.automation_execution_logs(lead_id);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_date
  ON public.audit_logs(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_date
  ON public.audit_logs(table_name, created_at DESC);

-- CRM Leads
CREATE INDEX IF NOT EXISTS idx_crm_leads_org_stage
  ON public.crm_leads(organization_id, stage, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned
  ON public.crm_leads(assigned_to, organization_id)
  WHERE assigned_to IS NOT NULL;

-- =========================================================
-- FUNÇÃO DE TTL
-- =========================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_history_deleted bigint := 0;
  v_auto_logs_deleted bigint := 0;
  v_auto_log_legacy_deleted bigint := 0;
  v_audit_deleted bigint := 0;
  v_queue_deleted bigint := 0;
BEGIN
  DELETE FROM public.crm_lead_history
  WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_history_deleted = ROW_COUNT;

  DELETE FROM public.automation_execution_logs
  WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_auto_logs_deleted = ROW_COUNT;

  BEGIN
    DELETE FROM public.automation_execution_log
    WHERE executed_at < now() - interval '90 days';
    GET DIAGNOSTICS v_auto_log_legacy_deleted = ROW_COUNT;
  EXCEPTION WHEN undefined_table THEN
    v_auto_log_legacy_deleted := 0;
  END;

  DELETE FROM public.audit_logs
  WHERE created_at < now() - interval '180 days';
  GET DIAGNOSTICS v_audit_deleted = ROW_COUNT;

  DELETE FROM public.crm_automation_queue
  WHERE processed = true
    AND created_at < now() - interval '30 days';
  GET DIAGNOSTICS v_queue_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'crm_lead_history_deleted', v_history_deleted,
    'automation_logs_deleted', v_auto_logs_deleted,
    'automation_log_legacy_deleted', v_auto_log_legacy_deleted,
    'audit_logs_deleted', v_audit_deleted,
    'crm_queue_processed_deleted', v_queue_deleted,
    'cleaned_at', now()
  );
END;
$$;

-- =========================================================
-- AGENDAR TTL SEMANAL
-- =========================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('weekly-cleanup-old-logs')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-cleanup-old-logs');

    PERFORM cron.schedule(
      'weekly-cleanup-old-logs',
      '0 3 * * 0',
      $cron$ SELECT public.cleanup_old_logs(); $cron$
    );
  END IF;
END $$;

-- =========================================================
-- ATUALIZAR ESTATÍSTICAS
-- =========================================================

ANALYZE public.crm_automation_queue;
ANALYZE public.crm_automations;
ANALYZE public.crm_leads;
ANALYZE public.crm_lead_history;
ANALYZE public.client_notifications;
ANALYZE public.whatsapp_messages;
ANALYZE public.automation_execution_logs;
ANALYZE public.audit_logs;
