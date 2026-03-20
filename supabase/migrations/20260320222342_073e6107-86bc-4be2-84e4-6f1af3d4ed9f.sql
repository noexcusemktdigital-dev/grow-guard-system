
-- Table: ad_platform_connections
CREATE TABLE public.ad_platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('google_ads', 'meta_ads')),
  account_id text,
  account_name text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disconnected')),
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, platform)
);

ALTER TABLE public.ad_platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own org connections"
  ON public.ad_platform_connections FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert own org connections"
  ON public.ad_platform_connections FOR INSERT TO authenticated
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update own org connections"
  ON public.ad_platform_connections FOR UPDATE TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can delete own org connections"
  ON public.ad_platform_connections FOR DELETE TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

-- Table: ad_campaign_metrics
CREATE TABLE public.ad_campaign_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES public.ad_platform_connections(id) ON DELETE CASCADE,
  platform text NOT NULL,
  campaign_id text NOT NULL,
  campaign_name text,
  campaign_status text,
  date date NOT NULL,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  spend numeric(12,2) DEFAULT 0,
  conversions bigint DEFAULT 0,
  ctr numeric(8,4) DEFAULT 0,
  cpc numeric(10,2) DEFAULT 0,
  cpl numeric(10,2) DEFAULT 0,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, campaign_id, date)
);

ALTER TABLE public.ad_campaign_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own org metrics"
  ON public.ad_campaign_metrics FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Service role can insert metrics"
  ON public.ad_campaign_metrics FOR INSERT TO authenticated
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE INDEX idx_ad_metrics_org_date ON public.ad_campaign_metrics(organization_id, date DESC);
CREATE INDEX idx_ad_metrics_connection ON public.ad_campaign_metrics(connection_id, date DESC);
