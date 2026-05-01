-- Rate limit por (user_id, organization_id, fn_name) com janela deslizante
-- Estratégia: contador simples por janela. Para escala alta, migrar para Redis/sliding window log.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id UUID NOT NULL,
  organization_id UUID,
  fn_name TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, fn_name, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_org ON public.rate_limits(organization_id) WHERE organization_id IS NOT NULL;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_rate_limits" ON public.rate_limits;
CREATE POLICY "service_role_all_rate_limits" ON public.rate_limits
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Função para incrementar contador atomicamente
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id UUID,
  p_organization_id UUID,
  p_fn_name TEXT,
  p_window_seconds INTEGER,
  p_max_requests INTEGER
) RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_window_start := date_trunc('second', now()) - (extract(epoch from now())::INTEGER % p_window_seconds) * INTERVAL '1 second';

  INSERT INTO public.rate_limits (user_id, organization_id, fn_name, window_start, request_count)
  VALUES (p_user_id, p_organization_id, p_fn_name, v_window_start, 1)
  ON CONFLICT (user_id, fn_name, window_start)
  DO UPDATE SET request_count = public.rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN QUERY SELECT
    (v_count <= p_max_requests) AS allowed,
    v_count AS current_count,
    (v_window_start + (p_window_seconds * INTERVAL '1 second')) AS reset_at;
END;
$$;

-- Cleanup de janelas antigas (rodar via pg_cron, 1x/hora)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void LANGUAGE sql
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE window_start < (now() - INTERVAL '24 hours');
$$;
