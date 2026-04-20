
-- ============================================================
-- PERF OPTIMIZATION PACK
-- ============================================================

-- 1) Remove o trigger HTTP que dispara crm-run-automations a cada
--    INSERT em crm_automation_queue. Esse trigger é a causa raiz
--    da avalanche de boots (centenas/min) e da saturação de workers.
--    A função já é executada por cron job a cada minuto, o que é suficiente.
DROP TRIGGER IF EXISTS trg_crm_automation_immediate ON public.crm_automation_queue;

-- 2) Índices para crm_automation_queue (978k seq_scans!)
CREATE INDEX IF NOT EXISTS idx_caq_org_processed_created
  ON public.crm_automation_queue (organization_id, processed, created_at)
  WHERE processed = false;

CREATE INDEX IF NOT EXISTS idx_caq_lead_trigger_created
  ON public.crm_automation_queue (lead_id, trigger_type, created_at DESC);

-- 3) Índices para client_notifications (19k seq_scans)
CREATE INDEX IF NOT EXISTS idx_client_notif_user_read_created
  ON public.client_notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_notif_org_created
  ON public.client_notifications (organization_id, created_at DESC);

-- 4) Índices para whatsapp_contacts (60k seq_scans)
CREATE INDEX IF NOT EXISTS idx_wa_contacts_org_created
  ON public.whatsapp_contacts (organization_id, created_at DESC);

-- 5) Índices para organization_memberships (1.5M seq_scans)
CREATE INDEX IF NOT EXISTS idx_org_memb_user
  ON public.organization_memberships (user_id);

CREATE INDEX IF NOT EXISTS idx_org_memb_org
  ON public.organization_memberships (organization_id);

-- 6) Índices para user_roles (24k seq_scans)
CREATE INDEX IF NOT EXISTS idx_user_roles_user
  ON public.user_roles (user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_org
  ON public.user_roles (user_id, organization_id);

-- 7) Índices para crm_automations (93k seq_scans)
CREATE INDEX IF NOT EXISTS idx_crm_automations_org_trigger_active
  ON public.crm_automations (organization_id, trigger_type, is_active)
  WHERE is_active = true;

-- 8) Índices para crm_leads (queries por org+stage+won/lost são frequentes)
CREATE INDEX IF NOT EXISTS idx_crm_leads_org_won_lost_updated
  ON public.crm_leads (organization_id, won_at, lost_at, updated_at);

-- 9) Limpeza: marcar como processados itens muito antigos da fila para
--    desafogar a tabela (eventos com mais de 7 dias provavelmente já não importam)
UPDATE public.crm_automation_queue
SET processed = true,
    last_error = COALESCE(last_error, 'auto_expired')
WHERE processed = false
  AND created_at < now() - interval '7 days';

-- 10) Vacuum analyze nas tabelas críticas para atualizar estatísticas
ANALYZE public.crm_automation_queue;
ANALYZE public.client_notifications;
ANALYZE public.whatsapp_contacts;
ANALYZE public.organization_memberships;
ANALYZE public.user_roles;
ANALYZE public.crm_automations;
