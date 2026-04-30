CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_event text NOT NULL,
  recipient_email text NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'sent',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_campaigns_trigger_event 
ON public.email_campaigns(trigger_event);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_org 
ON public.email_campaigns(organization_id);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email campaigns" 
ON public.email_campaigns FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Service role can insert email campaigns" 
ON public.email_campaigns FOR INSERT TO authenticated
WITH CHECK (true);