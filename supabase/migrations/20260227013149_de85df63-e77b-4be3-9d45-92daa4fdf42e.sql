
-- Bug 2: Onboarding - add responsible column
ALTER TABLE public.onboarding_units ADD COLUMN IF NOT EXISTS responsible text;

-- Contracts: add new columns
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS contract_type text DEFAULT 'assessoria';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS owner_type text DEFAULT 'unidade';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS unit_org_id uuid REFERENCES public.organizations(id);

-- Contract templates: add new columns
ALTER TABLE public.contract_templates ADD COLUMN IF NOT EXISTS template_type text DEFAULT 'assessoria';
ALTER TABLE public.contract_templates ADD COLUMN IF NOT EXISTS description text;

-- Function: is_member_or_parent_of_org (for invite-user fix)
CREATE OR REPLACE FUNCTION public.is_member_or_parent_of_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE user_id = _user_id
      AND (
        organization_id = _org_id
        OR organization_id = (SELECT parent_org_id FROM public.organizations WHERE id = _org_id)
      )
  )
$$;

-- Function: get_network_contracts (all contracts from org + child orgs)
CREATE OR REPLACE FUNCTION public.get_network_contracts(_org_id uuid)
RETURNS TABLE(
  id uuid,
  organization_id uuid,
  org_name text,
  template_id uuid,
  title text,
  content text,
  status text,
  signer_name text,
  signer_email text,
  client_document text,
  client_phone text,
  client_address text,
  service_description text,
  monthly_value numeric,
  total_value numeric,
  duration_months integer,
  start_date date,
  end_date date,
  payment_day integer,
  contract_type text,
  owner_type text,
  unit_org_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    c.id, c.organization_id,
    o.name AS org_name,
    c.template_id, c.title, c.content, c.status,
    c.signer_name, c.signer_email,
    c.client_document, c.client_phone, c.client_address,
    c.service_description, c.monthly_value, c.total_value,
    c.duration_months, c.start_date, c.end_date, c.payment_day,
    c.contract_type, c.owner_type, c.unit_org_id,
    c.created_at, c.updated_at
  FROM contracts c
  JOIN organizations o ON o.id = c.organization_id
  WHERE c.organization_id = _org_id
     OR o.parent_org_id = _org_id
  ORDER BY c.created_at DESC;
$$;
