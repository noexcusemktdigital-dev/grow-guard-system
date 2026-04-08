-- Migration: Social Integration — Phase 1 Tables
-- Sistema Noe / Noexcuse — 2026-04-08
-- Cria 4 tabelas para integração social direta (Meta/Instagram, LinkedIn, Google Ads, TikTok)

-- =============================================
-- 1. social_accounts — contas OAuth por plataforma
-- =============================================
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform           text        NOT NULL CHECK (platform IN ('instagram','facebook','linkedin','google_ads','tiktok')),
  account_id         text        NOT NULL,
  account_name       text,
  account_username   text,
  access_token       text        NOT NULL,
  refresh_token      text,
  token_expires_at   timestamptz,
  scopes             text[]      DEFAULT '{}',
  status             text        NOT NULL DEFAULT 'active'
                                 CHECK (status IN ('active','expired','disconnected')),
  -- perfil: picture_url, follower_count, page_id, page_access_token, etc.
  metadata           jsonb       DEFAULT '{}',
  last_synced_at     timestamptz,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  UNIQUE(organization_id, platform, account_id)
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org social accounts"
  ON public.social_accounts FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert org social accounts"
  ON public.social_accounts FOR INSERT
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update org social accounts"
  ON public.social_accounts FOR UPDATE
  USING (public.is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can delete org social accounts"
  ON public.social_accounts FOR DELETE
  USING (public.is_member_of_org(auth.uid(), organization_id));

-- Service role full access (edge functions)
CREATE POLICY "Service role social_accounts"
  ON public.social_accounts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_social_accounts_org_platform
  ON public.social_accounts(organization_id, platform);

CREATE INDEX IF NOT EXISTS idx_social_accounts_status
  ON public.social_accounts(status) WHERE status != 'disconnected';

-- updated_at auto-trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_social_accounts_updated_at ON public.social_accounts;
CREATE TRIGGER trg_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================
-- 2. social_posts — posts publicados e agendados
-- =============================================
CREATE TABLE IF NOT EXISTS public.social_posts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- Referência opcional ao post de arte já gerado pelo sistema
  client_post_id      uuid        REFERENCES public.client_posts(id) ON DELETE SET NULL,
  social_account_id   uuid        NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  platform            text        NOT NULL,
  -- ID retornado pela plataforma após publicação real
  platform_post_id    text,
  caption             text,
  hashtags            text[]      DEFAULT '{}',
  scheduled_at        timestamptz,
  published_at        timestamptz,
  status              text        NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft','scheduled','published','failed','archived')),
  error_message       text,
  -- URLs de mídia (imagens/vídeos) para o post
  media_urls          text[]      DEFAULT '{}',
  -- Meta: container_id (etapa 1 publish flow), permalink, thumbnail_url, etc.
  metadata            jsonb       DEFAULT '{}',
  created_by          uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org social posts"
  ON public.social_posts FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert org social posts"
  ON public.social_posts FOR INSERT
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update org social posts"
  ON public.social_posts FOR UPDATE
  USING (public.is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can delete org social posts"
  ON public.social_posts FOR DELETE
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Service role social_posts"
  ON public.social_posts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index crítico: buscar posts agendados a publicar
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled
  ON public.social_posts(organization_id, scheduled_at)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_social_posts_account
  ON public.social_posts(social_account_id);

DROP TRIGGER IF EXISTS trg_social_posts_updated_at ON public.social_posts;
CREATE TRIGGER trg_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================
-- 3. social_engagement_metrics — métricas por post/dia
-- =============================================
CREATE TABLE IF NOT EXISTS public.social_engagement_metrics (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  social_post_id    uuid        NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  platform          text        NOT NULL,
  likes             bigint      DEFAULT 0,
  comments          bigint      DEFAULT 0,
  shares            bigint      DEFAULT 0,
  saves             bigint      DEFAULT 0,
  reach             bigint      DEFAULT 0,
  impressions       bigint      DEFAULT 0,
  -- (likes + comments + shares + saves) / reach * 100
  engagement_rate   numeric(5,2) DEFAULT 0,
  -- Ad metrics (se veiculado como impulsionamento)
  spend_cents       bigint      DEFAULT 0,
  clicks            bigint      DEFAULT 0,
  cpc_cents         bigint      DEFAULT 0,
  -- Data de referência da coleta (para histórico diário)
  date              date        NOT NULL,
  synced_at         timestamptz DEFAULT now(),
  UNIQUE(social_post_id, date)
);

ALTER TABLE public.social_engagement_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org engagement metrics"
  ON public.social_engagement_metrics FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Service role social_engagement_metrics"
  ON public.social_engagement_metrics FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_social_metrics_post_date
  ON public.social_engagement_metrics(social_post_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_social_metrics_org_date
  ON public.social_engagement_metrics(organization_id, date DESC);

-- =============================================
-- 4. social_posting_queue — fila de publicação com retry
-- =============================================
CREATE TABLE IF NOT EXISTS public.social_posting_queue (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  social_post_id  uuid        NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  platform        text        NOT NULL,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','processing','success','failed','cancelled')),
  scheduled_for   timestamptz NOT NULL,
  attempted_at    timestamptz,
  completed_at    timestamptz,
  -- JSON com detalhes do erro da plataforma (código, mensagem, trace)
  error_details   jsonb,
  retry_count     int         DEFAULT 0,
  -- Máximo 3 tentativas (após isso: status=failed, social_posts.status=failed)
  max_retries     int         DEFAULT 3,
  -- Próxima tentativa (exponential backoff: 5min, 15min, 45min)
  next_retry_at   timestamptz,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.social_posting_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org posting queue"
  ON public.social_posting_queue FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Service role social_posting_queue"
  ON public.social_posting_queue FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index crítico: cron job busca pending/failed com next_retry_at <= now()
CREATE INDEX IF NOT EXISTS idx_queue_pending
  ON public.social_posting_queue(organization_id, scheduled_for)
  WHERE status NOT IN ('success','cancelled');

CREATE INDEX IF NOT EXISTS idx_queue_retry
  ON public.social_posting_queue(next_retry_at)
  WHERE status = 'failed' AND retry_count < max_retries;

-- =============================================
-- 5. Extensões em tabelas existentes
-- =============================================

-- client_posts: rastrear em quais plataformas foi publicado
ALTER TABLE public.client_posts
  ADD COLUMN IF NOT EXISTS platforms          text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_published       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_platforms text[] DEFAULT '{}';

COMMENT ON COLUMN public.client_posts.platforms IS 'Plataformas-alvo selecionadas ao criar o post (instagram, facebook, linkedin, tiktok)';
COMMENT ON COLUMN public.client_posts.is_published IS 'TRUE quando ao menos uma plataforma foi publicada com sucesso';
COMMENT ON COLUMN public.client_posts.published_platforms IS 'Lista das plataformas onde a publicação foi confirmada';
