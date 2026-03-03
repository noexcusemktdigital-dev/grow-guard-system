-- BLOCO B: Restrict SELECT on sensitive tables

DROP POLICY IF EXISTS "Members can view finance employees" ON public.finance_employees;
DROP POLICY IF EXISTS "Members can view org employees" ON public.finance_employees;
DROP POLICY IF EXISTS "Admins can manage employees" ON public.finance_employees;

CREATE POLICY "Admins can view finance employees" ON public.finance_employees
  FOR SELECT TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'franqueado')
      OR public.has_role(auth.uid(), 'cliente_admin')
    )
  );

DROP POLICY IF EXISTS "Members can view org instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Admins manage whatsapp instances" ON public.whatsapp_instances;

CREATE POLICY "Admins can view whatsapp instances" ON public.whatsapp_instances
  FOR SELECT TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'franqueado')
      OR public.has_role(auth.uid(), 'cliente_admin')
    )
  );

DROP POLICY IF EXISTS "Members can view org integrations" ON public.organization_integrations;
DROP POLICY IF EXISTS "Members view integrations" ON public.organization_integrations;
DROP POLICY IF EXISTS "Admins can manage org integrations" ON public.organization_integrations;

CREATE POLICY "Admins can view org integrations" ON public.organization_integrations
  FOR SELECT TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'franqueado')
      OR public.has_role(auth.uid(), 'cliente_admin')
    )
  );

-- BLOCO A: RPC for Academy Reports

CREATE OR REPLACE FUNCTION public.get_academy_reports(_org_id uuid)
RETURNS TABLE(
  unit_id uuid,
  unit_name text,
  users_count bigint,
  avg_completion numeric,
  quizzes_passed bigint,
  certificates_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH child_units AS (
    SELECT id, name FROM organizations WHERE parent_org_id = _org_id
  ),
  unit_members AS (
    SELECT cu.id AS unit_id, cu.name AS unit_name, om.user_id
    FROM child_units cu
    JOIN organization_memberships om ON om.organization_id = cu.id
  ),
  all_lessons AS (
    SELECT id FROM academy_lessons WHERE organization_id = _org_id
  ),
  lesson_total AS (
    SELECT count(*) AS total FROM all_lessons
  ),
  user_completion AS (
    SELECT
      um.unit_id,
      um.user_id,
      CASE WHEN lt.total = 0 THEN 0
        ELSE round(count(ap.id)::numeric / lt.total * 100)
      END AS completion
    FROM unit_members um
    CROSS JOIN lesson_total lt
    LEFT JOIN academy_progress ap
      ON ap.user_id = um.user_id
      AND ap.lesson_id IN (SELECT id FROM all_lessons)
      AND ap.completed_at IS NOT NULL
    GROUP BY um.unit_id, um.user_id, lt.total
  ),
  user_quizzes AS (
    SELECT um.unit_id, um.user_id, count(qa.id) AS cnt
    FROM unit_members um
    LEFT JOIN academy_quiz_attempts qa
      ON qa.user_id = um.user_id AND qa.passed = true
    GROUP BY um.unit_id, um.user_id
  ),
  user_certs AS (
    SELECT um.unit_id, um.user_id, count(ac.id) AS cnt
    FROM unit_members um
    LEFT JOIN academy_certificates ac
      ON ac.user_id = um.user_id
    GROUP BY um.unit_id, um.user_id
  )
  SELECT
    cu.id AS unit_id,
    cu.name AS unit_name,
    count(DISTINCT um.user_id) AS users_count,
    coalesce(round(avg(uc.completion)), 0) AS avg_completion,
    coalesce(sum(uq.cnt), 0) AS quizzes_passed,
    coalesce(sum(ucrt.cnt), 0) AS certificates_count
  FROM child_units cu
  LEFT JOIN unit_members um ON um.unit_id = cu.id
  LEFT JOIN user_completion uc ON uc.unit_id = cu.id AND uc.user_id = um.user_id
  LEFT JOIN user_quizzes uq ON uq.unit_id = cu.id AND uq.user_id = um.user_id
  LEFT JOIN user_certs ucrt ON ucrt.unit_id = cu.id AND ucrt.user_id = um.user_id
  GROUP BY cu.id, cu.name
  ORDER BY cu.name;
$$;
