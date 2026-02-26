
-- NPS responses table for pos-venda agent
CREATE TABLE public.client_nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL,
  agent_id UUID REFERENCES public.client_ai_agents(id) ON DELETE SET NULL,
  score INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Traffic strategies table
CREATE TABLE public.traffic_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platforms JSONB NOT NULL DEFAULT '[]',
  source_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for client_nps_responses
ALTER TABLE public.client_nps_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_nps" ON public.client_nps_responses
  FOR ALL USING (public.is_member_of_org(auth.uid(), organization_id));

-- RLS for traffic_strategies
ALTER TABLE public.traffic_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_traffic" ON public.traffic_strategies
  FOR ALL USING (public.is_member_of_org(auth.uid(), organization_id));

-- Validation trigger for NPS score
CREATE OR REPLACE FUNCTION public.validate_nps_score()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.score < 1 OR NEW.score > 10 THEN
    RAISE EXCEPTION 'NPS score must be between 1 and 10';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER check_nps_score
  BEFORE INSERT OR UPDATE ON public.client_nps_responses
  FOR EACH ROW EXECUTE FUNCTION public.validate_nps_score();
