ALTER TABLE public.announcements ADD COLUMN show_dashboard boolean NOT NULL DEFAULT true;
ALTER TABLE public.announcements ADD COLUMN show_popup boolean NOT NULL DEFAULT false;
ALTER TABLE public.announcements ADD COLUMN require_confirmation boolean NOT NULL DEFAULT false;