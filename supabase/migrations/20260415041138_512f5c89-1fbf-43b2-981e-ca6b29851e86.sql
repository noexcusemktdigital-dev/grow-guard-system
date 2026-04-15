
CREATE OR REPLACE FUNCTION public.get_member_permissions(_user_id uuid, _org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  mp_crm_visibility text;
  mp_can_generate_content boolean;
  mp_can_generate_posts boolean;
  mp_can_generate_scripts boolean;
  mp_can_use_whatsapp boolean;
  mp_can_manage_crm boolean;
BEGIN
  -- Load from member_permissions (the only table that has these columns)
  SELECT crm_visibility, can_generate_content, can_generate_posts,
         can_generate_scripts, can_use_whatsapp, can_manage_crm
  INTO mp_crm_visibility, mp_can_generate_content, mp_can_generate_posts,
       mp_can_generate_scripts, mp_can_use_whatsapp, mp_can_manage_crm
  FROM public.member_permissions
  WHERE user_id = _user_id AND organization_id = _org_id
  LIMIT 1;

  RETURN jsonb_build_object(
    'crm_visibility',       COALESCE(mp_crm_visibility, 'own'),
    'can_generate_content', COALESCE(mp_can_generate_content, false),
    'can_generate_posts',   COALESCE(mp_can_generate_posts, false),
    'can_generate_scripts', COALESCE(mp_can_generate_scripts, false),
    'can_use_whatsapp',     COALESCE(mp_can_use_whatsapp, true),
    'can_manage_crm',       COALESCE(mp_can_manage_crm, false)
  );
END;
$$;
