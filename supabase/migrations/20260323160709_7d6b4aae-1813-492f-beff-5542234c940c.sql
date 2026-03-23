
-- Create tables first

-- Team chat channels
CREATE TABLE IF NOT EXISTS public.team_chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'group' CHECK (type IN ('group', 'direct')),
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Team chat members
CREATE TABLE IF NOT EXISTS public.team_chat_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.team_chat_channels(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  last_read_at timestamptz DEFAULT now(),
  UNIQUE (channel_id, user_id)
);

-- Team chat messages
CREATE TABLE IF NOT EXISTS public.team_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.team_chat_channels(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Now create the helper function
CREATE OR REPLACE FUNCTION public.is_team_chat_member(_user_id uuid, _channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_chat_members
    WHERE user_id = _user_id AND channel_id = _channel_id
  )
$$;

-- RLS on channels
ALTER TABLE public.team_chat_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org channels" ON public.team_chat_channels
  FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Admins can create channels" ON public.team_chat_channels
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  );

-- RLS on members
ALTER TABLE public.team_chat_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their memberships" ON public.team_chat_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_team_chat_member(auth.uid(), channel_id));

CREATE POLICY "Admins can add members" ON public.team_chat_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can update own last_read_at" ON public.team_chat_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS on messages
ALTER TABLE public.team_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read channel messages" ON public.team_chat_messages
  FOR SELECT TO authenticated
  USING (public.is_team_chat_member(auth.uid(), channel_id));

CREATE POLICY "Members can send messages" ON public.team_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_team_chat_member(auth.uid(), channel_id)
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_chat_messages;

-- Indexes
CREATE INDEX idx_team_chat_messages_channel ON public.team_chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_team_chat_members_user ON public.team_chat_members(user_id);
CREATE INDEX idx_team_chat_channels_org ON public.team_chat_channels(organization_id);
