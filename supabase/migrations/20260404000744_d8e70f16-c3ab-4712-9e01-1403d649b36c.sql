ALTER TABLE public.whatsapp_instances ADD COLUMN IF NOT EXISTS asaas_subscription_id text;
ALTER TABLE public.whatsapp_instances ADD COLUMN IF NOT EXISTS billing_status text DEFAULT 'pending';