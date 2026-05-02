-- Idempotência para mutações críticas (pagamentos, créditos)
-- LGPD: chave + hash do payload, nunca o payload em si
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT NOT NULL,
  fn_name TEXT NOT NULL,
  organization_id UUID,
  user_id UUID,
  request_hash TEXT NOT NULL,
  response_status INTEGER,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  PRIMARY KEY (key, fn_name)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires ON public.idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_org ON public.idempotency_keys(organization_id) WHERE organization_id IS NOT NULL;

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Apenas service_role acessa (edge fns rodam com service_role)
DROP POLICY IF EXISTS "service_role_all_idempotency" ON public.idempotency_keys;
CREATE POLICY "service_role_all_idempotency" ON public.idempotency_keys
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Cleanup de chaves expiradas (rodar via pg_cron)
CREATE OR REPLACE FUNCTION public.cleanup_idempotency_keys()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM public.idempotency_keys WHERE expires_at < now();
$$;

-- Tabela para webhook events (idempotência inbound)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  payload_hash TEXT,
  PRIMARY KEY (provider, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received ON public.webhook_events(received_at);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_webhook_events" ON public.webhook_events;
CREATE POLICY "service_role_all_webhook_events" ON public.webhook_events
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
