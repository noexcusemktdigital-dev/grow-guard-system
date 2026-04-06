
ALTER TABLE public.client_followups ADD COLUMN unit_org_id UUID REFERENCES public.organizations(id);

CREATE INDEX idx_client_followups_unit_org ON public.client_followups(unit_org_id);

-- Allow parent org (matriz) to read followups of child units
CREATE OR REPLACE FUNCTION public.get_followups_for_network(_org_id uuid)
RETURNS SETOF client_followups
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT cf.*
  FROM client_followups cf
  WHERE cf.organization_id = _org_id
     OR cf.unit_org_id = _org_id
     OR cf.unit_org_id IN (SELECT id FROM organizations WHERE parent_org_id = _org_id)
  ORDER BY cf.client_name, cf.month_ref DESC;
$$;
