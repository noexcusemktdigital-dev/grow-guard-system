
-- Create client_payments table for tracking client billing via Asaas
CREATE TABLE public.client_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  franchisee_share NUMERIC NOT NULL DEFAULT 0,
  billing_type TEXT NOT NULL DEFAULT 'PIX',
  asaas_payment_id TEXT,
  asaas_customer_id TEXT,
  invoice_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.client_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org client_payments"
  ON public.client_payments FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Users can insert client_payments for their org"
  ON public.client_payments FOR INSERT
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Users can update their org client_payments"
  ON public.client_payments FOR UPDATE
  USING (public.is_member_of_org(auth.uid(), organization_id));

-- Super admin can view all client_payments (for franqueadora receitas)
CREATE POLICY "Super admin can view all client_payments"
  ON public.client_payments FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admin can view all franchisee_system_payments
CREATE POLICY "Super admin can view all franchisee_system_payments"
  ON public.franchisee_system_payments FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Index for performance
CREATE INDEX idx_client_payments_org_month ON public.client_payments(organization_id, month);
CREATE INDEX idx_client_payments_contract ON public.client_payments(contract_id);
