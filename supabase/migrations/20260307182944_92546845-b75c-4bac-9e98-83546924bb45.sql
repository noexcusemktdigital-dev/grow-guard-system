
-- 1. Add referral_code to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS saas_commission_percent numeric DEFAULT 20;

-- 2. Create referral_discounts table
CREATE TABLE IF NOT EXISTS public.referral_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  discount_percent numeric NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  uses_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE public.referral_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own org referral" ON public.referral_discounts
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Members can update own org referral" ON public.referral_discounts
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
  ));

-- 3. Add discount_percent to subscriptions for tracking applied discount
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS referral_org_id uuid REFERENCES public.organizations(id);

-- 4. Create saas_commissions table for tracking SaaS commissions paid to franchisees
CREATE TABLE IF NOT EXISTS public.saas_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisee_org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  asaas_payment_id text,
  payment_value numeric NOT NULL DEFAULT 0,
  commission_percent numeric NOT NULL DEFAULT 20,
  commission_value numeric NOT NULL DEFAULT 0,
  month text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saas_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own org commissions" ON public.saas_commissions
  FOR SELECT TO authenticated
  USING (
    franchisee_org_id IN (SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid())
    OR client_org_id IN (SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid())
  );

-- 5. RPC to get referral info by code
CREATE OR REPLACE FUNCTION public.get_referral_by_code(_code text)
RETURNS TABLE(organization_id uuid, org_name text, discount_percent numeric, is_active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT o.id AS organization_id, o.name AS org_name, rd.discount_percent, rd.is_active
  FROM organizations o
  JOIN referral_discounts rd ON rd.organization_id = o.id
  WHERE o.referral_code = _code AND rd.is_active = true;
$$;

-- 6. RPC to get SaaS clients for a franchisee
CREATE OR REPLACE FUNCTION public.get_saas_clients_for_org(_org_id uuid)
RETURNS TABLE(
  org_id uuid, org_name text, plan text, plan_status text,
  credits_balance bigint, expires_at timestamptz, created_at timestamptz,
  discount_percent numeric, referral_org_id uuid
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    o.id AS org_id, o.name AS org_name,
    s.plan, s.status AS plan_status,
    COALESCE(cw.balance, 0)::bigint AS credits_balance,
    s.expires_at, o.created_at,
    COALESCE(s.discount_percent, 0) AS discount_percent,
    s.referral_org_id
  FROM organizations o
  LEFT JOIN subscriptions s ON s.organization_id = o.id
  LEFT JOIN credit_wallets cw ON cw.organization_id = o.id
  WHERE o.parent_org_id = _org_id AND o.type = 'cliente'
  ORDER BY o.created_at DESC;
$$;

-- 7. RPC to get commissions for a franchisee
CREATE OR REPLACE FUNCTION public.get_saas_commissions_for_org(_org_id uuid)
RETURNS TABLE(
  id uuid, client_org_id uuid, client_name text,
  payment_value numeric, commission_percent numeric, commission_value numeric,
  month text, status text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    sc.id, sc.client_org_id, o.name AS client_name,
    sc.payment_value, sc.commission_percent, sc.commission_value,
    sc.month, sc.status, sc.created_at
  FROM saas_commissions sc
  JOIN organizations o ON o.id = sc.client_org_id
  WHERE sc.franchisee_org_id = _org_id
  ORDER BY sc.created_at DESC;
$$;
