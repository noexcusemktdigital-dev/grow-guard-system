
CREATE TABLE public.automation_execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES public.crm_automations(id) ON DELETE SET NULL,
  event_id UUID,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  action_type TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view automation logs"
ON public.automation_execution_logs
FOR SELECT
TO authenticated
USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE INDEX idx_automation_execution_logs_org_created
ON public.automation_execution_logs (organization_id, created_at DESC);

CREATE INDEX idx_automation_execution_logs_automation
ON public.automation_execution_logs (automation_id);
