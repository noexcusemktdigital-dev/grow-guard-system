CREATE TABLE IF NOT EXISTS public.meta_data_deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'meta',
  platform_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT meta_data_deletion_requests_platform_user_unique UNIQUE (platform, platform_user_id)
);

ALTER TABLE public.meta_data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages meta deletion requests"
  ON public.meta_data_deletion_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Super admins can view meta deletion requests"
  ON public.meta_data_deletion_requests
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));