
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid, _portal text DEFAULT NULL)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT om.organization_id 
  FROM organization_memberships om
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.user_id = _user_id
    AND (
      _portal IS NULL
      OR (_portal = 'saas' AND o.type = 'cliente')
      OR (_portal = 'franchise' AND o.type IN ('franqueadora', 'franqueado'))
    )
  LIMIT 1
$$;
