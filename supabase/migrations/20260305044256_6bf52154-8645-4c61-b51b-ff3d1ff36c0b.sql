
-- Gamification rewards table
CREATE TABLE public.gamification_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'bonus_credits',
  value jsonb DEFAULT '{}',
  required_level int DEFAULT 1,
  required_badges text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.gamification_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view rewards"
  ON public.gamification_rewards FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage rewards"
  ON public.gamification_rewards FOR ALL TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

-- Track claimed rewards
CREATE TABLE public.gamification_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  reward_id uuid REFERENCES gamification_rewards(id) ON DELETE CASCADE NOT NULL,
  claimed_at timestamptz DEFAULT now(),
  status text DEFAULT 'claimed'
);

ALTER TABLE public.gamification_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claims"
  ON public.gamification_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can claim rewards"
  ON public.gamification_claims FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- XP triggers for CRM actions
CREATE OR REPLACE FUNCTION public.award_xp_on_lead_won()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.won_at IS NOT NULL AND (OLD.won_at IS NULL OR OLD.won_at IS DISTINCT FROM NEW.won_at) THEN
    UPDATE client_gamification
    SET xp = COALESCE(xp, 0) + 50,
        points = COALESCE(points, 0) + 50,
        last_activity_at = now()
    WHERE user_id = NEW.assigned_to
      AND organization_id = NEW.organization_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_xp_lead_won
  AFTER UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION award_xp_on_lead_won();

CREATE OR REPLACE FUNCTION public.award_xp_on_lead_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    UPDATE client_gamification
    SET xp = COALESCE(xp, 0) + 10,
        points = COALESCE(points, 0) + 10,
        last_activity_at = now()
    WHERE user_id = NEW.assigned_to
      AND organization_id = NEW.organization_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_xp_lead_created
  AFTER INSERT ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION award_xp_on_lead_created();
