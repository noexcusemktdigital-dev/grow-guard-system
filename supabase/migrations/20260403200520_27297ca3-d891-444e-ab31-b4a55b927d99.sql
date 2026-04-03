CREATE OR REPLACE FUNCTION public.get_and_increment_roulette_index(
  _org_id UUID, _member_count INTEGER
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE _next_index INTEGER;
BEGIN
  UPDATE public.crm_settings
  SET roulette_last_index = ((COALESCE(roulette_last_index, -1) + 1) % _member_count)
  WHERE organization_id = _org_id
  RETURNING roulette_last_index INTO _next_index;

  IF NOT FOUND THEN
    INSERT INTO public.crm_settings (organization_id, roulette_last_index)
    VALUES (_org_id, 0)
    ON CONFLICT (organization_id) DO UPDATE SET roulette_last_index = 0
    RETURNING roulette_last_index INTO _next_index;
  END IF;

  RETURN COALESCE(_next_index, 0);
END; $$;

COMMENT ON FUNCTION public.get_and_increment_roulette_index IS 'API-006: Round-robin atômico para atribuição de leads.';