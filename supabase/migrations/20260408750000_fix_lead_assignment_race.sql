-- API-006: Fix round-robin lead assignment race condition
-- Adds assign_lead_round_robin() with pg_advisory_xact_lock for session-level
-- serialization across concurrent edge function workers.
--
-- The existing get_and_increment_roulette_index() already handles DB-level
-- atomicity via a single UPDATE...RETURNING. This function wraps the full
-- assignment flow (read team members + increment index + update lead) under
-- an advisory lock so two simultaneous crm-run-automations invocations
-- cannot interleave and assign the same lead twice.

CREATE OR REPLACE FUNCTION public.assign_lead_round_robin(
  p_organization_id uuid,
  p_lead_id         uuid,
  p_team_id         uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id    uuid;
  v_lock_key    bigint;
  v_members     uuid[];
  v_member_count integer;
  v_next_index  integer;
BEGIN
  -- Derive a stable 64-bit advisory lock key from org_id
  -- Using the first 16 hex chars of md5(org_id) cast to bit(64)
  v_lock_key := ('x' || substr(md5(p_organization_id::text), 1, 16))::bit(64)::bigint;

  -- Session-scoped advisory lock — released automatically at end of transaction
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Gather active team members
  IF p_team_id IS NOT NULL THEN
    SELECT array_agg(user_id ORDER BY user_id)
    INTO   v_members
    FROM   public.crm_team_members
    WHERE  team_id  = p_team_id
      AND  is_active = true;
  ELSE
    -- Fallback: any active member of the org with a selling role
    SELECT array_agg(user_id ORDER BY user_id)
    INTO   v_members
    FROM   public.organization_memberships
    WHERE  organization_id = p_organization_id
      AND  active = true;
  END IF;

  v_member_count := coalesce(array_length(v_members, 1), 0);

  IF v_member_count = 0 THEN
    RETURN NULL; -- no eligible agents
  END IF;

  -- Atomic increment of round-robin pointer inside crm_settings
  UPDATE public.crm_settings
  SET    roulette_last_index = ((COALESCE(roulette_last_index, -1) + 1) % v_member_count)
  WHERE  organization_id = p_organization_id
  RETURNING roulette_last_index INTO v_next_index;

  IF NOT FOUND THEN
    INSERT INTO public.crm_settings (organization_id, roulette_last_index)
    VALUES (p_organization_id, 0)
    ON CONFLICT (organization_id) DO UPDATE
      SET roulette_last_index = 0
    RETURNING roulette_last_index INTO v_next_index;
  END IF;

  v_agent_id := v_members[COALESCE(v_next_index, 0) + 1]; -- PG arrays are 1-indexed

  -- Assign the lead
  IF v_agent_id IS NOT NULL THEN
    UPDATE public.crm_leads
    SET    assigned_to = v_agent_id,
           updated_at  = now()
    WHERE  id              = p_lead_id
      AND  organization_id = p_organization_id;
  END IF;

  RETURN v_agent_id;
END;
$$;

COMMENT ON FUNCTION public.assign_lead_round_robin(uuid, uuid, uuid) IS
  'API-006: Atomic round-robin lead assignment with pg_advisory_xact_lock to prevent '
  'duplicate assignment when multiple crm-run-automations workers run concurrently. '
  'Returns the assigned agent user_id, or NULL if no eligible agents found.';

GRANT EXECUTE ON FUNCTION public.assign_lead_round_robin(uuid, uuid, uuid)
  TO authenticated, service_role;
