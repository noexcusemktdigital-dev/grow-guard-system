
-- Create franchise_candidates table
CREATE TABLE public.franchise_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  birth_date TEXT,
  marital_status TEXT,
  cep TEXT,
  city TEXT,
  address TEXT,
  cpf TEXT,
  rg TEXT,
  company_name TEXT,
  cnpj TEXT,
  company_address TEXT,
  doc_url TEXT,
  lgpd_consent BOOLEAN DEFAULT false,
  lgpd_consent_date TIMESTAMPTZ,
  status TEXT DEFAULT 'novo',
  source_lead_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.franchise_candidates ENABLE ROW LEVEL SECURITY;

-- Policies: only members of the org can access
CREATE POLICY "Members can view candidates"
ON public.franchise_candidates FOR SELECT
TO authenticated
USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert candidates"
ON public.franchise_candidates FOR INSERT
TO authenticated
WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update candidates"
ON public.franchise_candidates FOR UPDATE
TO authenticated
USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can delete candidates"
ON public.franchise_candidates FOR DELETE
TO authenticated
USING (public.is_member_of_org(auth.uid(), organization_id));

-- Allow webhook (service role) to insert without auth
CREATE POLICY "Service role can insert candidates"
ON public.franchise_candidates FOR INSERT
TO service_role
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_franchise_candidates_updated_at
BEFORE UPDATE ON public.franchise_candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for org filtering
CREATE INDEX idx_franchise_candidates_org ON public.franchise_candidates(organization_id);
CREATE INDEX idx_franchise_candidates_status ON public.franchise_candidates(status);
