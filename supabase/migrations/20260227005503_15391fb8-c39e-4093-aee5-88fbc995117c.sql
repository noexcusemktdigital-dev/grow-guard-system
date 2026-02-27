
-- Database function to get network tickets (tickets from all child orgs + own org)
CREATE OR REPLACE FUNCTION public.get_network_tickets(_parent_org_id uuid)
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.organization_id,
    o.name AS org_name,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.category,
    t.subcategory,
    t.created_by,
    t.assigned_to,
    t.closed_at,
    t.created_at,
    t.updated_at
  FROM support_tickets t
  JOIN organizations o ON o.id = t.organization_id
  WHERE t.organization_id = _parent_org_id
     OR o.parent_org_id = _parent_org_id
  ORDER BY t.created_at DESC;
$$;

-- Database function to get announcements including parent org announcements
CREATE OR REPLACE FUNCTION public.get_announcements_with_parent(_org_id uuid)
RETURNS SETOF announcements
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.*
  FROM announcements a
  WHERE a.organization_id = _org_id
     OR a.organization_id = (
       SELECT parent_org_id FROM organizations WHERE id = _org_id
     )
  ORDER BY a.created_at DESC;
$$;
