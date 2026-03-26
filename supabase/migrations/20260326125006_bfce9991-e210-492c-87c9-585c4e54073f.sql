
-- Lead history table
CREATE TABLE public.crm_lead_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  user_id uuid,
  event_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_lead_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read lead history"
  ON public.crm_lead_history FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "System can insert lead history"
  ON public.crm_lead_history FOR INSERT TO authenticated
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE INDEX idx_crm_lead_history_lead ON public.crm_lead_history(lead_id, created_at DESC);

-- Trigger function
CREATE OR REPLACE FUNCTION public.log_crm_lead_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tag text;
  _new_tags text[];
  _removed_tags text[];
BEGIN
  -- Lead created
  IF TG_OP = 'INSERT' THEN
    INSERT INTO crm_lead_history (lead_id, organization_id, event_type, description, metadata)
    VALUES (NEW.id, NEW.organization_id, 'created', 'Lead criado', jsonb_build_object('source', NEW.source));
    RETURN NEW;
  END IF;

  -- Stage change
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO crm_lead_history (lead_id, organization_id, event_type, description, metadata)
    VALUES (NEW.id, NEW.organization_id, 'stage_change',
      'Movido de "' || COALESCE(OLD.stage, '—') || '" para "' || COALESCE(NEW.stage, '—') || '"',
      jsonb_build_object('old_stage', OLD.stage, 'new_stage', NEW.stage));
  END IF;

  -- Won
  IF NEW.won_at IS NOT NULL AND OLD.won_at IS NULL THEN
    INSERT INTO crm_lead_history (lead_id, organization_id, event_type, description, metadata)
    VALUES (NEW.id, NEW.organization_id, 'won', 'Lead marcado como vendido',
      jsonb_build_object('value', NEW.value));
  END IF;

  -- Lost
  IF NEW.lost_at IS NOT NULL AND OLD.lost_at IS NULL THEN
    INSERT INTO crm_lead_history (lead_id, organization_id, event_type, description, metadata)
    VALUES (NEW.id, NEW.organization_id, 'lost',
      'Lead marcado como perdido' || CASE WHEN NEW.lost_reason IS NOT NULL THEN ' — ' || NEW.lost_reason ELSE '' END,
      jsonb_build_object('reason', NEW.lost_reason));
  END IF;

  -- Tags added
  IF NEW.tags IS DISTINCT FROM OLD.tags THEN
    SELECT array_agg(t) INTO _new_tags FROM unnest(COALESCE(NEW.tags, '{}')) t WHERE NOT (t = ANY(COALESCE(OLD.tags, '{}')));
    SELECT array_agg(t) INTO _removed_tags FROM unnest(COALESCE(OLD.tags, '{}')) t WHERE NOT (t = ANY(COALESCE(NEW.tags, '{}')));
    
    IF _new_tags IS NOT NULL THEN
      FOREACH _tag IN ARRAY _new_tags LOOP
        INSERT INTO crm_lead_history (lead_id, organization_id, event_type, description, metadata)
        VALUES (NEW.id, NEW.organization_id, 'tag_added', 'Tag "' || _tag || '" adicionada', jsonb_build_object('tag', _tag));
      END LOOP;
    END IF;
    
    IF _removed_tags IS NOT NULL THEN
      FOREACH _tag IN ARRAY _removed_tags LOOP
        INSERT INTO crm_lead_history (lead_id, organization_id, event_type, description, metadata)
        VALUES (NEW.id, NEW.organization_id, 'tag_removed', 'Tag "' || _tag || '" removida', jsonb_build_object('tag', _tag));
      END LOOP;
    END IF;
  END IF;

  -- Name changed
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    INSERT INTO crm_lead_history (lead_id, organization_id, event_type, description, metadata)
    VALUES (NEW.id, NEW.organization_id, 'field_updated', 'Nome alterado de "' || COALESCE(OLD.name, '—') || '" para "' || COALESCE(NEW.name, '—') || '"',
      jsonb_build_object('field', 'name'));
  END IF;

  -- Value changed
  IF OLD.value IS DISTINCT FROM NEW.value THEN
    INSERT INTO crm_lead_history (lead_id, organization_id, event_type, description, metadata)
    VALUES (NEW.id, NEW.organization_id, 'field_updated', 'Valor alterado para R$ ' || COALESCE(NEW.value::text, '0'),
      jsonb_build_object('field', 'value', 'old', OLD.value, 'new', NEW.value));
  END IF;

  -- Funnel changed
  IF OLD.funnel_id IS DISTINCT FROM NEW.funnel_id THEN
    INSERT INTO crm_lead_history (lead_id, organization_id, event_type, description, metadata)
    VALUES (NEW.id, NEW.organization_id, 'funnel_change', 'Lead transferido para outro funil',
      jsonb_build_object('old_funnel', OLD.funnel_id, 'new_funnel', NEW.funnel_id));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_crm_lead_history
  AFTER INSERT OR UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.log_crm_lead_history();
