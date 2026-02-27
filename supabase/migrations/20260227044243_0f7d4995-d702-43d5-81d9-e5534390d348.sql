
-- RPC: get network CRM leads for goal progress aggregation
CREATE OR REPLACE FUNCTION public.get_network_crm_data(_org_id uuid)
RETURNS TABLE(
  lead_id uuid,
  lead_value numeric,
  lead_won_at timestamptz,
  lead_created_at timestamptz,
  lead_assigned_to uuid,
  lead_stage text,
  activity_id uuid,
  activity_type text,
  activity_created_at timestamptz,
  activity_user_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Returns leads and activities from the org itself AND all child orgs
  SELECT
    l.id, l.value, l.won_at, l.created_at, l.assigned_to, l.stage,
    NULL::uuid, NULL::text, NULL::timestamptz, NULL::uuid
  FROM crm_leads l
  WHERE l.organization_id = _org_id
     OR l.organization_id IN (SELECT id FROM organizations WHERE parent_org_id = _org_id)
  UNION ALL
  SELECT
    NULL::uuid, NULL::numeric, NULL::timestamptz, NULL::timestamptz, NULL::uuid, NULL::text,
    a.id, a.type, a.created_at, a.user_id
  FROM crm_activities a
  WHERE a.organization_id = _org_id
     OR a.organization_id IN (SELECT id FROM organizations WHERE parent_org_id = _org_id)
$$;

-- RPC: get rankings with parent org visibility
CREATE OR REPLACE FUNCTION public.get_rankings_with_parent(_org_id uuid)
RETURNS SETOF rankings
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT r.*
  FROM rankings r
  WHERE r.organization_id = _org_id
     OR r.organization_id = (
       SELECT parent_org_id FROM organizations WHERE id = _org_id
     )
  ORDER BY r.position;
$$;
