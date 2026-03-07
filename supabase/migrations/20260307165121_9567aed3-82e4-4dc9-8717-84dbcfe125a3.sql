
CREATE OR REPLACE FUNCTION public.get_announcements_with_parent(_org_id uuid)
 RETURNS SETOF announcements
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _parent uuid;
  _grandparent uuid;
  _org_text text;
BEGIN
  _org_text := _org_id::text;
  
  SELECT parent_org_id INTO _parent FROM organizations WHERE id = _org_id;
  
  IF _parent IS NOT NULL THEN
    SELECT parent_org_id INTO _grandparent FROM organizations WHERE id = _parent;
  END IF;

  -- Own org announcements
  RETURN QUERY SELECT a.* FROM announcements a WHERE a.organization_id = _org_id;

  -- Parent org announcements
  IF _parent IS NOT NULL THEN
    RETURN QUERY
      SELECT a.* FROM announcements a
      WHERE a.organization_id = _parent
        AND a.published_at IS NOT NULL
        AND a.status = 'active'
        AND (
          a.target_unit_ids IS NULL
          OR array_length(a.target_unit_ids, 1) IS NULL
          OR _org_text = ANY(a.target_unit_ids)
        );
  END IF;

  -- Grandparent org announcements
  IF _grandparent IS NOT NULL THEN
    RETURN QUERY
      SELECT a.* FROM announcements a
      WHERE a.organization_id = _grandparent
        AND a.published_at IS NOT NULL
        AND a.status = 'active'
        AND (
          a.target_unit_ids IS NULL
          OR array_length(a.target_unit_ids, 1) IS NULL
          OR _org_text = ANY(a.target_unit_ids)
        );
  END IF;

  RETURN;
END;
$$;
