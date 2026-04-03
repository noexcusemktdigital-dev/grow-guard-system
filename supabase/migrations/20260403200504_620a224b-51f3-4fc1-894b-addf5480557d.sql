-- API-005: Dead Letter Queue para crm_automation_queue

ALTER TABLE public.crm_automation_queue
  ADD COLUMN IF NOT EXISTS error_count   INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error    TEXT,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_crm_automation_queue_retry
  ON public.crm_automation_queue (processed, next_retry_at)
  WHERE processed = false;

COMMENT ON COLUMN public.crm_automation_queue.error_count IS 'Número de falhas consecutivas. Processamento bloqueado ao atingir 3.';
COMMENT ON COLUMN public.crm_automation_queue.last_error IS 'Mensagem do último erro para diagnóstico.';
COMMENT ON COLUMN public.crm_automation_queue.next_retry_at IS 'NULL = pronto para processar agora. Timestamp futuro = aguardando retry.';

-- DATA-001: Fix RLS em social_art_feedback
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'social_art_feedback'
  ) THEN
    DROP POLICY IF EXISTS "social_art_feedback_select" ON public.social_art_feedback;
    DROP POLICY IF EXISTS "Users can view social art feedback" ON public.social_art_feedback;
    DROP POLICY IF EXISTS "Allow read social_art_feedback" ON public.social_art_feedback;

    CREATE POLICY "social_art_feedback_org_select"
      ON public.social_art_feedback FOR SELECT
      USING (organization_id IN (
        SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
      ));

    DROP POLICY IF EXISTS "social_art_feedback_insert" ON public.social_art_feedback;
    DROP POLICY IF EXISTS "Users can insert social art feedback" ON public.social_art_feedback;
    CREATE POLICY "social_art_feedback_org_insert"
      ON public.social_art_feedback FOR INSERT
      WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
      ));

    DROP POLICY IF EXISTS "social_art_feedback_update" ON public.social_art_feedback;
    CREATE POLICY "social_art_feedback_org_update"
      ON public.social_art_feedback FOR UPDATE
      USING (organization_id IN (
        SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

-- API-006: Round-robin atômico para atribuição de leads
CREATE OR REPLACE FUNCTION public.get_and_increment_roulette_index(
  _org_id UUID, _member_count INTEGER
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _next_index INTEGER;
BEGIN
  UPDATE public.crm_settings
  SET roulette_last_index = ((COALESCE(roulette_last_index, -1) + 1) % _member_count)
  WHERE organization_id = _org_id
  RETURNING roulette_last_index INTO _next_index;

  IF NOT FOUND THEN
    INSERT INTO public.crm_settings (organization_id, roulette_last_index)
    VALUES (_org_id, 0)
    ON CONFLICT (organization_id) DO UPDATE SET roulette_last_index = 0
    RETURNING roulette_last_index INTO _next_index;
  END IF;

  RETURN COALESCE(_next_index, 0);
END; $$;

COMMENT ON FUNCTION public.get_and_increment_roulette_index IS 'API-006: Round-robin atômico para atribuição de leads.';