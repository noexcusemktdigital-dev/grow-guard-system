
-- Add new columns to goals table for scope, metric, priority, status
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'company';
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS team_id uuid;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS metric text NOT NULL DEFAULT 'revenue';
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'media';
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
