
-- ═══════════════════════════════════════════════════════════════
-- CORREÇÃO: save_member_permissions via SECURITY DEFINER
-- Garante que admin pode salvar permissões independente do RLS
-- ═══════════════════════════════════════════════════════════════

-- Garante que user_roles.organization_id está preenchido para todos
UPDATE public.user_roles ur
SET organization_id = om.organization_id
FROM public.organization_memberships om
WHERE om.user_id = ur.user_id
  AND ur.organization_id IS NULL;

-- Função SECURITY DEFINER para salvar permissões (bypassa RLS)
CREATE OR REPLACE FUNCTION public.save_member_permissions(
  _caller_id uuid,
  _user_id uuid,
  _org_id uuid,
  _profile_id uuid DEFAULT NULL,
  _crm_visibility text DEFAULT 'own',
  _can_generate_content boolean DEFAULT false,
  _can_generate_posts boolean DEFAULT false,
  _can_generate_scripts boolean DEFAULT false,
  _can_use_whatsapp boolean DEFAULT true,
  _can_manage_crm boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica que o caller é admin da organização
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _caller_id
      AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para alterar permissões de membros';
  END IF;

  -- Verifica que o usuário alvo pertence à mesma org
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE user_id = _user_id AND organization_id = _org_id
  ) THEN
    RAISE EXCEPTION 'Usuário não pertence a esta organização';
  END IF;

  -- Upsert das permissões
  INSERT INTO public.member_permissions (
    user_id, organization_id, profile_id,
    crm_visibility, can_generate_content, can_generate_posts,
    can_generate_scripts, can_use_whatsapp, can_manage_crm,
    updated_at
  ) VALUES (
    _user_id, _org_id, _profile_id,
    _crm_visibility, _can_generate_content, _can_generate_posts,
    _can_generate_scripts, _can_use_whatsapp, _can_manage_crm,
    now()
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
