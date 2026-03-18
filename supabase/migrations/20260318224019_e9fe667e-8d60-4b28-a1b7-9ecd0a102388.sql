
CREATE TABLE public.sales_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  answers JSONB DEFAULT '{}',
  score INT DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sales_plan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own org history"
  ON public.sales_plan_history FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Members can insert own org history"
  ON public.sales_plan_history FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
  ));
