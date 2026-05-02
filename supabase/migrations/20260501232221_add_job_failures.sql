-- DLQ universal para jobs/crons que falham.
-- Uso: edge fns chamam log_job_failure() em catch — pg_cron sweep alerta.

CREATE TABLE IF NOT EXISTS public.job_failures (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  job_kind TEXT NOT NULL DEFAULT 'cron',  -- cron | webhook | edge_fn | worker
  error_message TEXT NOT NULL,
  error_stack TEXT,
  payload JSONB,
  organization_id UUID,
  correlation_id TEXT,
  attempt INTEGER NOT NULL DEFAULT 1,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_job_failures_unresolved
  ON public.job_failures(failed_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_job_failures_job_name
  ON public.job_failures(job_name, failed_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_failures_org
  ON public.job_failures(organization_id) WHERE organization_id IS NOT NULL;

ALTER TABLE public.job_failures ENABLE ROW LEVEL SECURITY;

-- Service role: tudo
DROP POLICY IF EXISTS "service_role_all_job_failures" ON public.job_failures;
CREATE POLICY "service_role_all_job_failures" ON public.job_failures
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Admins de org veem falhas da própria org
DROP POLICY IF EXISTS "org_admin_view_job_failures" ON public.job_failures;
CREATE POLICY "org_admin_view_job_failures" ON public.job_failures
  FOR SELECT USING (
    organization_id IS NOT NULL
    AND organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Helper RPC: registra falha
CREATE OR REPLACE FUNCTION public.log_job_failure(
  p_job_name TEXT,
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL,
  p_payload JSONB DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,
  p_correlation_id TEXT DEFAULT NULL,
  p_job_kind TEXT DEFAULT 'cron'
) RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO public.job_failures (
    job_name, job_kind, error_message, error_stack, payload,
    organization_id, correlation_id
  ) VALUES (
    p_job_name, p_job_kind, p_error_message, p_error_stack, p_payload,
    p_organization_id, p_correlation_id
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Cleanup: falhas resolvidas antigas (> 90 dias) e não resolvidas (> 1 ano)
CREATE OR REPLACE FUNCTION public.cleanup_job_failures()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM public.job_failures
  WHERE (resolved_at IS NOT NULL AND resolved_at < now() - INTERVAL '90 days')
     OR (resolved_at IS NULL AND failed_at < now() - INTERVAL '1 year');
$$;
