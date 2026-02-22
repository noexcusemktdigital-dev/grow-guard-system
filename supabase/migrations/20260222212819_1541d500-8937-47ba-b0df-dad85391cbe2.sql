
-- 1. Create crm_contacts table
CREATE TABLE public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  position text,
  notes text,
  tags text[] DEFAULT '{}',
  source text,
  custom_fields jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org contacts" ON public.crm_contacts FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can insert contacts" ON public.crm_contacts FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can update contacts" ON public.crm_contacts FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can delete contacts" ON public.crm_contacts FOR DELETE USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'cliente_admin'::app_role));

CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create crm_teams table
CREATE TABLE public.crm_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  description text,
  members jsonb DEFAULT '[]',
  funnel_ids jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org teams" ON public.crm_teams FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage teams" ON public.crm_teams FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'cliente_admin'::app_role));

CREATE TRIGGER update_crm_teams_updated_at BEFORE UPDATE ON public.crm_teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add contact_id to crm_leads
ALTER TABLE public.crm_leads ADD COLUMN contact_id uuid REFERENCES public.crm_contacts(id);

-- 4. Alter crm_settings: add SLA minutes columns and outbound_webhooks
ALTER TABLE public.crm_settings
  ADD COLUMN sla_first_contact_minutes integer NOT NULL DEFAULT 1440,
  ADD COLUMN sla_no_response_minutes integer NOT NULL DEFAULT 4320,
  ADD COLUMN sla_stage_stuck_days integer NOT NULL DEFAULT 7,
  ADD COLUMN outbound_webhooks jsonb NOT NULL DEFAULT '[]';

-- 5. Alter crm_automations: add description, funnel_ids, team_ids, assigned_user_ids, priority
ALTER TABLE public.crm_automations
  ADD COLUMN description text,
  ADD COLUMN funnel_ids jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN team_ids jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN assigned_user_ids jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN priority integer NOT NULL DEFAULT 0;
