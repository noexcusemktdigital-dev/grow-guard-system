-- ============================================================
-- RLS Hardening: Restrict sensitive tables to admin roles
-- ============================================================

-- 1. Replace always-true anon INSERT policies with validation
DROP POLICY IF EXISTS "Anon can insert chat sessions" ON public.website_chat_sessions;
CREATE POLICY "Anon can insert chat sessions"
  ON public.website_chat_sessions FOR INSERT TO public
  WITH CHECK (organization_id IS NOT NULL);

DROP POLICY IF EXISTS "Anon can insert chat messages" ON public.website_chat_messages;
CREATE POLICY "Anon can insert chat messages"
  ON public.website_chat_messages FOR INSERT TO public
  WITH CHECK (organization_id IS NOT NULL AND session_id IS NOT NULL);

-- 2. Restrict finance_employees: only admins can write
DROP POLICY IF EXISTS "Members manage finance employees" ON public.finance_employees;
CREATE POLICY "Members can view finance employees"
  ON public.finance_employees FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Admins manage finance employees"
  ON public.finance_employees FOR INSERT TO authenticated
  WITH CHECK (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Admins update finance employees"
  ON public.finance_employees FOR UPDATE TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  )
  WITH CHECK (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Admins delete finance employees"
  ON public.finance_employees FOR DELETE TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );

-- 3. Restrict organization_integrations to admins for write
DROP POLICY IF EXISTS "Members manage integrations" ON public.organization_integrations;
CREATE POLICY "Members view integrations"
  ON public.organization_integrations FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Admins manage integrations"
  ON public.organization_integrations FOR INSERT TO authenticated
  WITH CHECK (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Admins update integrations"
  ON public.organization_integrations FOR UPDATE TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  )
  WITH CHECK (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Admins delete integrations"
  ON public.organization_integrations FOR DELETE TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );

-- 4. Restrict whatsapp_instances: only admins
DROP POLICY IF EXISTS "Admins manage instances" ON public.whatsapp_instances;
CREATE POLICY "Admins manage whatsapp instances"
  ON public.whatsapp_instances FOR SELECT TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Admins insert whatsapp instances"
  ON public.whatsapp_instances FOR INSERT TO authenticated
  WITH CHECK (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Admins update whatsapp instances"
  ON public.whatsapp_instances FOR UPDATE TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  )
  WITH CHECK (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Admins delete whatsapp instances"
  ON public.whatsapp_instances FOR DELETE TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );

-- 5. Restrict crm_settings to admins for write
DROP POLICY IF EXISTS "Members manage CRM settings" ON public.crm_settings;
CREATE POLICY "Members view CRM settings"
  ON public.crm_settings FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Admins insert CRM settings"
  ON public.crm_settings FOR INSERT TO authenticated
  WITH CHECK (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Admins update CRM settings"
  ON public.crm_settings FOR UPDATE TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  )
  WITH CHECK (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Admins delete CRM settings"
  ON public.crm_settings FOR DELETE TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  );
