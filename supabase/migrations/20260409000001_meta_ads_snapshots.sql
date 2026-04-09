-- Migration: meta_ads_snapshots
-- Armazena snapshots de métricas Meta Ads por período e organização.
-- Gerado automaticamente pela edge function meta-ads-insights ou salvo manualmente.

CREATE TABLE IF NOT EXISTS meta_ads_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id),
  period text NOT NULL, -- 'today', 'last_7d', 'last_30d'
  spend numeric DEFAULT 0,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  leads integer DEFAULT 0,
  cpl numeric GENERATED ALWAYS AS (
    CASE WHEN leads > 0 THEN spend / leads ELSE 0 END
  ) STORED,
  ctr numeric GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN clicks::numeric / impressions * 100 ELSE 0 END
  ) STORED,
  campaigns_data jsonb,
  captured_at timestamptz DEFAULT now()
);

ALTER TABLE meta_ads_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view meta_ads_snapshots"
  ON meta_ads_snapshots
  FOR SELECT
  USING (org_id = get_user_org_id(auth.uid(), NULL::text));

CREATE INDEX IF NOT EXISTS idx_meta_ads_snapshots_org_period
  ON meta_ads_snapshots (org_id, period, captured_at DESC);
