
CREATE TABLE public.platform_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  source TEXT NOT NULL DEFAULT 'edge_function',
  function_name TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  metadata JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'error',
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage error logs"
  ON public.platform_error_logs
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view error logs"
  ON public.platform_error_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
