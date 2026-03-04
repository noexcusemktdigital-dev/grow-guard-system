ALTER TABLE public.whatsapp_contacts ALTER COLUMN attending_mode SET DEFAULT 'ai';

UPDATE public.whatsapp_contacts SET attending_mode = 'ai' WHERE attending_mode IS NULL;