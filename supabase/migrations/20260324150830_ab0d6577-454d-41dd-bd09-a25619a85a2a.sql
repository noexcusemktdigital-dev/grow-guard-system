CREATE OR REPLACE FUNCTION public.get_org_members_with_email(_org_id uuid)
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  job_title text,
  role text,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    om.user_id,
    au.email::text,
    p.full_name::text,
    p.avatar_url::text,
    p.job_title::text,
    COALESCE(ur.role::text, 'cliente_user') AS role,
    om.created_at
  FROM organization_memberships om
  JOIN auth.users au ON au.id = om.user_id
  LEFT JOIN profiles p ON p.id = om.user_id
  LEFT JOIN user_roles ur ON ur.user_id = om.user_id
  WHERE om.organization_id = _org_id
  ORDER BY om.created_at;
$$;