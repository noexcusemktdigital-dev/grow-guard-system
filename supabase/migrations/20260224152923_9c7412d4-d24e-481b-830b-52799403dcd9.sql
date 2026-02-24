
-- Google Calendar tokens table
CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  google_calendar_id text DEFAULT 'primary',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add google_event_id to calendar_events
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS google_event_id text;

-- RLS for google_calendar_tokens
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tokens"
  ON public.google_calendar_tokens
  FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own tokens"
  ON public.google_calendar_tokens
  FOR SELECT
  USING (user_id = auth.uid());
