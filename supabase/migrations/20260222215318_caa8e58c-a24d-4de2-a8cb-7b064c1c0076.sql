
ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS document text;
ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS birth_date date;
