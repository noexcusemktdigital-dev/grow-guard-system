-- ═══════════════════════════════════════════════════════════════
-- CRM: Objetivo do funil, campos customizados, roleta por funil
-- ═══════════════════════════════════════════════════════════════

-- 1. Funil com objetivo e tipo de conversão
ALTER TABLE public.crm_funnels
  ADD COLUMN IF NOT EXISTS goal_type text DEFAULT 'revenue'
    CHECK (goal_type IN ('revenue','leads','appointments','contracts','other')),
  ADD COLUMN IF NOT EXISTS goal_label text DEFAULT 'Venda',
  ADD COLUMN IF NOT EXISTS win_label text DEFAULT 'Ganho',
  ADD COLUMN IF NOT EXISTS loss_label text DEFAULT 'Perdido',
  ADD COLUMN IF NOT EXISTS roulette_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS roulette_stage text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS roulette_members jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_fields_schema jsonb DEFAULT '[]'::jsonb;

-- 2. Meta webhook config por organização
CREATE TABLE IF NOT EXISTS public.crm_meta_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  page_id text,
  page_name text,
  access_token_encrypted text,
  form_ids jsonb DEFAULT '[]'::jsonb,
  default_funnel_id uuid REFERENCES public.crm_funnels(id) ON DELETE SET NULL,
  default_stage text DEFAULT 'novo',
  field_mapping jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE public.crm_meta_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage meta integrations"
  ON public.crm_meta_integrations FOR ALL TO authenticated
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