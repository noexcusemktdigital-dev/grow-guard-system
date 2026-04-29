CREATE OR REPLACE FUNCTION public.get_all_network_tickets()
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  org_name text,
  title text,
  description text,
  status text,
  priority text,
  category text,
  subcategory text,
  created_by uuid,
  assigned_to uuid,
  closed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _matrix_org uuid;
BEGIN
  IF _uid IS NULL THEN
    RETURN;
  END IF;

  SELECT o.id INTO _matrix_org
  FROM organization_memberships om
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.user_id = _uid
    AND o.type = 'franqueadora'
  LIMIT 1;

  IF _matrix_org IS NOT NULL THEN
    RETURN QUERY
    SELECT t.id, t.organization_id, o.name AS org_name, t.title, t.description,
           t.status, t.priority, t.category, t.subcategory, t.created_by,
           t.assigned_to, t.closed_at, t.created_at, t.updated_at
    FROM public.support_tickets t
    JOIN public.organizations o ON o.id = t.organization_id
    WHERE t.organization_id = _matrix_org
       OR o.parent_org_id = _matrix_org
    ORDER BY t.created_at DESC;
  ELSE
    RETURN QUERY
    SELECT t.id, t.organization_id, o.name AS org_name, t.title, t.description,
           t.status, t.priority, t.category, t.subcategory, t.created_by,
           t.assigned_to, t.closed_at, t.created_at, t.updated_at
    FROM public.support_tickets t
    JOIN public.organizations o ON o.id = t.organization_id
    WHERE t.organization_id IN (
      SELECT organization_id FROM public.organization_memberships WHERE user_id = _uid
    )
    ORDER BY t.created_at DESC;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_network_tickets() TO authenticated;