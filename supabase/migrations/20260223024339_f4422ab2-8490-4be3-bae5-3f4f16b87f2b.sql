
-- Create credit_transactions table
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'purchase',
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Admins (franqueadora) can manage all transactions
CREATE POLICY "Admins can manage credit_transactions"
ON public.credit_transactions
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Members can view own org transactions
CREATE POLICY "Members can view org credit_transactions"
ON public.credit_transactions
FOR SELECT
USING (is_member_of_org(auth.uid(), organization_id));

-- Add asaas_customer_id to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;

-- Index for fast lookups
CREATE INDEX idx_credit_transactions_org ON public.credit_transactions(organization_id);
CREATE INDEX idx_credit_transactions_created ON public.credit_transactions(created_at DESC);
CREATE INDEX idx_organizations_asaas ON public.organizations(asaas_customer_id) WHERE asaas_customer_id IS NOT NULL;
