
-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS DE XP FALTANTES — Gamificação completa
-- ═══════════════════════════════════════════════════════════════

-- Função genérica para conceder XP a um usuário
CREATE OR REPLACE FUNCTION public.award_xp_to_user(
  _org_id uuid,
  _user_id uuid,
  _xp integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.client_gamification (organization_id, user_id, xp, points, last_activity_at)
  VALUES (_org_id, _user_id, _xp, _xp, now())
  ON CONFLICT (organization_id, user_id) DO UPDATE SET
    xp = COALESCE(client_gamification.xp, 0) + _xp,
    points = COALESCE(client_gamification.points, 0) + _xp,
    last_activity_at = now(),
    streak_days = CASE
      WHEN client_gamification.last_activity_at::date = (now() - interval '1 day')::date
        THEN COALESCE(client_gamification.streak_days, 0) + 1
      WHEN client_gamification.last_activity_at::date = now()::date
        THEN COALESCE(client_gamification.streak_days, 1)
      ELSE 1
    END;
END;
$$;

-- +25 XP: Conectar WhatsApp
CREATE OR REPLACE FUNCTION public.award_xp_on_whatsapp_connected()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _user_id uuid;
BEGIN
  IF NEW.status = 'connected' AND (OLD.status IS NULL OR OLD.status != 'connected') THEN
    SELECT om.user_id INTO _user_id
    FROM organization_memberships om
    WHERE om.organization_id = NEW.organization_id
    ORDER BY om.created_at ASC LIMIT 1;
    IF _user_id IS NOT NULL THEN
      PERFORM award_xp_to_user(NEW.organization_id, _user_id, 25);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_xp_whatsapp ON whatsapp_instances;
CREATE TRIGGER trg_award_xp_whatsapp
  AFTER INSERT OR UPDATE ON public.whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION award_xp_on_whatsapp_connected();

-- +10 XP: Criar conteúdo (roteiro aprovado)
CREATE OR REPLACE FUNCTION public.award_xp_on_content_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _user_id uuid;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    _user_id := COALESCE(
      NEW.created_by,
      (SELECT om.user_id FROM organization_memberships om
       WHERE om.organization_id = NEW.organization_id
       ORDER BY om.created_at ASC LIMIT 1)
    );
    IF _user_id IS NOT NULL THEN
      PERFORM award_xp_to_user(NEW.organization_id, _user_id, 10);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_xp_content ON client_content;
CREATE TRIGGER trg_award_xp_content
  AFTER INSERT OR UPDATE ON public.client_content
  FOR EACH ROW EXECUTE FUNCTION award_xp_on_content_approved();

-- +10 XP: Gerar site
CREATE OR REPLACE FUNCTION public.award_xp_on_site_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _user_id uuid;
BEGIN
  _user_id := COALESCE(
    NEW.created_by,
    (SELECT om.user_id FROM organization_memberships om
     WHERE om.organization_id = NEW.organization_id
     ORDER BY om.created_at ASC LIMIT 1)
  );
  IF _user_id IS NOT NULL THEN
    PERFORM award_xp_to_user(NEW.organization_id, _user_id, 10);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_xp_site ON client_sites;
CREATE TRIGGER trg_award_xp_site
  AFTER INSERT ON public.client_sites
  FOR EACH ROW EXECUTE FUNCTION award_xp_on_site_created();

-- +10 XP: Ativar agente IA (status = 'active')
CREATE OR REPLACE FUNCTION public.award_xp_on_agent_activated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _user_id uuid;
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    _user_id := COALESCE(
      NEW.created_by,
      (SELECT om.user_id FROM organization_memberships om
       WHERE om.organization_id = NEW.organization_id
       ORDER BY om.created_at ASC LIMIT 1)
    );
    IF _user_id IS NOT NULL THEN
      PERFORM award_xp_to_user(NEW.organization_id, _user_id, 10);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_xp_agent ON client_ai_agents;
CREATE TRIGGER trg_award_xp_agent
  AFTER INSERT OR UPDATE ON public.client_ai_agents
  FOR EACH ROW EXECUTE FUNCTION award_xp_on_agent_activated();
