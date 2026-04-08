
-- 1. Add reply_to_id column to team_chat_messages
ALTER TABLE public.team_chat_messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.team_chat_messages(id) ON DELETE SET NULL;

-- 2. Create team_chat_reactions table
CREATE TABLE public.team_chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.team_chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

-- 3. Enable RLS
ALTER TABLE public.team_chat_reactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies: members of the channel can read/insert/delete reactions
CREATE POLICY "Channel members can read reactions"
  ON public.team_chat_reactions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_chat_messages m
      JOIN public.team_chat_members mem ON mem.channel_id = m.channel_id
      WHERE m.id = team_chat_reactions.message_id AND mem.user_id = auth.uid()
    )
  );

CREATE POLICY "Channel members can add reactions"
  ON public.team_chat_reactions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.team_chat_messages m
      JOIN public.team_chat_members mem ON mem.channel_id = m.channel_id
      WHERE m.id = team_chat_reactions.message_id AND mem.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own reactions"
  ON public.team_chat_reactions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 5. Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_chat_reactions;

-- 6. Index for performance
CREATE INDEX idx_team_chat_reactions_message_id ON public.team_chat_reactions(message_id);
CREATE INDEX idx_team_chat_messages_reply_to_id ON public.team_chat_messages(reply_to_id);
