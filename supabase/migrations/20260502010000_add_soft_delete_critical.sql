-- LGPD-002 (fase 1): soft delete em tabelas com PII crítica
--
-- Tabelas: finance_clients, crm_leads, organization_memberships
--
-- Padrão:
--   deleted_at TIMESTAMPTZ NULL  → NULL = ativo, NOT NULL = soft-deleted
--   view {table}_active          → filtra deleted_at IS NULL
--   index parcial WHERE NOT NULL → consultas de retenção/purge eficientes
--
-- NOTA: o frontend continua usando .delete() no curto prazo.
-- Migrar para .update({ deleted_at: new Date().toISOString() }) no próximo ciclo.
-- Leituras devem usar a view _active ou filtrar .is('deleted_at', null).

-- ============================================================
-- 1. finance_clients (PII: name, email, phone, document)
-- ============================================================
ALTER TABLE public.finance_clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_finance_clients_deleted_at
  ON public.finance_clients(deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW public.finance_clients_active AS
  SELECT * FROM public.finance_clients WHERE deleted_at IS NULL;

-- ============================================================
-- 2. crm_leads (PII: name, email, phone, company)
-- ============================================================
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_crm_leads_deleted_at
  ON public.crm_leads(deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW public.crm_leads_active AS
  SELECT * FROM public.crm_leads WHERE deleted_at IS NULL;

-- ============================================================
-- 3. organization_memberships (auditoria: quem perdeu acesso)
-- ============================================================
ALTER TABLE public.organization_memberships ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_org_memberships_deleted_at
  ON public.organization_memberships(deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW public.organization_memberships_active AS
  SELECT * FROM public.organization_memberships WHERE deleted_at IS NULL;

-- ============================================================
-- Helper RPC: soft delete com whitelist de tabelas permitidas
-- ============================================================
CREATE OR REPLACE FUNCTION public.soft_delete_record(
  p_table TEXT,
  p_id    UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_table NOT IN ('finance_clients', 'crm_leads', 'organization_memberships') THEN
    RAISE EXCEPTION 'soft_delete_record: tabela não permitida: %', p_table;
  END IF;

  EXECUTE format(
    'UPDATE public.%I SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL',
    p_table
  ) USING p_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

-- ============================================================
-- Purge: hard delete de registros soft-deleted há mais de 6 meses
-- Chamar via pg_cron ou job agendado — NUNCA automaticamente no app.
-- Retorna contagem por tabela para auditoria.
-- ============================================================
CREATE OR REPLACE FUNCTION public.purge_soft_deleted()
RETURNS TABLE(table_name TEXT, deleted_count INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.finance_clients
    WHERE deleted_at < now() - INTERVAL '6 months';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  table_name    := 'finance_clients';
  deleted_count := v_count;
  RETURN NEXT;

  DELETE FROM public.crm_leads
    WHERE deleted_at < now() - INTERVAL '6 months';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  table_name    := 'crm_leads';
  deleted_count := v_count;
  RETURN NEXT;

  -- organization_memberships: retenção maior (auditoria de acesso)
  -- mantém 2 anos conforme LGPD art. 16 (obrigação legal)
  DELETE FROM public.organization_memberships
    WHERE deleted_at < now() - INTERVAL '2 years';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  table_name    := 'organization_memberships';
  deleted_count := v_count;
  RETURN NEXT;
END;
$$;
