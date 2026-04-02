-- Drop old restrictive policy and replace with one that works for the welcome flow
-- The old policy required auth.uid() to match email in auth.users, but during
-- the recovery/welcome flow the session may not yet be fully established.
-- New approach: allow authenticated users to update rows matching their own email.
DROP POLICY IF EXISTS "Users can update their own invitation accepted_at" ON public.pending_invitations;

CREATE POLICY "Users can mark their own invitation as accepted"
ON public.pending_invitations
FOR UPDATE
TO authenticated
USING (
  email = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
)
WITH CHECK (
  email = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
);