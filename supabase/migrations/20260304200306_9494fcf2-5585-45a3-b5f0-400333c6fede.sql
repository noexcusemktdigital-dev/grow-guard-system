CREATE POLICY "Members can update own org"
ON public.organizations
FOR UPDATE
TO authenticated
USING (is_member_of_org(auth.uid(), id))
WITH CHECK (is_member_of_org(auth.uid(), id));