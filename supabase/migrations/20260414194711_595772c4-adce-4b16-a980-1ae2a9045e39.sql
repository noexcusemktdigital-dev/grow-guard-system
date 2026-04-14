
CREATE OR REPLACE FUNCTION public.get_member_permissions(
  _user_id uuid,
  _org_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
