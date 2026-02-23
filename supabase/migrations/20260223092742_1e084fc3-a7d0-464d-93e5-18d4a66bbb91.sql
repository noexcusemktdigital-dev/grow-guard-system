
-- 1. Tabela user_evaluations
CREATE TABLE public.user_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  evaluator_id uuid NOT NULL,
  user_id uuid NOT NULL,
  period text NOT NULL,
  score integer NOT NULL,
  categories jsonb DEFAULT '{}',
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_evaluations ENABLE ROW LEVEL SECURITY;

-- Admins can manage evaluations in their org
CREATE POLICY "Admins can manage evaluations"
ON public.user_evaluations FOR ALL
USING (
  is_member_of_org(auth.uid(), organization_id) AND
  (has_role(auth.uid(), 'cliente_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Users can view their own evaluations
CREATE POLICY "Users can view own evaluations"
ON public.user_evaluations FOR SELECT
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_user_evaluations_updated_at
BEFORE UPDATE ON public.user_evaluations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tabela checklist_templates
CREATE TABLE public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  description text,
  category text DEFAULT 'operacional',
  frequency text DEFAULT 'daily',
  conditions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage checklist_templates"
ON public.checklist_templates FOR ALL
USING (
  is_member_of_org(auth.uid(), organization_id) AND
  (has_role(auth.uid(), 'cliente_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Members can view org checklist_templates"
ON public.checklist_templates FOR SELECT
USING (is_member_of_org(auth.uid(), organization_id));

-- 3. Alterar client_checklist_items
ALTER TABLE public.client_checklist_items
  ADD COLUMN source text DEFAULT 'manual',
  ADD COLUMN category text DEFAULT 'operacional';

-- 4. Alterar client_gamification
ALTER TABLE public.client_gamification
  ADD COLUMN xp integer DEFAULT 0,
  ADD COLUMN title text DEFAULT 'Novato';

-- Validation trigger for score (1-5) instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_evaluation_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.score < 1 OR NEW.score > 5 THEN
    RAISE EXCEPTION 'Score must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_evaluation_score_trigger
BEFORE INSERT OR UPDATE ON public.user_evaluations
FOR EACH ROW EXECUTE FUNCTION public.validate_evaluation_score();
