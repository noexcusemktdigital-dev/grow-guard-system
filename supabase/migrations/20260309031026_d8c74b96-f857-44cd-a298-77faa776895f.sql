
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS sales_plan text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS marketing_plan text;
