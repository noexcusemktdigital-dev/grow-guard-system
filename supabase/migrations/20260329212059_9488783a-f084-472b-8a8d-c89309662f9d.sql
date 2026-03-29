CREATE OR REPLACE FUNCTION public.get_user_organizations(_user_id uuid, _portal text DEFAULT NULL)
RETURNS TABLE(org_id uuid, org_name text, org_type text, logo_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT o.id AS org_id, o.name AS org_name, o.type AS org_type, o.logo_url
  FROM organization_memberships om
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.user_id = _user_id
    AND (
      _portal IS NULL
      OR (_portal = 'saas' AND o.type = 'cliente')
      OR (_portal = 'franchise' AND o.type IN ('franqueadora', 'franqueado'))
    )
  ORDER BY o.name;
$$;