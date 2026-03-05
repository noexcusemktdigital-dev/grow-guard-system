ALTER TABLE marketing_strategies 
  ADD COLUMN IF NOT EXISTS strategy_result jsonb,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';