
-- Tabela de prospecções
CREATE TABLE franqueado_prospections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  lead_id uuid REFERENCES crm_leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}',
  result jsonb DEFAULT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE franqueado_prospections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage prospections"
  ON franqueado_prospections FOR ALL
  USING (is_member_of_org(auth.uid(), organization_id));

-- Tabela de estratégias
CREATE TABLE franqueado_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  lead_id uuid REFERENCES crm_leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  diagnostic_answers jsonb NOT NULL DEFAULT '{}',
  result jsonb DEFAULT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE franqueado_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage strategies"
  ON franqueado_strategies FOR ALL
  USING (is_member_of_org(auth.uid(), organization_id));

-- Catálogo de serviços NOE
CREATE TABLE noe_service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  module text NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'mensal',
  base_price numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'un',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE noe_service_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view catalog"
  ON noe_service_catalog FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage catalog"
  ON noe_service_catalog FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'franqueado'::app_role)
  );
