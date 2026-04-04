
-- Add client_name column
ALTER TABLE public.client_followups ADD COLUMN IF NOT EXISTS client_name text;

-- Make strategy_id nullable
ALTER TABLE public.client_followups ALTER COLUMN strategy_id DROP NOT NULL;

-- Drop old unique index if exists
DROP INDEX IF EXISTS public.client_followups_strategy_month_idx;

-- Create new unique index by org + client_name + month
CREATE UNIQUE INDEX client_followups_org_client_month_idx 
ON public.client_followups (organization_id, client_name, month_ref);
