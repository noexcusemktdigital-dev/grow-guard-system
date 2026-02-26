
-- Website chat sessions table
CREATE TABLE public.website_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  whatsapp_contact_id UUID REFERENCES public.whatsapp_contacts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Website chat messages table
CREATE TABLE public.website_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.website_chat_sessions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'inbound',
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.website_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_chat_messages ENABLE ROW LEVEL SECURITY;

-- Sessions: members can view/manage their org sessions
CREATE POLICY "Members can view org chat sessions" ON public.website_chat_sessions
  FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can manage org chat sessions" ON public.website_chat_sessions
  FOR ALL USING (is_member_of_org(auth.uid(), organization_id));

-- Messages: members can view/manage their org messages
CREATE POLICY "Members can view org chat messages" ON public.website_chat_messages
  FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can manage org chat messages" ON public.website_chat_messages
  FOR ALL USING (is_member_of_org(auth.uid(), organization_id));

-- Allow anonymous inserts for widget (validated by api_key in edge function)
CREATE POLICY "Anon can insert chat sessions" ON public.website_chat_sessions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can insert chat messages" ON public.website_chat_messages
  FOR INSERT WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.website_chat_messages;

-- Indexes
CREATE INDEX idx_website_chat_sessions_org ON public.website_chat_sessions(organization_id);
CREATE INDEX idx_website_chat_messages_session ON public.website_chat_messages(session_id);
CREATE INDEX idx_website_chat_messages_org ON public.website_chat_messages(organization_id);
