
-- Create org_teams table
CREATE TABLE public.org_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, slug)
);

ALTER TABLE public.org_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org teams"
  ON public.org_teams FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage org teams"
  ON public.org_teams FOR ALL TO authenticated
  USING (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  )
  WITH CHECK (
    public.is_member_of_org(auth.uid(), organization_id)
    AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  );

-- Create org_team_memberships table
CREATE TABLE public.org_team_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.org_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.org_team_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view team memberships"
  ON public.org_team_memberships FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_teams t
      WHERE t.id = team_id
      AND public.is_member_of_org(auth.uid(), t.organization_id)
    )
  );

CREATE POLICY "Admins can manage team memberships"
  ON public.org_team_memberships FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_teams t
      WHERE t.id = team_id
      AND public.is_member_of_org(auth.uid(), t.organization_id)
      AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_teams t
      WHERE t.id = team_id
      AND public.is_member_of_org(auth.uid(), t.organization_id)
      AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Function to seed default teams for an organization
CREATE OR REPLACE FUNCTION public.seed_default_teams(_org_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  INSERT INTO public.org_teams (organization_id, name, slug) VALUES
    (_org_id, 'Vendas', 'vendas'),
    (_org_id, 'Marketing', 'marketing'),
    (_org_id, 'Suporte', 'suporte'),
    (_org_id, 'Jurídico', 'juridico'),
    (_org_id, 'Operações', 'operacoes'),
    (_org_id, 'Financeiro', 'financeiro')
  ON CONFLICT (organization_id, slug) DO NOTHING;
$$;
