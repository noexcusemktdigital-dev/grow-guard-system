CREATE POLICY "Unit members can view followups"
  ON public.client_followups FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), unit_org_id));