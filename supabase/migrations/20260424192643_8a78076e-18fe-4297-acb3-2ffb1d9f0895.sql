ALTER TABLE public.crm_funnels
ADD COLUMN IF NOT EXISTS allow_backtrack boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS backtrack_mode text NOT NULL DEFAULT 'allow';

ALTER TABLE public.crm_funnels
DROP CONSTRAINT IF EXISTS crm_funnels_backtrack_mode_check;

ALTER TABLE public.crm_funnels
ADD CONSTRAINT crm_funnels_backtrack_mode_check
CHECK (backtrack_mode IN ('allow', 'warn', 'block'));