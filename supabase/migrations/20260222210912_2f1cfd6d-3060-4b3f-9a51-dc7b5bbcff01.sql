
-- CRM Settings table (one per organization)
CREATE TABLE public.crm_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_roulette_enabled boolean NOT NULL DEFAULT false,
  roulette_members jsonb NOT NULL DEFAULT '[]'::jsonb,
  sla_first_contact_hours integer NOT NULL DEFAULT 24,
  sla_task_open_days integer NOT NULL DEFAULT 3,
  alerts_enabled boolean NOT NULL DEFAULT true,
  auto_tasks_on_stage_move boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org crm_settings"
  ON public.crm_settings FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage crm_settings"
  ON public.crm_settings FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'cliente_admin'::app_role)
  );

CREATE TRIGGER update_crm_settings_updated_at
  BEFORE UPDATE ON public.crm_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CRM Automations table
CREATE TABLE public.crm_automations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL DEFAULT 'stage_change',
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_type text NOT NULL DEFAULT 'create_task',
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org crm_automations"
  ON public.crm_automations FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage crm_automations"
  ON public.crm_automations FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'cliente_admin'::app_role)
  );

CREATE TRIGGER update_crm_automations_updated_at
  BEFORE UPDATE ON public.crm_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
