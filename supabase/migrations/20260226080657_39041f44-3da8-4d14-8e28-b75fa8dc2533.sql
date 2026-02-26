
-- Table: franchisee_system_payments
CREATE TABLE public.franchisee_system_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  month text NOT NULL,
  amount numeric NOT NULL DEFAULT 250,
  billing_type text NOT NULL DEFAULT 'BOLETO',
  asaas_payment_id text,
  invoice_url text,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, month)
);

ALTER TABLE public.franchisee_system_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own org system payments"
  ON public.franchisee_system_payments FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert own org system payments"
  ON public.franchisee_system_payments FOR INSERT
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

-- Table: client_diagnostics
CREATE TABLE public.client_diagnostics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  created_by uuid,
  scores jsonb NOT NULL DEFAULT '{}',
  total_score numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own org diagnostics"
  ON public.client_diagnostics FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert own org diagnostics"
  ON public.client_diagnostics FOR INSERT
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update own org diagnostics"
  ON public.client_diagnostics FOR UPDATE
  USING (public.is_member_of_org(auth.uid(), organization_id));
