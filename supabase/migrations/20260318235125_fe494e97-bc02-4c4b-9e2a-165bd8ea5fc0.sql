-- Fix: award XP to the lead creator (first org member) when assigned_to is null
CREATE OR REPLACE FUNCTION public.award_xp_on_lead_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _target_user uuid;
BEGIN
  _target_user := COALESCE(
    NEW.assigned_to,
    (SELECT om.user_id FROM organization_memberships om
     WHERE om.organization_id = NEW.organization_id
     ORDER BY om.role ASC LIMIT 1)
  );
  
  IF _target_user IS NOT NULL THEN
    INSERT INTO client_gamification (organization_id, user_id, xp, points, last_activity_at)
    VALUES (NEW.organization_id, _target_user, 10, 10, now())
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
      xp = COALESCE(client_gamification.xp, 0) + 10,
      points = COALESCE(client_gamification.points, 0) + 10,
      last_activity_at = now(),
      streak_days = CASE
        WHEN client_gamification.last_activity_at::date = (now() - interval '1 day')::date THEN COALESCE(client_gamification.streak_days, 0) + 1
        WHEN client_gamification.last_activity_at::date = now()::date THEN COALESCE(client_gamification.streak_days, 1)
        ELSE 1
      END;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix: award XP on lead won, fallback to org admin when assigned_to is null
CREATE OR REPLACE FUNCTION public.award_xp_on_lead_won()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _target_user uuid;
BEGIN
  IF NEW.won_at IS NOT NULL AND (OLD.won_at IS NULL OR OLD.won_at IS DISTINCT FROM NEW.won_at) THEN
    _target_user := COALESCE(
      NEW.assigned_to,
      (SELECT om.user_id FROM organization_memberships om
       WHERE om.organization_id = NEW.organization_id
       ORDER BY om.role ASC LIMIT 1)
    );
    
    IF _target_user IS NOT NULL THEN
      INSERT INTO client_gamification (organization_id, user_id, xp, points, last_activity_at)
      VALUES (NEW.organization_id, _target_user, 50, 50, now())
      ON CONFLICT (organization_id, user_id) DO UPDATE SET
        xp = COALESCE(client_gamification.xp, 0) + 50,
        points = COALESCE(client_gamification.points, 0) + 50,
        last_activity_at = now(),
        streak_days = CASE
          WHEN client_gamification.last_activity_at::date = (now() - interval '1 day')::date THEN COALESCE(client_gamification.streak_days, 0) + 1
          WHEN client_gamification.last_activity_at::date = now()::date THEN COALESCE(client_gamification.streak_days, 1)
          ELSE 1
        END;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure triggers exist on crm_leads
DROP TRIGGER IF EXISTS trg_award_xp_on_lead_created ON crm_leads;
CREATE TRIGGER trg_award_xp_on_lead_created
  AFTER INSERT ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION award_xp_on_lead_created();

DROP TRIGGER IF EXISTS trg_award_xp_on_lead_won ON crm_leads;
CREATE TRIGGER trg_award_xp_on_lead_won
  AFTER UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION award_xp_on_lead_won();

-- Add unique constraint on (organization_id, user_id) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_gamification_org_user_unique'
  ) THEN
    ALTER TABLE client_gamification ADD CONSTRAINT client_gamification_org_user_unique UNIQUE (organization_id, user_id);
  END IF;
END $$;