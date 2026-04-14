
-- Tabelas (idempotente)
CREATE TABLE IF NOT EXISTS public.permission_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  crm_visibility text NOT NULL DEFAULT 'own' CHECK (crm_visibility IN ('all', 'team', 'own')),
  can_generate_content boolean NOT NULL DEFAULT false,
  can_generate_posts boolean NOT NULL DEFAULT false,
  can_generate_scripts boolean NOT NULL DEFAULT false,
  can_use_whatsapp boolean NOT NULL DEFAULT true,
  can_manage_crm boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.permission_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view permission profiles" ON public.permission_profiles;
CREATE POLICY "Org members can view permission profiles"
  ON public.permission_profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = permission_profiles.organization_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org admins can manage permission profiles" ON public.permission_profiles;
CREATE POLICY "Org admins can manage permission profiles"
  ON public.permission_profiles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  );

CREATE TABLE IF NOT EXISTS public.member_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.permission_profiles(id) ON DELETE SET NULL,
  crm_visibility text CHECK (crm_visibility IN ('all', 'team', 'own')),
  can_generate_content boolean,
  can_generate_posts boolean,
  can_generate_scripts boolean,
  can_use_whatsapp boolean,
  can_manage_crm boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

ALTER TABLE public.member_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own permissions" ON public.member_permissions;
CREATE POLICY "Users can view own permissions"
  ON public.member_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Org admins can manage member permissions" ON public.member_permissions;
CREATE POLICY "Org admins can manage member permissions"
  ON public.member_permissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  );

-- Coluna em org_teams
ALTER TABLE public.org_teams
  ADD COLUMN IF NOT EXISTS permission_profile_id uuid
  REFERENCES public.permission_profiles(id) ON DELETE SET NULL;

-- Função de resolução de permissões
CREATE OR REPLACE FUNCTION public.get_member_permissions(
  _user_id uuid,
  _org_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mp public.member_permissions%ROWTYPE;
  v_profile public.permission_profiles%ROWTYPE;
  v_team_profile public.permission_profiles%ROWTYPE;
  v_result jsonb;
BEGIN
  SELECT * INTO v_mp
  FROM public.member_permissions
  WHERE user_id = _user_id AND organization_id = _org_id
  LIMIT 1;

  IF v_mp.profile_id IS NOT NULL THEN
    SELECT * INTO v_profile
    FROM public.permission_profiles
    WHERE id = v_mp.profile_id;
  END IF;

  IF v_profile.id IS NULL THEN
    SELECT pp.* INTO v_team_profile
    FROM public.org_team_memberships otm
    JOIN public.org_teams ot ON ot.id = otm.team_id
    JOIN public.permission_profiles pp ON pp.id = ot.permission_profile_id
    WHERE otm.user_id = _user_id
      AND ot.organization_id = _org_id
      AND ot.permission_profile_id IS NOT NULL
    LIMIT 1;
  END IF;

  v_result := jsonb_build_object(
    'crm_visibility', COALESCE(v_mp.crm_visibility, v_profile.crm_visibility, v_team_profile.crm_visibility, 'own'),
    'can_generate_content', COALESCE(v_mp.can_generate_content, v_profile.can_generate_content, v_team_profile.can_generate_content, false),
    'can_generate_posts', COALESCE(v_mp.can_generate_posts, v_profile.can_generate_posts, v_team_profile.can_generate_posts, false),
    'can_generate_scripts', COALESCE(v_mp.can_generate_scripts, v_profile.can_generate_scripts, v_team_profile.can_generate_scripts, false),
    'can_use_whatsapp', COALESCE(v_mp.can_use_whatsapp, v_profile.can_use_whatsapp, v_team_profile.can_use_whatsapp, true),
    'can_manage_crm', COALESCE(v_mp.can_manage_crm, v_profile.can_manage_crm, v_team_profile.can_manage_crm, false)
  );

  RETURN v_result;
END;
$$;
