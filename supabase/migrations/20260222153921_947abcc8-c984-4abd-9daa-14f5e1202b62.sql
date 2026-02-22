
-- 1. whatsapp_instances
CREATE TABLE public.whatsapp_instances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  instance_id text NOT NULL,
  token text NOT NULL,
  client_token text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected',
  phone_number text,
  webhook_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org instances"
  ON public.whatsapp_instances FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Client admins can insert instances"
  ON public.whatsapp_instances FOR INSERT
  WITH CHECK (
    is_member_of_org(auth.uid(), organization_id)
    AND (has_role(auth.uid(), 'cliente_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Client admins can update instances"
  ON public.whatsapp_instances FOR UPDATE
  USING (
    is_member_of_org(auth.uid(), organization_id)
    AND (has_role(auth.uid(), 'cliente_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Client admins can delete instances"
  ON public.whatsapp_instances FOR DELETE
  USING (
    is_member_of_org(auth.uid(), organization_id)
    AND (has_role(auth.uid(), 'cliente_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE TRIGGER update_whatsapp_instances_updated_at
  BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. whatsapp_contacts
CREATE TABLE public.whatsapp_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  phone text NOT NULL,
  name text,
  photo_url text,
  last_message_at timestamptz,
  unread_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, phone)
);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org contacts"
  ON public.whatsapp_contacts FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert contacts"
  ON public.whatsapp_contacts FOR INSERT
  WITH CHECK (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update contacts"
  ON public.whatsapp_contacts FOR UPDATE
  USING (is_member_of_org(auth.uid(), organization_id));

CREATE TRIGGER update_whatsapp_contacts_updated_at
  BEFORE UPDATE ON public.whatsapp_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. whatsapp_messages
CREATE TABLE public.whatsapp_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  message_id_zapi text,
  direction text NOT NULL DEFAULT 'outbound',
  type text NOT NULL DEFAULT 'text',
  content text,
  media_url text,
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org messages"
  ON public.whatsapp_messages FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert messages"
  ON public.whatsapp_messages FOR INSERT
  WITH CHECK (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update messages"
  ON public.whatsapp_messages FOR UPDATE
  USING (is_member_of_org(auth.uid(), organization_id));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_contacts;
