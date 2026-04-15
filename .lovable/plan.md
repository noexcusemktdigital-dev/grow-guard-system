

## Diagnóstico confirmado

A função `get_member_permissions` no banco de dados está crashando com:
```
record "v_profile" has no field "crm_visibility"
```

**Por que isso acontece:** A Pollyana tem `profile_id = NULL`. A variável `v_profile` (tipo `%ROWTYPE`) nunca é preenchida. No PostgreSQL, acessar campos de um registro vazio causa esse erro. O `COALESCE(v_mp.crm_visibility, v_profile.crm_visibility, ...)` tenta ler `v_profile.crm_visibility` de um registro vazio → crash.

**Impacto:** O hook `useMemberPermissions` captura o erro e retorna permissões padrão (tudo bloqueado). As permissões salvas pela Juliana existem no banco mas nunca chegam à Pollyana.

## Solução

**1 migration SQL** — Recriar a função `get_member_permissions` com checagens seguras de registros nulos:

```sql
CREATE OR REPLACE FUNCTION public.get_member_permissions(_user_id uuid, _org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mp   public.member_permissions%ROWTYPE;
  v_pp   public.permission_profiles%ROWTYPE;
  v_tp   public.permission_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_mp
  FROM public.member_permissions
  WHERE user_id = _user_id AND organization_id = _org_id
  LIMIT 1;

  IF v_mp.profile_id IS NOT NULL THEN
    SELECT * INTO v_pp
    FROM public.permission_profiles
    WHERE id = v_mp.profile_id;
  END IF;

  IF v_pp.id IS NULL THEN
    SELECT pp.* INTO v_tp
    FROM public.org_team_memberships otm
    JOIN public.org_teams ot ON ot.id = otm.team_id
    JOIN public.permission_profiles pp ON pp.id = ot.permission_profile_id
    WHERE otm.user_id = _user_id
      AND ot.organization_id = _org_id
      AND ot.permission_profile_id IS NOT NULL
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'crm_visibility',       COALESCE(v_mp.crm_visibility,
      CASE WHEN v_pp.id IS NOT NULL THEN v_pp.crm_visibility END,
      CASE WHEN v_tp.id IS NOT NULL THEN v_tp.crm_visibility END, 'own'),
    'can_generate_content', COALESCE(v_mp.can_generate_content,
      CASE WHEN v_pp.id IS NOT NULL THEN v_pp.can_generate_content END,
      CASE WHEN v_tp.id IS NOT NULL THEN v_tp.can_generate_content END, false),
    'can_generate_posts',   COALESCE(v_mp.can_generate_posts,
      CASE WHEN v_pp.id IS NOT NULL THEN v_pp.can_generate_posts END,
      CASE WHEN v_tp.id IS NOT NULL THEN v_tp.can_generate_posts END, false),
    'can_generate_scripts', COALESCE(v_mp.can_generate_scripts,
      CASE WHEN v_pp.id IS NOT NULL THEN v_pp.can_generate_scripts END,
      CASE WHEN v_tp.id IS NOT NULL THEN v_tp.can_generate_scripts END, false),
    'can_use_whatsapp',     COALESCE(v_mp.can_use_whatsapp,
      CASE WHEN v_pp.id IS NOT NULL THEN v_pp.can_use_whatsapp END,
      CASE WHEN v_tp.id IS NOT NULL THEN v_tp.can_use_whatsapp END, true),
    'can_manage_crm',       COALESCE(v_mp.can_manage_crm,
      CASE WHEN v_pp.id IS NOT NULL THEN v_pp.can_manage_crm END,
      CASE WHEN v_tp.id IS NOT NULL THEN v_tp.can_manage_crm END, false)
  );
END;
$$;
```

A mudança usa `CASE WHEN v_pp.id IS NOT NULL THEN v_pp.campo END` para evitar acessar campos de registros vazios. Nenhuma alteração no frontend é necessária.

