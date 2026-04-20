-- Tabela de posts agendados
CREATE TABLE public.social_scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  social_account_id uuid NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook','instagram')),
  caption text,
  image_url text,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','publishing','published','failed','canceled')),
  platform_post_id text,
  error_message text,
  attempts integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE INDEX idx_ssp_org ON public.social_scheduled_posts(organization_id);
CREATE INDEX idx_ssp_due ON public.social_scheduled_posts(scheduled_for) WHERE status = 'scheduled';

ALTER TABLE public.social_scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ssp_select_own_org" ON public.social_scheduled_posts FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "ssp_insert_own_org" ON public.social_scheduled_posts FOR INSERT
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "ssp_update_own_org" ON public.social_scheduled_posts FOR UPDATE
  USING (public.is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "ssp_delete_own_org" ON public.social_scheduled_posts FOR DELETE
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE TRIGGER trg_ssp_updated_at
  BEFORE UPDATE ON public.social_scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cache de insights de conta
CREATE TABLE public.social_account_insights_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  social_account_id uuid NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  period text NOT NULL,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  UNIQUE (social_account_id, period)
);

CREATE INDEX idx_saic_org ON public.social_account_insights_cache(organization_id);

ALTER TABLE public.social_account_insights_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saic_select_own_org" ON public.social_account_insights_cache FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));
-- write é apenas via service role (sem policies para INSERT/UPDATE/DELETE)

-- Bucket de mídia para posts
INSERT INTO storage.buckets (id, name, public)
VALUES ('social-media', 'social-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "social_media_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'social-media');

CREATE POLICY "social_media_member_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'social-media'
    AND public.is_member_of_org(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "social_media_member_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'social-media'
    AND public.is_member_of_org(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );