
CREATE POLICY "Unit members can insert followups"
ON public.client_followups FOR INSERT TO authenticated
WITH CHECK (is_member_of_org(auth.uid(), unit_org_id));

CREATE POLICY "Unit members can update followups"
ON public.client_followups FOR UPDATE TO authenticated
USING (is_member_of_org(auth.uid(), unit_org_id))
WITH CHECK (is_member_of_org(auth.uid(), unit_org_id));
