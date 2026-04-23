-- Helper function to check if a user is admin of a specific org
CREATE OR REPLACE FUNCTION public.is_admin_of_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role IN ('cliente_admin', 'admin', 'super_admin')
  );
$$;

-- Main permissions table
CREATE TABLE public.org_user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id, permission)
);

CREATE INDEX idx_org_user_permissions_lookup
  ON public.org_user_permissions(user_id, organization_id, permission);

ALTER TABLE public.org_user_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can do everything in their org
CREATE POLICY "Admins manage org permissions select"
  ON public.org_user_permissions FOR SELECT
  USING (public.is_admin_of_org(auth.uid(), organization_id));

CREATE POLICY "Admins manage org permissions insert"
  ON public.org_user_permissions FOR INSERT
  WITH CHECK (public.is_admin_of_org(auth.uid(), organization_id));

CREATE POLICY "Admins manage org permissions update"
  ON public.org_user_permissions FOR UPDATE
  USING (public.is_admin_of_org(auth.uid(), organization_id));

CREATE POLICY "Admins manage org permissions delete"
  ON public.org_user_permissions FOR DELETE
  USING (public.is_admin_of_org(auth.uid(), organization_id));

-- Users can read their own permissions
CREATE POLICY "Users read their own permissions"
  ON public.org_user_permissions FOR SELECT
  USING (user_id = auth.uid());

-- Helper function to check a single permission
CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id uuid, _org_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT granted FROM public.org_user_permissions
     WHERE user_id = _user_id
       AND organization_id = _org_id
       AND permission = _permission
     LIMIT 1),
    false
  );
$$;