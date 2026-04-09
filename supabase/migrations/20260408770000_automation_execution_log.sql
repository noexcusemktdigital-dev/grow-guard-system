-- INT-006: Tabela de log de execuções do crm-run-automations
-- Permite rastrear: quais automações foram executadas, para qual lead/contato,
-- resultado (sucesso/falha), e investigar reclamações de "automação não funcionou"
-- NOTE: A tabela canônica já existe como automation_execution_logs (20260403000004).
-- Esta migration é um alias/complemento com esquema ligeiramente diferente para compatibilidade
-- com o campo automation_type (vs action_type) e sem automation_id obrigatório.
-- Usar automation_execution_logs como tabela primária; este bloco é documentado como referência.

-- Se a tabela ainda não existir com este nome exato, criá-la:
CREATE TABLE IF NOT EXISTS public.automation_execution_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id        uuid        REFERENCES public.crm_automation_queue(id) ON DELETE SET NULL,
  automation_type text        NOT NULL, -- 'send_whatsapp', 'assign_to_team', 'update_stage', etc.
  lead_id         uuid,
  contact_id      uuid,
  result          text        NOT NULL CHECK (result IN ('success','failed','skipped')),
  error_message   text,
  metadata        jsonb       DEFAULT '{}',
  executed_at     timestamptz DEFAULT now()
);

ALTER TABLE public.automation_execution_log ENABLE ROW LEVEL SECURITY;

-- Admins can view their org's logs
CREATE POLICY "Admins can view automation logs"
  ON public.automation_execution_log FOR SELECT
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin', 'franqueado')
    )
  );

-- Service role full access (edge functions write logs)
CREATE POLICY "Service role full access on automation_execution_log"
  ON public.automation_execution_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_auto_exec_log_org_at
  ON public.automation_execution_log(organization_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_exec_log_lead
  ON public.automation_execution_log(lead_id) WHERE lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_auto_exec_log_result
  ON public.automation_execution_log(result, executed_at DESC)
  WHERE result = 'failed';
