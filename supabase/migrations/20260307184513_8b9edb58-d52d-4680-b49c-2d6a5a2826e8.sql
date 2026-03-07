
CREATE OR REPLACE FUNCTION public.increment_referral_uses(_org_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE referral_discounts
  SET uses_count = uses_count + 1
  WHERE organization_id = _org_id;
$$;
