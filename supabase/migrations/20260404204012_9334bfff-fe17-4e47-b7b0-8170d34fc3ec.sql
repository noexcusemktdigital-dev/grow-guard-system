CREATE TABLE public.client_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  strategy_id uuid NOT NULL REFERENCES franqueado_strategies(id) ON DELETE CASCADE,
  month_ref text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  analise jsonb DEFAULT '{}',
  plano_proximo jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage followups"
  ON public.client_followups FOR ALL TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE UNIQUE INDEX client_followups_strategy_month_idx ON public.client_followups (strategy_id, month_ref);