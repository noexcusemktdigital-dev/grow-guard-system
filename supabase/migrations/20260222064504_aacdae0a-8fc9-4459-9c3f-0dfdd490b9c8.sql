
-- Create table for AI agents
CREATE TABLE public.client_ai_agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid,
  name text NOT NULL,
  avatar_url text,
  status text NOT NULL DEFAULT 'draft',
  description text,
  persona jsonb NOT NULL DEFAULT '{}',
  knowledge_base jsonb NOT NULL DEFAULT '[]',
  prompt_config jsonb NOT NULL DEFAULT '{}',
  channel text NOT NULL DEFAULT 'whatsapp',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_ai_agents ENABLE ROW LEVEL SECURITY;

-- Members can view org agents
CREATE POLICY "Members can view org agents"
ON public.client_ai_agents
FOR SELECT
USING (is_member_of_org(auth.uid(), organization_id));

-- Members can insert agents
CREATE POLICY "Members can insert agents"
ON public.client_ai_agents
FOR INSERT
WITH CHECK (is_member_of_org(auth.uid(), organization_id));

-- Members can update agents
CREATE POLICY "Members can update agents"
ON public.client_ai_agents
FOR UPDATE
USING (is_member_of_org(auth.uid(), organization_id));

-- Only admins can delete agents
CREATE POLICY "Admins can delete agents"
ON public.client_ai_agents
FOR DELETE
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'cliente_admin'::app_role)
);

-- Trigger for updated_at
CREATE TRIGGER update_client_ai_agents_updated_at
BEFORE UPDATE ON public.client_ai_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
