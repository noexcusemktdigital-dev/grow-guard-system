
-- ═══════════════════════════════════════════════════════════════
-- MULTI-WORKSPACE: role por organização, não global
-- ═══════════════════════════════════════════════════════════════

-- 1. Adiciona organization_id em user_roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 2. Remove constraint UNIQUE(user_id) e cria UNIQUE(user_id, organization_id)
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_unique;

ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_org_unique UNIQUE (user_id, organization_id);

-- 3. Preenche organization_id para registros existentes (via membership)
UPDATE public.user_roles ur
SET organization_id = om.organization_id
FROM public.organization_memberships om
WHERE om.user_id = ur.user_id
  AND ur.organization_id IS NULL;

-- 4. Atualiza função get_user_role para filtrar por org
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid, _portal text DEFAULT NULL)
RETURNS public.app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  JOIN public.organization_memberships om
    ON om.user_id = ur.user_id
    AND om.organization_id = ur.organization_id
  WHERE ur.user_id = _user_id
    AND (
      _portal IS NULL
      OR (_portal = 'saas'      AND ur.role IN ('cliente_admin', 'cliente_user'))
      OR (_portal = 'franchise' AND ur.role IN ('super_admin', 'admin', 'franqueado'))
    )
  ORDER BY
    CASE ur.role
      WHEN 'super_admin'   THEN 1
      WHEN 'admin'         THEN 2
      WHEN 'franqueado'    THEN 3
      WHEN 'cliente_admin' THEN 4
      WHEN 'cliente_user'  THEN 5
      ELSE 99
    END
  LIMIT 1;
$$;

-- 5. Atualiza get_org_members_with_email para usar role por org
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
    AND ur.organization_id = _org_id
  WHERE om.organization_id = _org_id
  ORDER BY om.created_at;
$$;

-- 6. Atualiza políticas RLS que verificam role de admin
-- permission_profiles
DROP POLICY IF EXISTS "Org admins can manage permission profiles" ON public.permission_profiles;

CREATE POLICY "Org admins can manage permission profiles"
  ON public.permission_profiles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = permission_profiles.organization_id
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = permission_profiles.organization_id
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  );

-- member_permissions
DROP POLICY IF EXISTS "Org admins can manage member permissions" ON public.member_permissions;

CREATE POLICY "Org admins can manage member permissions"
  ON public.member_permissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = member_permissions.organization_id
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = member_permissions.organization_id
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  );
