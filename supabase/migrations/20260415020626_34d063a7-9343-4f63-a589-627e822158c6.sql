
DROP POLICY IF EXISTS "Org admins can manage permission profiles" ON public.permission_profiles;

CREATE POLICY "Org admins can manage permission profiles"
  ON public.permission_profiles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Org admins can manage member permissions" ON public.member_permissions;

CREATE POLICY "Org admins can manage member permissions"
  ON public.member_permissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  );
