
-- Fila de eventos para processamento de automações
CREATE TABLE public.crm_automation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  lead_id uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  trigger_data jsonb DEFAULT '{}',
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.crm_automation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their org queue"
  ON public.crm_automation_queue FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

-- Index for processing unprocessed events
CREATE INDEX idx_crm_automation_queue_unprocessed 
  ON public.crm_automation_queue (organization_id, processed, created_at)
  WHERE processed = false;

-- Trigger function que detecta eventos no CRM e enfileira
CREATE OR REPLACE FUNCTION public.enqueue_crm_automation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  new_tags text[];
  tag text;
BEGIN
  -- Lead criado
  IF TG_OP = 'INSERT' THEN
    INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
    VALUES (NEW.organization_id, NEW.id, 'lead_created', jsonb_build_object('source', NEW.source, 'stage', NEW.stage, 'funnel_id', NEW.funnel_id));
  END IF;
  
  -- Mudança de etapa
  IF TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
    VALUES (NEW.organization_id, NEW.id, 'stage_change', jsonb_build_object('old_stage', OLD.stage, 'new_stage', NEW.stage, 'funnel_id', NEW.funnel_id));
  END IF;
  
  -- Lead vendido
  IF TG_OP = 'UPDATE' AND NEW.won_at IS NOT NULL AND OLD.won_at IS NULL THEN
    INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
    VALUES (NEW.organization_id, NEW.id, 'lead_won', '{}');
  END IF;
  
  -- Lead perdido
  IF TG_OP = 'UPDATE' AND NEW.lost_at IS NOT NULL AND OLD.lost_at IS NULL THEN
    INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
    VALUES (NEW.organization_id, NEW.id, 'lead_lost', jsonb_build_object('reason', NEW.lost_reason));
  END IF;
  
  -- Tag adicionada
  IF TG_OP = 'UPDATE' AND NEW.tags IS DISTINCT FROM OLD.tags THEN
    SELECT array_agg(t) INTO new_tags FROM unnest(NEW.tags) t WHERE NOT (t = ANY(COALESCE(OLD.tags, '{}')));
    IF new_tags IS NOT NULL THEN
      FOREACH tag IN ARRAY new_tags LOOP
        INSERT INTO crm_automation_queue (organization_id, lead_id, trigger_type, trigger_data)
        VALUES (NEW.organization_id, NEW.id, 'tag_added', jsonb_build_object('tag', tag));
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_crm_lead_automation
  AFTER INSERT OR UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION enqueue_crm_automation();

-- Campos extras na tabela de automações
ALTER TABLE crm_automations ADD COLUMN IF NOT EXISTS execution_count integer DEFAULT 0;
ALTER TABLE crm_automations ADD COLUMN IF NOT EXISTS last_executed_at timestamptz;
ALTER TABLE crm_automations ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES client_ai_agents(id);
