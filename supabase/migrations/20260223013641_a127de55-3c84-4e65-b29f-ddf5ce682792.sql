
-- Bug 1: Allow creators to delete their own agents
DROP POLICY IF EXISTS "Admins can delete agents" ON public.client_ai_agents;
CREATE POLICY "Members can delete own agents"
ON public.client_ai_agents
FOR DELETE
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'cliente_admin'::app_role)
  OR (is_member_of_org(auth.uid(), organization_id) AND created_by = auth.uid())
);

-- Bug 2: Make agent-knowledge bucket public for avatar display
UPDATE storage.buckets SET public = true WHERE id = 'agent-knowledge';
