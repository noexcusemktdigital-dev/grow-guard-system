
-- Add status column to announcements
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Fix any rows that had type set to 'archived'
UPDATE public.announcements SET status = 'archived', type = 'Informativo' WHERE type = 'archived';
