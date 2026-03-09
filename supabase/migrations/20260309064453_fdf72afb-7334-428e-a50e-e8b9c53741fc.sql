-- 1. Add missing indexes for CRM scalability
CREATE INDEX IF NOT EXISTS idx_crm_activities_org ON crm_activities (organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org ON crm_contacts (organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_org ON crm_tasks (organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_org_stage ON crm_leads (organization_id, stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_org_funnel ON crm_leads (organization_id, funnel_id);

-- 2. Add archived_at column for lead archiving
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_leads_archived ON crm_leads (archived_at) WHERE archived_at IS NULL;

-- 3. Create RPC for bulk tag addition (single query instead of N mutations)
CREATE OR REPLACE FUNCTION public.bulk_add_tag(_ids uuid[], _tag text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  UPDATE crm_leads
  SET tags = array_append(COALESCE(tags, '{}'), _tag),
      updated_at = now()
  WHERE id = ANY(_ids)
    AND NOT (_tag = ANY(COALESCE(tags, '{}')));
$$;