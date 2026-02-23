DROP POLICY "Admins can manage goals" ON public.goals;
CREATE POLICY "Admins can manage goals"
  ON public.goals FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'cliente_admin')
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'cliente_admin')
  );