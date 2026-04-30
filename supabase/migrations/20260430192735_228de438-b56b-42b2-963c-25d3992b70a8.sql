-- Adjust email_campaigns for event-driven campaign emails
ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz DEFAULT now();

-- Drop the problematic unique index on trigger_event alone (it would block any 2nd campaign of same type)
DROP INDEX IF EXISTS public.idx_email_campaigns_trigger_event;

-- Replace with regular index + composite unique that uses trigger_event semantics (org + event key)
CREATE INDEX IF NOT EXISTS idx_email_campaigns_trigger_event ON public.email_campaigns(trigger_event);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_org_event ON public.email_campaigns(organization_id, trigger_event);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_sent_at ON public.email_campaigns(sent_at DESC);

-- Make recipient_email nullable so we can log by user_id only when needed
ALTER TABLE public.email_campaigns ALTER COLUMN recipient_email DROP NOT NULL;