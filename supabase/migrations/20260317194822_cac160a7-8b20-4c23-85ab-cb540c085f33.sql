CREATE POLICY "Admins can view all candidates"
ON public.franchise_candidates FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);