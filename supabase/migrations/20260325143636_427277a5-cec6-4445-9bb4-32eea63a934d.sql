
-- 1. Enhance team_chat_channels
ALTER TABLE public.team_chat_channels
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.org_teams(id) ON DELETE SET NULL;

-- 2. Enhance team_chat_members: add role
ALTER TABLE public.team_chat_members
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

-- 3. Enhance team_chat_messages: add type, file_url, file_name
ALTER TABLE public.team_chat_messages
  ALTER COLUMN content DROP NOT NULL;

ALTER TABLE public.team_chat_messages
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS file_name text;

-- 4. Create function to auto-sync team channels
CREATE OR REPLACE FUNCTION public.sync_team_chat_channels(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _team RECORD;
  _channel_id uuid;
  _member RECORD;
BEGIN
  FOR _team IN
    SELECT id, name FROM org_teams WHERE organization_id = _org_id
  LOOP
    SELECT id INTO _channel_id
    FROM team_chat_channels
    WHERE organization_id = _org_id AND team_id = _team.id
    LIMIT 1;

    IF _channel_id IS NULL THEN
      INSERT INTO team_chat_channels (organization_id, type, name, team_id)
      VALUES (_org_id, 'group', _team.name, _team.id)
      RETURNING id INTO _channel_id;
    END IF;

    FOR _member IN
      SELECT otm.user_id
      FROM org_team_memberships otm
      WHERE otm.team_id = _team.id
    LOOP
      INSERT INTO team_chat_members (channel_id, user_id, role)
      VALUES (_channel_id, _member.user_id, 'member')
      ON CONFLICT (channel_id, user_id) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;
