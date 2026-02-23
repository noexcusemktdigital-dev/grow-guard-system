
-- Add Asaas subscription columns to subscriptions table
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS asaas_subscription_id text,
  ADD COLUMN IF NOT EXISTS asaas_billing_type text DEFAULT 'BOLETO';

-- Create franchisee_charges table
CREATE TABLE public.franchisee_charges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  franchisee_org_id uuid NOT NULL REFERENCES public.organizations(id),
  month text NOT NULL,
  royalty_amount numeric NOT NULL DEFAULT 0,
  system_fee numeric NOT NULL DEFAULT 250,
  total_amount numeric NOT NULL DEFAULT 0,
  asaas_payment_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  paid_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.franchisee_charges ENABLE ROW LEVEL SECURITY;

-- Admins can manage franchisee charges
CREATE POLICY "Admins can manage franchisee_charges"
  ON public.franchisee_charges
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Members can view org charges
CREATE POLICY "Members can view org franchisee_charges"
  ON public.franchisee_charges
  FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));

-- Trigger for updated_at
CREATE TRIGGER update_franchisee_charges_updated_at
  BEFORE UPDATE ON public.franchisee_charges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Unique constraint to prevent duplicate charges per franchisee per month
ALTER TABLE public.franchisee_charges 
  ADD CONSTRAINT unique_franchisee_month UNIQUE (organization_id, franchisee_org_id, month);
