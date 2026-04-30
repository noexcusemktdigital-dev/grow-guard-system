-- =========================================================================
-- WhatsApp Cloud API (Meta) — Fundação
-- Adiciona suporte ao provider oficial preservando Z-API/Evolution
-- =========================================================================

-- 1. Novos campos em whatsapp_instances (todos nullable p/ compatibilidade)
ALTER TABLE public.whatsapp_instances
  ADD COLUMN IF NOT EXISTS waba_id text,
  ADD COLUMN IF NOT EXISTS phone_number_id text,
  ADD COLUMN IF NOT EXISTS business_account_id text,
  ADD COLUMN IF NOT EXISTS verified_name text,
  ADD COLUMN IF NOT EXISTS cloud_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS access_token_encrypted text;

COMMENT ON COLUMN public.whatsapp_instances.waba_id IS 'WhatsApp Business Account ID (Meta Cloud API)';
COMMENT ON COLUMN public.whatsapp_instances.phone_number_id IS 'Phone Number ID na Meta Cloud API (usado em /messages)';
COMMENT ON COLUMN public.whatsapp_instances.business_account_id IS 'Meta Business Account ID (BM)';
COMMENT ON COLUMN public.whatsapp_instances.verified_name IS 'Display/verified name aprovado pela Meta';
COMMENT ON COLUMN public.whatsapp_instances.cloud_metadata IS 'Metadados Cloud (quality_rating, messaging_limit, name_status, certificate, etc.)';
COMMENT ON COLUMN public.whatsapp_instances.access_token_encrypted IS 'Access token Meta por-org (opcional; fallback p/ env global). Tratar como segredo.';

-- 2. Índice para lookup do webhook por phone_number_id
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_phone_number_id
  ON public.whatsapp_instances (phone_number_id)
  WHERE phone_number_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_waba_id
  ON public.whatsapp_instances (waba_id)
  WHERE waba_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_provider
  ON public.whatsapp_instances (organization_id, provider);

-- 3. Tabela de templates Cloud API
CREATE TABLE IF NOT EXISTS public.whatsapp_cloud_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  waba_id text,
  template_name text NOT NULL,
  language text NOT NULL DEFAULT 'pt_BR',
  category text,                        -- MARKETING | UTILITY | AUTHENTICATION
  status text NOT NULL DEFAULT 'PENDING', -- APPROVED | REJECTED | PENDING | DISABLED
  components jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta_template_id text,
  rejection_reason text,
  quality_score jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, template_name, language)
);

COMMENT ON TABLE public.whatsapp_cloud_templates IS 'Cache de templates Meta WhatsApp Cloud API por organização';

CREATE INDEX IF NOT EXISTS idx_wa_cloud_templates_org_status
  ON public.whatsapp_cloud_templates (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_wa_cloud_templates_instance
  ON public.whatsapp_cloud_templates (instance_id);

ALTER TABLE public.whatsapp_cloud_templates ENABLE ROW LEVEL SECURITY;

-- RLS — visualização para membros da organização
DROP POLICY IF EXISTS "Members view cloud templates" ON public.whatsapp_cloud_templates;
CREATE POLICY "Members view cloud templates"
  ON public.whatsapp_cloud_templates
  FOR SELECT
  TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Admins insert cloud templates" ON public.whatsapp_cloud_templates;
CREATE POLICY "Admins insert cloud templates"
  ON public.whatsapp_cloud_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (
      public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'cliente_admin'::app_role)
    )
  );

DROP POLICY IF EXISTS "Admins update cloud templates" ON public.whatsapp_cloud_templates;
CREATE POLICY "Admins update cloud templates"
  ON public.whatsapp_cloud_templates
  FOR UPDATE
  TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (
      public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'cliente_admin'::app_role)
    )
  );

DROP POLICY IF EXISTS "Admins delete cloud templates" ON public.whatsapp_cloud_templates;
CREATE POLICY "Admins delete cloud templates"
  ON public.whatsapp_cloud_templates
  FOR DELETE
  TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (
      public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'cliente_admin'::app_role)
    )
  );

-- 4. Trigger updated_at
DROP TRIGGER IF EXISTS update_wa_cloud_templates_updated_at ON public.whatsapp_cloud_templates;
CREATE TRIGGER update_wa_cloud_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_cloud_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Tabela de log de webhooks Cloud (auditoria)
CREATE TABLE IF NOT EXISTS public.whatsapp_cloud_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  phone_number_id text,
  event_type text,                  -- messages | statuses | errors | unknown
  payload jsonb NOT NULL,
  signature_valid boolean,
  processed boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.whatsapp_cloud_webhook_logs IS 'Auditoria de webhooks recebidos da Meta Cloud API';

CREATE INDEX IF NOT EXISTS idx_wa_cloud_webhook_logs_phone
  ON public.whatsapp_cloud_webhook_logs (phone_number_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wa_cloud_webhook_logs_org
  ON public.whatsapp_cloud_webhook_logs (organization_id, created_at DESC);

ALTER TABLE public.whatsapp_cloud_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins veem logs
DROP POLICY IF EXISTS "Admins view cloud webhook logs" ON public.whatsapp_cloud_webhook_logs;
CREATE POLICY "Admins view cloud webhook logs"
  ON public.whatsapp_cloud_webhook_logs
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL
    OR (
      public.is_member_of_org(auth.uid(), organization_id)
      AND (
        public.has_role(auth.uid(), 'super_admin'::app_role)
        OR public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'cliente_admin'::app_role)
      )
    )
  );