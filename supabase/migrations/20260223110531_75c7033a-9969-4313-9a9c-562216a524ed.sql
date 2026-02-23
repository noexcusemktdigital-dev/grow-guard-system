
-- Add modules field to subscriptions to track which modules are active
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS modules text NOT NULL DEFAULT 'comercial';
-- modules can be: 'comercial', 'marketing', 'combo'

-- Add api_key to organizations for API/webhook integration section
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS api_key text UNIQUE DEFAULT NULL;

-- Create function to generate API key for an org
CREATE OR REPLACE FUNCTION public.generate_org_api_key(_org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_key text;
BEGIN
  new_key := 'noe_' || encode(gen_random_bytes(24), 'hex');
  UPDATE public.organizations SET api_key = new_key WHERE id = _org_id;
  RETURN new_key;
END;
$$;
