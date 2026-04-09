-- SEC-RLS-01/02: Fix critical cross-org data leakage in credit_wallets + subscriptions
-- AUDIT FINDING: Admin role policies had NO organization scope filter,
-- allowing any admin to read ALL records across ALL organizations.
-- CONFIRMED BREACH: admin user could see 15 credit_wallets + 15 subscriptions
-- from completely unrelated organizations.
-- FIX: Scope admin access to their own org + direct child orgs only.

-- ============================================================
-- credit_wallets — fix admin policy
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage wallets" ON public.credit_wallets;

CREATE POLICY "Admins can manage own org wallets"
  ON public.credit_wallets FOR ALL
  USING (
    -- super_admin sees everything (platform-wide)
    has_role(auth.uid(), 'super_admin'::app_role)
    -- admin sees only their own org and direct child orgs
    OR (
      has_role(auth.uid(), 'admin'::app_role)
      AND (
        organization_id = get_user_org_id(auth.uid())
        OR organization_id IN (
          SELECT id FROM public.organizations
          WHERE parent_org_id = get_user_org_id(auth.uid())
        )
      )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      has_role(auth.uid(), 'admin'::app_role)
      AND (
        organization_id = get_user_org_id(auth.uid())
        OR organization_id IN (
          SELECT id FROM public.organizations
          WHERE parent_org_id = get_user_org_id(auth.uid())
        )
      )
    )
  );

-- ============================================================
-- subscriptions — fix admin policy
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;

CREATE POLICY "Admins can manage own org subscriptions"
  ON public.subscriptions FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      has_role(auth.uid(), 'admin'::app_role)
      AND (
        organization_id = get_user_org_id(auth.uid())
        OR organization_id IN (
          SELECT id FROM public.organizations
          WHERE parent_org_id = get_user_org_id(auth.uid())
        )
      )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      has_role(auth.uid(), 'admin'::app_role)
      AND (
        organization_id = get_user_org_id(auth.uid())
        OR organization_id IN (
          SELECT id FROM public.organizations
          WHERE parent_org_id = get_user_org_id(auth.uid())
        )
      )
    )
  );

-- Verify fix: these queries should return 0 for a regular admin user
-- (only their own org records should be visible):
-- SELECT count(*) FROM credit_wallets; -- should be 1 (own org only)
-- SELECT count(*) FROM subscriptions;  -- should be 1 (own org only)
