-- support_messages: INSERT
DROP POLICY IF EXISTS "Ticket members can send messages" ON support_messages;
CREATE POLICY "Ticket members can send messages" ON support_messages
  FOR INSERT TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND is_member_or_parent_of_org(auth.uid(), t.organization_id)
    )
  );

-- support_messages: SELECT
DROP POLICY IF EXISTS "Ticket members can view messages" ON support_messages;
CREATE POLICY "Ticket members can view messages" ON support_messages
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND is_member_or_parent_of_org(auth.uid(), t.organization_id)
    )
  );

-- support_tickets: UPDATE
DROP POLICY IF EXISTS "Members can update tickets" ON support_tickets;
CREATE POLICY "Members can update tickets" ON support_tickets
  FOR UPDATE TO public
  USING (is_member_or_parent_of_org(auth.uid(), organization_id));

-- support_tickets: SELECT
DROP POLICY IF EXISTS "Members can view org tickets" ON support_tickets;
CREATE POLICY "Members can view org tickets" ON support_tickets
  FOR SELECT TO public
  USING (is_member_or_parent_of_org(auth.uid(), organization_id));