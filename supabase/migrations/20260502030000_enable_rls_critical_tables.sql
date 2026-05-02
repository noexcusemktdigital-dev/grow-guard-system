-- Migration: enable_rls_critical_tables
-- Audit ref: docs/rls-audit-2026-05-01.md
-- Garante RLS habilitado nas 7 tabelas identificadas como sem RLS na auditoria.
-- Idempotente: usa IF NOT EXISTS / DROP POLICY IF EXISTS / ENABLE é seguro reexecutar.
--
-- NOTA: As migrations originais já continham ENABLE ROW LEVEL SECURITY + policies.
-- Esta migration reaplica de forma defensiva caso o estado real do banco tenha divergido
-- (ex.: migration rodou parcialmente, rollback manual, restore de snapshot anterior).
--
-- Prioridade P0: ads_connections, ads_oauth_states (tokens OAuth)
-- Prioridade P0: franqueado_prospections, franqueado_strategies (dados comerciais)
-- Prioridade P1: calendar_event_invites, meta_ads_snapshots, noe_service_catalog

-- ============================================================
-- 1. ads_connections
--    Coluna de tenant: org_id
--    Função helper: get_user_org_id(auth.uid(), NULL::text)
-- ============================================================
ALTER TABLE public.ads_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_ads_connections" ON public.ads_connections;
CREATE POLICY "service_role_all_ads_connections" ON public.ads_connections
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Members view own org ads_connections" ON public.ads_connections;
CREATE POLICY "Members view own org ads_connections" ON public.ads_connections
  FOR SELECT
  USING (org_id = get_user_org_id(auth.uid(), NULL::text));

DROP POLICY IF EXISTS "Admins manage ads_connections" ON public.ads_connections;
CREATE POLICY "Admins manage ads_connections" ON public.ads_connections
  FOR ALL
  USING (org_id = get_user_org_id(auth.uid(), NULL::text))
  WITH CHECK (org_id = get_user_org_id(auth.uid(), NULL::text));

-- ============================================================
-- 2. ads_oauth_states
--    State token de curta duração (TTL 10 min).
--    Sem coluna de user scope seguro — apenas service_role acessa.
-- ============================================================
ALTER TABLE public.ads_oauth_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_ads_oauth_states" ON public.ads_oauth_states;
CREATE POLICY "service_role_all_ads_oauth_states" ON public.ads_oauth_states
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 3. franqueado_prospections
--    Coluna de tenant: organization_id
--    Helper: is_member_of_org(auth.uid(), organization_id)
-- ============================================================
ALTER TABLE public.franqueado_prospections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_franqueado_prospections" ON public.franqueado_prospections;
CREATE POLICY "service_role_all_franqueado_prospections" ON public.franqueado_prospections
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Members can manage prospections" ON public.franqueado_prospections;
CREATE POLICY "Members can manage prospections" ON public.franqueado_prospections
  FOR ALL
  USING (is_member_of_org(auth.uid(), organization_id));

-- ============================================================
-- 4. franqueado_strategies
--    Coluna de tenant: organization_id
-- ============================================================
ALTER TABLE public.franqueado_strategies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_franqueado_strategies" ON public.franqueado_strategies;
CREATE POLICY "service_role_all_franqueado_strategies" ON public.franqueado_strategies
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Members can manage strategies" ON public.franqueado_strategies;
CREATE POLICY "Members can manage strategies" ON public.franqueado_strategies
  FOR ALL
  USING (is_member_of_org(auth.uid(), organization_id));

-- ============================================================
-- 5. calendar_event_invites
--    Coluna de tenant: user_id (convite pertence ao usuário)
--    Acesso gerenciado via evento pai (calendar_events.organization_id)
-- ============================================================
ALTER TABLE public.calendar_event_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_calendar_event_invites" ON public.calendar_event_invites;
CREATE POLICY "service_role_all_calendar_event_invites" ON public.calendar_event_invites
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view own invites" ON public.calendar_event_invites;
CREATE POLICY "Users can view own invites" ON public.calendar_event_invites
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Members can manage invites" ON public.calendar_event_invites;
CREATE POLICY "Members can manage invites" ON public.calendar_event_invites
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_events ce
      WHERE ce.id = event_id
        AND is_member_of_org(auth.uid(), ce.organization_id)
    )
  );

-- ============================================================
-- 6. meta_ads_snapshots
--    Coluna de tenant: org_id
-- ============================================================
ALTER TABLE public.meta_ads_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_meta_ads_snapshots" ON public.meta_ads_snapshots;
CREATE POLICY "service_role_all_meta_ads_snapshots" ON public.meta_ads_snapshots
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Org members can view meta_ads_snapshots" ON public.meta_ads_snapshots;
CREATE POLICY "Org members can view meta_ads_snapshots" ON public.meta_ads_snapshots
  FOR SELECT
  USING (org_id = get_user_org_id(auth.uid(), NULL::text));

-- ============================================================
-- 7. noe_service_catalog
--    Coluna de tenant: organization_id
--    Leitura: membros da org; Escrita: admin/franqueado
-- ============================================================
ALTER TABLE public.noe_service_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_noe_service_catalog" ON public.noe_service_catalog;
CREATE POLICY "service_role_all_noe_service_catalog" ON public.noe_service_catalog
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Members can view catalog" ON public.noe_service_catalog;
CREATE POLICY "Members can view catalog" ON public.noe_service_catalog
  FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Admins can manage catalog" ON public.noe_service_catalog;
CREATE POLICY "Admins can manage catalog" ON public.noe_service_catalog
  FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'franqueado'::app_role)
  );
