
-- Allow authenticated users to insert notifications for themselves
CREATE POLICY "Users can insert own notifications"
  ON public.client_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
