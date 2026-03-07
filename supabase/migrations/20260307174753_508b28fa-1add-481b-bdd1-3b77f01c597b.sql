CREATE OR REPLACE FUNCTION public.get_network_client_stats(_org_id uuid)
RETURNS TABLE(
  total_clients bigint,
  active_clients bigint,
  total_leads bigint,
  total_credits bigint,
  total_mrr numeric,
  expiring_soon bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH child_orgs AS (
    SELECT id FROM organizations WHERE parent_org_id = _org_id AND type = 'cliente'
    UNION ALL
    SELECT o2.id FROM organizations o1
    JOIN organizations o2 ON o2.parent_org_id = o1.id AND o2.type = 'cliente'
    WHERE o1.parent_org_id = _org_id
  ),
  client_subs AS (
    SELECT s.* FROM subscriptions s
    JOIN child_orgs co ON co.id = s.organization_id
  ),
  client_wallets AS (
    SELECT cw.* FROM credit_wallets cw
    JOIN child_orgs co ON co.id = cw.organization_id
  ),
  client_leads AS (
    SELECT cl.id FROM crm_leads cl
    JOIN child_orgs co ON co.id = cl.organization_id
  )
  SELECT
    (SELECT count(*) FROM child_orgs)::bigint AS total_clients,
    (SELECT count(*) FROM client_subs WHERE status = 'active')::bigint AS active_clients,
    (SELECT count(*) FROM client_leads)::bigint AS total_leads,
    (SELECT COALESCE(sum(balance), 0) FROM client_wallets)::bigint AS total_credits,
    (SELECT COALESCE(sum(
      CASE WHEN cs.plan = 'starter' THEN 197
           WHEN cs.plan = 'growth' THEN 397
           WHEN cs.plan = 'scale' THEN 697
           ELSE 0 END
    ), 0) FROM client_subs cs WHERE cs.status = 'active') AS total_mrr,
    (SELECT count(*) FROM client_subs WHERE status = 'active' AND expires_at < now() + interval '7 days')::bigint AS expiring_soon;
$function$;