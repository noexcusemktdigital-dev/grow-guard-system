
-- Create calculator_settings table for franchisee surplus configuration
CREATE TABLE public.calculator_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  surplus_type text NOT NULL DEFAULT 'percentage',
  surplus_value numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.calculator_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own org settings"
  ON public.calculator_settings FOR SELECT
  TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert own org settings"
  ON public.calculator_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update own org settings"
  ON public.calculator_settings FOR UPDATE
  TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

-- Add strategy_id to crm_proposals
ALTER TABLE public.crm_proposals ADD COLUMN IF NOT EXISTS strategy_id uuid REFERENCES public.franqueado_strategies(id) ON DELETE SET NULL;
