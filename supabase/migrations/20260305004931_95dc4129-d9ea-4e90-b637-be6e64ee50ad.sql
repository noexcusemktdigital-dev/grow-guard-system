ALTER TABLE client_content
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS cta text,
  ADD COLUMN IF NOT EXISTS main_message text,
  ADD COLUMN IF NOT EXISTS result jsonb,
  ADD COLUMN IF NOT EXISTS strategy_id uuid;