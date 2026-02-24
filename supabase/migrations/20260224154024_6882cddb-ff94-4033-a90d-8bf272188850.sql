ALTER TABLE public.google_calendar_tokens
  ADD COLUMN IF NOT EXISTS client_id text,
  ADD COLUMN IF NOT EXISTS client_secret text;