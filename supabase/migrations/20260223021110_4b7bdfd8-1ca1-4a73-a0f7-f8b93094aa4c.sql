-- Remove unique constraint on organization_id to allow multiple instances per org
ALTER TABLE public.whatsapp_instances DROP CONSTRAINT whatsapp_instances_organization_id_key;

-- Add label field for users to name each instance
ALTER TABLE public.whatsapp_instances ADD COLUMN label text DEFAULT NULL;