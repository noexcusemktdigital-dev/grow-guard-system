
CREATE POLICY "Users can update their own invitation accepted_at"
ON public.pending_invitations
FOR UPDATE
TO authenticated
USING (
  email = (SELECT lower(email) FROM auth.users WHERE id = auth.uid())
)
WITH CHECK (
  email = (SELECT lower(email) FROM auth.users WHERE id = auth.uid())
);
