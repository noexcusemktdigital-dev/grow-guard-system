
CREATE OR REPLACE FUNCTION public.get_member_permissions(_user_id uuid, _org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  -- member_permissions scalars
  mp_profile_id uuid;
  mp_crm_visibility text;
  mp_can_generate_content boolean;
  mp_can_generate_posts boolean;
  mp_can_generate_scripts boolean;
  mp_can_use_whatsapp boolean;
  mp_can_manage_crm boolean;
  -- permission_profile (direct) scalars
  pp_crm_visibility text;
  pp_can_generate_content boolean;
  pp_can_generate_posts boolean;
  pp_can_generate_scripts boolean;
  pp_can_use_whatsapp boolean;
  pp_can_manage_crm boolean;
  -- permission_profile (team fallback) scalars
  tp_crm_visibility text;
  tp_can_generate_content boolean;
  tp_can_generate_posts boolean;
  tp_can_generate_scripts boolean;
  tp_can_use_whatsapp boolean;
  tp_can_manage_crm boolean;
BEGIN
  -- 1) Load individual overrides
  SELECT profile_id, crm_visibility, can_generate_content, can_generate_posts,
         can_generate_scripts, can_use_whatsapp, can_manage_crm
  INTO mp_profile_id, mp_crm_visibility, mp_can_generate_content, mp_can_generate_posts,
       mp_can_generate_scripts, mp_can_use_whatsapp, mp_can_manage_crm
  FROM public.member_permissions
  WHERE user_id = _user_id AND organization_id = _org_id
  LIMIT 1;

  -- 2) Load direct profile if assigned
  IF mp_profile_id IS NOT NULL THEN
    SELECT crm_visibility, can_generate_content, can_generate_posts,
           can_generate_scripts, can_use_whatsapp, can_manage_crm
    INTO pp_crm_visibility, pp_can_generate_content, pp_can_generate_posts,
         pp_can_generate_scripts, pp_can_use_whatsapp, pp_can_manage_crm
    FROM public.permission_profiles
    WHERE id = mp_profile_id;
  END IF;

  -- 3) Fallback: team profile
  IF pp_crm_visibility IS NULL AND pp_can_generate_content IS NULL THEN
    SELECT pp.crm_visibility, pp.can_generate_content, pp.can_generate_posts,
           pp.can_generate_scripts, pp.can_use_whatsapp, pp.can_manage_crm
    INTO tp_crm_visibility, tp_can_generate_content, tp_can_generate_posts,
         tp_can_generate_scripts, tp_can_use_whatsapp, tp_can_manage_crm
    FROM public.org_team_memberships otm
    JOIN public.org_teams ot ON ot.id = otm.team_id
    JOIN public.permission_profiles pp ON pp.id = ot.permission_profile_id
    WHERE otm.user_id = _user_id
      AND ot.organization_id = _org_id
      AND ot.permission_profile_id IS NOT NULL
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'crm_visibility',       COALESCE(mp_crm_visibility, pp_crm_visibility, tp_crm_visibility, 'own'),
    'can_generate_content', COALESCE(mp_can_generate_content, pp_can_generate_content, tp_can_generate_content, false),
    'can_generate_posts',   COALESCE(mp_can_generate_posts, pp_can_generate_posts, tp_can_generate_posts, false),
    'can_generate_scripts', COALESCE(mp_can_generate_scripts, pp_can_generate_scripts, tp_can_generate_scripts, false),
    'can_use_whatsapp',     COALESCE(mp_can_use_whatsapp, pp_can_use_whatsapp, tp_can_use_whatsapp, true),
    'can_manage_crm',       COALESCE(mp_can_manage_crm, pp_can_manage_crm, tp_can_manage_crm, false)
  );
END;
$$;

-- Harden save_member_permissions: require admin of the SAME org
CREATE OR REPLACE FUNCTION public.save_member_permissions(
  _caller_id uuid, _user_id uuid, _org_id uuid,
  _profile_id uuid DEFAULT NULL, _crm_visibility text DEFAULT 'own',
  _can_generate_content boolean DEFAULT false, _can_generate_posts boolean DEFAULT false,
  _can_generate_scripts boolean DEFAULT false, _can_use_whatsapp boolean DEFAULT true,
  _can_manage_crm boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Caller must be admin of the SAME organization
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _caller_id
      AND ur.organization_id = _org_id
      AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para alterar permissões de membros';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE user_id = _user_id AND organization_id = _org_id
  ) THEN
    RAISE EXCEPTION 'Usuário não pertence a esta organização';
  END IF;

  INSERT INTO public.member_permissions (
    user_id, organization_id, profile_id,
    crm_visibility, can_generate_content, can_generate_posts,
    can_generate_scripts, can_use_whatsapp, can_manage_crm, updated_at
  ) VALUES (
    _user_id, _org_id, _profile_id,
    _crm_visibility, _can_generate_content, _can_generate_posts,
    _can_generate_scripts, _can_use_whatsapp, _can_manage_crm, now()
  )
  ON CONFLICT (user_id, organization_id)
  DO UPDATE SET
    profile_id = EXCLUDED.profile_id,
    crm_visibility = EXCLUDED.crm_visibility,
    can_generate_content = EXCLUDED.can_generate_content,
    can_generate_posts = EXCLUDED.can_generate_posts,
    can_generate_scripts = EXCLUDED.can_generate_scripts,
    can_use_whatsapp = EXCLUDED.can_use_whatsapp,
    can_manage_crm = EXCLUDED.can_manage_crm,
    updated_at = now();
END;
$$;
