CREATE INDEX IF NOT EXISTS idx_crm_leads_kanban_v2
ON public.crm_leads(organization_id, funnel_id, stage, updated_at DESC)
WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_crm_tasks_lead_pending
ON public.crm_tasks(lead_id, due_date)
WHERE completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_crm_leads_org_active
ON public.crm_leads(organization_id, created_at DESC)
WHERE archived_at IS NULL;