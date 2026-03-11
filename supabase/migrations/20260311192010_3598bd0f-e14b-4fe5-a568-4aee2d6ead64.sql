
CREATE OR REPLACE FUNCTION public.get_network_ai_usage(_org_id uuid)
RETURNS TABLE(
  total_credits bigint,
  orgs_zero_credits bigint,
  orgs_low_credits bigint,
  ai_messages_24h bigint,
  ai_messages_7d bigint,
  tokens_24h bigint,
  tokens_7d bigint,
  zero_credit_orgs jsonb,
  low_credit_orgs jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH child_orgs AS (
    SELECT id, name FROM organizations WHERE parent_org_id = _org_id AND type = 'cliente'
    UNION ALL
    SELECT o2.id, o2.name FROM organizations o1
    JOIN organizations o2 ON o2.parent_org_id = o1.id AND o2.type = 'cliente'
    WHERE o1.parent_org_id = _org_id
  ),
  wallets AS (
    SELECT co.id AS org_id, co.name AS org_name, COALESCE(cw.balance, 0) AS balance
    FROM child_orgs co
    LEFT JOIN credit_wallets cw ON cw.organization_id = co.id
  ),
  plan_limits AS (
    SELECT w.org_id, w.org_name, w.balance,
      COALESCE(
        CASE s.plan
          WHEN 'starter' THEN 500
          WHEN 'growth' THEN 1000
          WHEN 'scale' THEN 1500
          ELSE 500
        END, 500
      ) AS plan_credits
    FROM wallets w
    LEFT JOIN subscriptions s ON s.organization_id = w.org_id AND s.status = 'active'
  ),
  zero_orgs AS (
    SELECT jsonb_agg(jsonb_build_object('id', org_id, 'name', org_name, 'balance', balance))
    FROM plan_limits WHERE balance <= 0
  ),
  low_orgs AS (
    SELECT jsonb_agg(jsonb_build_object('id', org_id, 'name', org_name, 'balance', balance, 'percent', round(balance::numeric / NULLIF(plan_credits, 0) * 100)))
    FROM plan_limits WHERE balance > 0 AND (balance::numeric / NULLIF(plan_credits, 0) * 100) < 10
  ),
  ai_24h AS (
    SELECT count(*) AS cnt, COALESCE(sum(tokens_used), 0) AS tkn
    FROM ai_conversation_logs acl
    JOIN child_orgs co ON co.id = acl.organization_id
    WHERE acl.created_at > now() - interval '24 hours'
  ),
  ai_7d AS (
    SELECT count(*) AS cnt, COALESCE(sum(tokens_used), 0) AS tkn
    FROM ai_conversation_logs acl
    JOIN child_orgs co ON co.id = acl.organization_id
    WHERE acl.created_at > now() - interval '7 days'
  )
  SELECT
    (SELECT COALESCE(sum(balance), 0) FROM wallets)::bigint,
    (SELECT count(*) FROM plan_limits WHERE balance <= 0)::bigint,
    (SELECT count(*) FROM plan_limits WHERE balance > 0 AND (balance::numeric / NULLIF(plan_credits, 0) * 100) < 10)::bigint,
    (SELECT cnt FROM ai_24h)::bigint,
    (SELECT cnt FROM ai_7d)::bigint,
    (SELECT tkn FROM ai_24h)::bigint,
    (SELECT tkn FROM ai_7d)::bigint,
    (SELECT COALESCE(jsonb_agg, '[]'::jsonb) FROM zero_orgs),
    (SELECT COALESCE(jsonb_agg, '[]'::jsonb) FROM low_orgs);
$$;
