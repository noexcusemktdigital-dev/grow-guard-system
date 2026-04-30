ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS payment_blocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_blocked_at timestamptz,
ADD COLUMN IF NOT EXISTS payment_blocked_reason text;

CREATE INDEX IF NOT EXISTS idx_organizations_payment_blocked 
ON public.organizations(payment_blocked) WHERE payment_blocked = true;