-- ============================================================
-- Audit fix: Add missing indexes and updated_at triggers
-- Generated: 2026-03-20
-- ============================================================

BEGIN;

-- ── Missing indexes on organization_id (high-frequency filter) ──

CREATE INDEX IF NOT EXISTS idx_support_tickets_org
  ON public.support_tickets (organization_id);

CREATE INDEX IF NOT EXISTS idx_client_content_org
  ON public.client_content (organization_id);

CREATE INDEX IF NOT EXISTS idx_client_campaigns_org
  ON public.client_campaigns (organization_id);

CREATE INDEX IF NOT EXISTS idx_client_scripts_org
  ON public.client_scripts (organization_id);

CREATE INDEX IF NOT EXISTS idx_client_dispatches_org
  ON public.client_dispatches (organization_id);

CREATE INDEX IF NOT EXISTS idx_client_sites_org
  ON public.client_sites (organization_id);

CREATE INDEX IF NOT EXISTS idx_client_checklist_items_org
  ON public.client_checklist_items (organization_id);

CREATE INDEX IF NOT EXISTS idx_client_gamification_org
  ON public.client_gamification (organization_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_org
  ON public.credit_transactions (organization_id);

CREATE INDEX IF NOT EXISTS idx_client_payments_org
  ON public.client_payments (organization_id);

CREATE INDEX IF NOT EXISTS idx_finance_closings_org
  ON public.finance_closings (organization_id);

CREATE INDEX IF NOT EXISTS idx_franchise_candidates_org
  ON public.franchise_candidates (organization_id);

-- ── Missing indexes on user_id (high-frequency filter) ──

CREATE INDEX IF NOT EXISTS idx_client_checklist_items_user
  ON public.client_checklist_items (user_id);

CREATE INDEX IF NOT EXISTS idx_client_gamification_user
  ON public.client_gamification (user_id);

CREATE INDEX IF NOT EXISTS idx_client_notifications_user
  ON public.client_notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_announcement_views_user
  ON public.announcement_views (user_id);

CREATE INDEX IF NOT EXISTS idx_user_evaluations_user
  ON public.user_evaluations (user_id);

CREATE INDEX IF NOT EXISTS idx_academy_progress_user
  ON public.academy_progress (user_id);

-- ── Composite indexes for common query patterns ──

CREATE INDEX IF NOT EXISTS idx_client_checklist_user_date
  ON public.client_checklist_items (user_id, date);

CREATE INDEX IF NOT EXISTS idx_client_gamification_user_org
  ON public.client_gamification (user_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_announcement_views_user_announcement
  ON public.announcement_views (announcement_id, user_id);

-- ── Missing updated_at triggers ──
-- (using existing update_updated_at_column() function)

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'support_tickets',
      'support_messages',
      'client_content',
      'client_campaigns',
      'client_scripts',
      'client_dispatches',
      'client_sites',
      'client_checklist_items',
      'client_notifications',
      'client_gamification',
      'client_payments',
      'finance_closings',
      'unit_documents',
      'franchise_candidates',
      'discount_coupons',
      'sales_plans',
      'client_posts',
      'traffic_strategies'
    ])
  LOOP
    -- Only create trigger if table has updated_at column and trigger doesn't exist
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'updated_at'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND event_object_table = tbl
        AND trigger_name = 'update_' || tbl || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
        tbl, tbl
      );
      RAISE NOTICE 'Created updated_at trigger for %', tbl;
    END IF;
  END LOOP;
END $$;

COMMIT;
