CREATE OR REPLACE FUNCTION public.enqueue_crm_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_tags text[];
  tag text;
BEGIN
  -- Lead criado
  IF TG_OP = 'INSERT' THEN
    INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
    VALUES (NEW.organization_id, NEW.id, 'lead_created',
      jsonb_build_object('source', NEW.source, 'stage', NEW.stage, 'funnel_id', NEW.funnel_id));
  END IF;

  -- Mudança de etapa
  IF TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
    VALUES (NEW.organization_id, NEW.id, 'stage_change',
      jsonb_build_object('old_stage', OLD.stage, 'new_stage', NEW.stage, 'funnel_id', NEW.funnel_id));
  END IF;

  -- Lead vendido (CORRIGIDO: inclui funnel_id, stage e value)
  IF TG_OP = 'UPDATE' AND NEW.won_at IS NOT NULL AND OLD.won_at IS NULL THEN
    INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
    VALUES (NEW.organization_id, NEW.id, 'lead_won',
      jsonb_build_object('funnel_id', NEW.funnel_id, 'stage', NEW.stage, 'value', NEW.value));
  END IF;

  -- Lead perdido (CORRIGIDO: inclui funnel_id)
  IF TG_OP = 'UPDATE' AND NEW.lost_at IS NOT NULL AND OLD.lost_at IS NULL THEN
    INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
    VALUES (NEW.organization_id, NEW.id, 'lead_lost',
      jsonb_build_object('reason', NEW.lost_reason, 'funnel_id', NEW.funnel_id));
  END IF;

  -- Tag adicionada
  IF TG_OP = 'UPDATE' AND NEW.tags IS DISTINCT FROM OLD.tags THEN
    SELECT array_agg(t) INTO new_tags FROM unnest(NEW.tags) t WHERE NOT (t = ANY(COALESCE(OLD.tags, '{}')));
    IF new_tags IS NOT NULL THEN
      FOREACH tag IN ARRAY new_tags LOOP
        INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
        VALUES (NEW.organization_id, NEW.id, 'tag_added', jsonb_build_object('tag', tag, 'funnel_id', NEW.funnel_id));
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;