
-- 1. New columns on calendar_events
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id);
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS readonly boolean DEFAULT false;

-- 2. Calendar event invites table
CREATE TABLE IF NOT EXISTS calendar_event_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE calendar_event_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invites" ON calendar_event_invites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Members can manage invites" ON calendar_event_invites FOR ALL USING (
  EXISTS (SELECT 1 FROM calendar_events ce WHERE ce.id = event_id AND is_member_of_org(auth.uid(), ce.organization_id))
);

-- 3. target_unit_ids on announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_unit_ids uuid[] DEFAULT '{}';
