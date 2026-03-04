
-- Add surplus columns to contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS surplus_value NUMERIC DEFAULT 0;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS surplus_issuer TEXT;

-- Add surplus/share columns to client_payments
ALTER TABLE public.client_payments ADD COLUMN IF NOT EXISTS surplus_amount NUMERIC DEFAULT 0;
ALTER TABLE public.client_payments ADD COLUMN IF NOT EXISTS franqueadora_share NUMERIC DEFAULT 0;

-- Recreate function with new columns
DROP FUNCTION IF EXISTS public.get_network_contracts(uuid);

CREATE FUNCTION public.get_network_contracts(_org_id uuid)
RETURNS TABLE(
  id uuid, organization_id uuid, org_name text, template_id uuid, title text, content text,
  status text, signer_name text, signer_email text, client_document text, client_phone text,
  client_address text, service_description text, monthly_value numeric, total_value numeric,
  duration_months integer, start_date date, end_date date, payment_day integer,
  contract_type text, owner_type text, unit_org_id uuid,
  surplus_value numeric, surplus_issuer text,
  created_at timestamp with time zone, updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
    c.surplus_value, c.surplus_issuer,
    c.created_at, c.updated_at
  FROM contracts c
  JOIN organizations o ON o.id = c.organization_id
  WHERE c.organization_id = _org_id
     OR o.parent_org_id = _org_id
  ORDER BY c.created_at DESC;
$$;
