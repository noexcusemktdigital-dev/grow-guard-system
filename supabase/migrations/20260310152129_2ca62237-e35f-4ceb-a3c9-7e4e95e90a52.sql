
ALTER TABLE public.whatsapp_instances 
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'zapi';

ALTER TABLE public.whatsapp_instances 
  ADD COLUMN IF NOT EXISTS base_url TEXT DEFAULT NULL;
