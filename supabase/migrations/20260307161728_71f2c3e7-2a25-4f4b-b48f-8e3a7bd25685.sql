
CREATE OR REPLACE FUNCTION public.get_announcements_with_parent(_org_id uuid)
 RETURNS SETOF announcements
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  -- Own org announcements (include drafts for admin management)
  SELECT a.*
  FROM announcements a
  WHERE a.organization_id = _org_id
  UNION ALL
  -- Parent org announcements (only published)
  SELECT a.*
  FROM announcements a
  WHERE a.organization_id = (
    SELECT parent_org_id FROM organizations WHERE id = _org_id
  )
  AND a.published_at IS NOT NULL
  ORDER BY created_at DESC;
$$;
