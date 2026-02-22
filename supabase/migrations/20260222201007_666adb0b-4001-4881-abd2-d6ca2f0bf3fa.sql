
-- Add columns to whatsapp_contacts
ALTER TABLE public.whatsapp_contacts
  ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.client_ai_agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attending_mode text NOT NULL DEFAULT 'ai',
  ADD COLUMN IF NOT EXISTS crm_lead_id uuid;

-- Add column to crm_leads
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS whatsapp_contact_id uuid;

-- Create ai_conversation_logs table
CREATE TABLE IF NOT EXISTS public.ai_conversation_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  contact_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.client_ai_agents(id),
  input_message text,
  output_message text,
  tokens_used integer DEFAULT 0,
  model text DEFAULT 'google/gemini-3-flash-preview',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversation_logs ENABLE ROW LEVEL SECURITY;

-- RLS: members can view org logs
CREATE POLICY "Members can view org ai logs"
  ON public.ai_conversation_logs
  FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));

-- RLS: service role inserts (no user insert needed)
CREATE POLICY "Service can insert ai logs"
  ON public.ai_conversation_logs
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime for ai_conversation_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_conversation_logs;
