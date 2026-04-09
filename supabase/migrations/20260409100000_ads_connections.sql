-- Migration: ads_connections + ads_oauth_states
-- Conexões OAuth de contas de anúncio por org (multi-cliente)
-- Gerado em: 2026-04-09

-- Tabela de estados OAuth temporários (TTL 10 min)
CREATE TABLE IF NOT EXISTS ads_oauth_states (
  state text PRIMARY KEY,
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '10 minutes'
);

ALTER TABLE ads_oauth_states ENABLE ROW LEVEL SECURITY;
-- Sem policy pública — apenas service_role acessa

-- Index para limpeza de estados expirados
CREATE INDEX IF NOT EXISTS idx_ads_oauth_states_expires ON ads_oauth_states(expires_at);

-- Conexões OAuth de contas de anúncio por org
CREATE TABLE IF NOT EXISTS ads_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'meta',        -- 'meta' | 'google'
  ad_account_id text NOT NULL,                  -- ex: act_961503441507397
  ad_account_name text,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  business_id text,
  page_id text,
  page_name text,
  status text NOT NULL DEFAULT 'active',        -- 'active' | 'expired' | 'revoked'
  connected_by uuid REFERENCES auth.users(id),
  connected_at timestamptz DEFAULT now(),
  last_synced_at timestamptz,
  UNIQUE(org_id, provider, ad_account_id)
);

ALTER TABLE ads_connections ENABLE ROW LEVEL SECURITY;

-- Membros podem ver conexões da própria org
CREATE POLICY "Members view own org ads_connections"
  ON ads_connections FOR SELECT
  USING (org_id = get_user_org_id(auth.uid(), NULL::text));

-- Admins podem inserir/atualizar
CREATE POLICY "Admins manage ads_connections"
  ON ads_connections FOR ALL
  USING (org_id = get_user_org_id(auth.uid(), NULL::text))
  WITH CHECK (org_id = get_user_org_id(auth.uid(), NULL::text));

-- Index para queries por org
CREATE INDEX IF NOT EXISTS idx_ads_connections_org
  ON ads_connections(org_id, provider, status);

-- Index para token refresh cron
CREATE INDEX IF NOT EXISTS idx_ads_connections_expiry
  ON ads_connections(token_expires_at, status)
  WHERE status = 'active';

-- View consolidada para franqueadora (ver todas as orgs filhas)
CREATE OR REPLACE VIEW ads_connections_network AS
SELECT
  ac.*,
  o.name AS org_name
FROM ads_connections ac
JOIN organizations o ON o.id = ac.org_id;

-- Cleanup automático de estados OAuth expirados (pg_cron se disponível)
-- Executado a cada hora pela social_cron ou manualmente
CREATE OR REPLACE FUNCTION cleanup_ads_oauth_states()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM ads_oauth_states WHERE expires_at < now();
$$;
