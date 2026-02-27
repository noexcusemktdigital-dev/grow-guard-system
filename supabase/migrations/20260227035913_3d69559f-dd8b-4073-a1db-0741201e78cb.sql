
-- Add target_unit_ids to goals if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='goals' AND column_name='target_unit_ids') THEN
    ALTER TABLE public.goals ADD COLUMN target_unit_ids uuid[] DEFAULT NULL;
  END IF;
END $$;

-- RPC: get_daily_message_with_parent
CREATE OR REPLACE FUNCTION public.get_daily_message_with_parent(_org_id uuid)
RETURNS SETOF daily_messages
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT d.*
  FROM daily_messages d
  WHERE d.organization_id = _org_id
     OR d.organization_id = (
       SELECT parent_org_id FROM organizations WHERE id = _org_id
     )
  ORDER BY d.date DESC
  LIMIT 1;
$$;

-- RPC: get_goals_with_parent
CREATE OR REPLACE FUNCTION public.get_goals_with_parent(_org_id uuid)
RETURNS SETOF goals
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT g.*
  FROM goals g
  WHERE g.organization_id = _org_id
     OR (
       g.organization_id = (SELECT parent_org_id FROM organizations WHERE id = _org_id)
       AND (
         g.scope = 'global'
         OR g.scope = 'network'
         OR _org_id = ANY(g.target_unit_ids)
       )
     )
  ORDER BY g.period_start DESC;
$$;

-- RPC: get_closings_with_parent
CREATE OR REPLACE FUNCTION public.get_closings_with_parent(_org_id uuid)
RETURNS SETOF finance_closings
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT fc.*
  FROM finance_closings fc
  WHERE fc.organization_id = _org_id
     OR (
       fc.organization_id = (SELECT parent_org_id FROM organizations WHERE id = _org_id)
       AND fc.status = 'published'
     )
  ORDER BY fc.year DESC, fc.month DESC;
$$;

-- RPC: get_contracts_for_unit
CREATE OR REPLACE FUNCTION public.get_contracts_for_unit(_org_id uuid)
RETURNS SETOF contracts
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.*
  FROM contracts c
  WHERE c.organization_id = _org_id
     OR c.unit_org_id = _org_id
  ORDER BY c.created_at DESC;
$$;

-- RPC: get_contract_templates_with_parent
CREATE OR REPLACE FUNCTION public.get_contract_templates_with_parent(_org_id uuid)
RETURNS SETOF contract_templates
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ct.*
  FROM contract_templates ct
  WHERE ct.organization_id = _org_id
     OR ct.organization_id = (
       SELECT parent_org_id FROM organizations WHERE id = _org_id
     )
  ORDER BY ct.name;
$$;

-- RPC: get_calendar_events_with_parent
CREATE OR REPLACE FUNCTION public.get_calendar_events_with_parent(_org_id uuid, _start text DEFAULT NULL, _end text DEFAULT NULL)
RETURNS SETOF calendar_events
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT ce.*
  FROM calendar_events ce
  WHERE (
    ce.organization_id = _org_id
    OR (
      ce.organization_id = (SELECT parent_org_id FROM organizations WHERE id = _org_id)
      AND (ce.visibility = 'network' OR ce.unit_id::text = _org_id::text)
    )
  )
  AND (_start IS NULL OR ce.start_at >= _start::timestamptz)
  AND (_end IS NULL OR ce.end_at <= _end::timestamptz)
  ORDER BY ce.start_at;
END;
$$;
