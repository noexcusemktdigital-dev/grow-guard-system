-- Corrige RLS de member_permissions para permitir INSERT pelo admin
-- O WITH CHECK não consegue ler organization_id de uma linha que ainda não existe

DROP POLICY IF EXISTS "Org admins can manage member permissions" ON public.member_permissions;

-- Política separada para SELECT (usuário pode ver suas próprias ou admin da org)
CREATE POLICY "Org admins can read and update member permissions"
  ON public.member_permissions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = member_permissions.organization_id
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Org admins can update member permissions"
  ON public.member_permissions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = member_permissions.organization_id
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = member_permissions.organization_id
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Org admins can delete member permissions"
  ON public.member_permissions FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = member_permissions.organization_id
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  );

-- INSERT: verifica usando o organization_id que vem no payload (WITH CHECK)
CREATE POLICY "Org admins can insert member permissions"
  ON public.member_permissions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = organization_id
        AND ur.role IN ('cliente_admin', 'admin', 'super_admin')
    )
  );