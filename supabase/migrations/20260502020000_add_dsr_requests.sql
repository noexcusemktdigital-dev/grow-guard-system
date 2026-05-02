-- LGPD Art. 18 — Audit trail de Data Subject Requests (LGPD-003)
--
-- Registra export, delete, correction e revogação de consentimento.
-- Imutável via RLS: apenas service_role insere/atualiza.
-- Titular pode consultar suas próprias requests (SELECT).

CREATE TABLE IF NOT EXISTS public.dsr_requests (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL,
  requested_by     UUID        NOT NULL,
  request_type     TEXT        NOT NULL CHECK (request_type IN ('export', 'delete', 'correction', 'revoke_consent')),
  status           TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  details          JSONB,
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at     TIMESTAMPTZ,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_dsr_requests_user
  ON public.dsr_requests(user_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_dsr_requests_pending
  ON public.dsr_requests(status, requested_at)
  WHERE status = 'pending';

ALTER TABLE public.dsr_requests ENABLE ROW LEVEL SECURITY;

-- service_role: operações completas (edge functions usam service_role)
CREATE POLICY "service_role_all_dsr" ON public.dsr_requests
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Titular vê suas próprias DSR (como sujeito ou como solicitante)
CREATE POLICY "user_view_own_dsr" ON public.dsr_requests
  FOR SELECT
  USING (user_id = auth.uid() OR requested_by = auth.uid());
