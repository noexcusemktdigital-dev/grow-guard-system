-- INT-006: Automation Execution Log
-- Trilha por execução de automação: quem disparou, qual ação, sucesso/falha
-- Apliar via Lovable Cloud SQL Editor (projeto gxrhdpbbxfipeopdyygn)

CREATE TABLE IF NOT EXISTS public.automation_execution_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID        NOT NULL,
  automation_id   UUID        NOT NULL,  -- crm_automations.id
  event_id        UUID        NOT NULL,  -- crm_automation_queue.id
  lead_id         UUID,
  action_type     TEXT        NOT NULL,
  status          TEXT        NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
  error_message   TEXT,
  metadata        JSONB       DEFAULT '{}'
);

ALTER TABLE public.automation_execution_logs ENABLE ROW LEVEL SECURITY;

-- Franqueado pode ver logs da própria org
CREATE POLICY "ael_select_org"
  ON public.automation_execution_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Somente service_role (trigger edge function) insere
-- Sem policy INSERT para usuários normais

CREATE INDEX IF NOT EXISTS idx_ael_org_created
  ON public.automation_execution_logs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ael_automation
  ON public.automation_execution_logs (automation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ael_lead
  ON public.automation_execution_logs (lead_id, created_at DESC);

COMMENT ON TABLE public.automation_execution_logs IS
  'INT-006: Log de execução por ação de automação CRM. Gravado pela edge function crm-run-automations.';
