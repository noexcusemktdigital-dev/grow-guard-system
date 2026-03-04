ALTER TABLE public.whatsapp_contacts 
  ADD COLUMN IF NOT EXISTS instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL;