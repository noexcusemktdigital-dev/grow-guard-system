-- Auditoria 2026-04-03: API-005 DLQ + DATA-001 RLS fix
-- Aplicar via Lovable Cloud SQL Editor (projeto gxrhdpbbxfipeopdyygn)

-- ============================================================
-- API-005: Dead Letter Queue para crm_automation_queue
-- Permite retry automático de eventos com falha (até 3x)
-- ============================================================

ALTER TABLE public.crm_automation_queue
  ADD COLUMN IF NOT EXISTS error_count   INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error    TEXT,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

-- Índice para queries de retry (busca eventos prontos para reprocessar)
CREATE INDEX IF NOT EXISTS idx_crm_automation_queue_retry
  ON public.crm_automation_queue (processed, next_retry_at)
  WHERE processed = false;

COMMENT ON COLUMN public.crm_automation_queue.error_count IS 'Número de falhas consecutivas. Processamento permanente bloqueado ao atingir 3.';
COMMENT ON COLUMN public.crm_automation_queue.last_error IS 'Mensagem do último erro para diagnóstico.';
COMMENT ON COLUMN public.crm_automation_queue.next_retry_at IS 'NULL = pronto para processar agora. Timestamp futuro = aguardando retry.';

-- ============================================================
-- DATA-001: Fix RLS USING(true) em social_art_feedback (SEC-NOE-005)
-- Política sem filtro permitia acesso cross-org ao feedback de artes
-- ============================================================

-- Verificar se a tabela existe antes de alterar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'social_art_feedback'
  ) THEN
    -- Recriar política com filtro correto de organização
    DROP POLICY IF EXISTS "social_art_feedback_select" ON public.social_art_feedback;
    DROP POLICY IF EXISTS "Users can view social art feedback" ON public.social_art_feedback;
    DROP POLICY IF EXISTS "Allow read social_art_feedback" ON public.social_art_feedback;

    -- Política de SELECT: apenas feedback da própria organização
    CREATE POLICY "social_art_feedback_org_select"
      ON public.social_art_feedback
      FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM public.organization_memberships
          WHERE user_id = auth.uid()
        )
      );

    -- Política de INSERT: apenas para própria organização
    DROP POLICY IF EXISTS "social_art_feedback_insert" ON public.social_art_feedback;
    DROP POLICY IF EXISTS "Users can insert social art feedback" ON public.social_art_feedback;
    CREATE POLICY "social_art_feedback_org_insert"
      ON public.social_art_feedback
      FOR INSERT
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM public.organization_memberships
          WHERE user_id = auth.uid()
        )
      );

    -- Política de UPDATE: apenas próprios registros
    DROP POLICY IF EXISTS "social_art_feedback_update" ON public.social_art_feedback;
    CREATE POLICY "social_art_feedback_org_update"
      ON public.social_art_feedback
      FOR UPDATE
      USING (
        organization_id IN (
          SELECT organization_id FROM public.organization_memberships
          WHERE user_id = auth.uid()
        )
      );

    RAISE NOTICE 'social_art_feedback RLS policies updated (DATA-001)';
  ELSE
    RAISE NOTICE 'social_art_feedback table not found — skipping RLS fix';
  END IF;
END $$;
