
-- Marketing Strategies table (with history support)
CREATE TABLE public.marketing_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  answers JSONB NOT NULL DEFAULT '{}',
  score_percentage INT NOT NULL DEFAULT 0,
  nivel TEXT NOT NULL DEFAULT 'Iniciante',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read strategies"
  ON public.marketing_strategies FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert strategies"
  ON public.marketing_strategies FOR INSERT
  WITH CHECK (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update strategies"
  ON public.marketing_strategies FOR UPDATE
  USING (is_member_of_org(auth.uid(), organization_id));

-- Marketing Visual Identities table
CREATE TABLE public.marketing_visual_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) UNIQUE,
  palette JSONB DEFAULT '[]',
  fonts JSONB DEFAULT '[]',
  style TEXT,
  tone TEXT,
  logo_url TEXT,
  reference_links JSONB DEFAULT '[]',
  image_bank_urls JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketing_visual_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read visual identity"
  ON public.marketing_visual_identities FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert visual identity"
  ON public.marketing_visual_identities FOR INSERT
  WITH CHECK (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update visual identity"
  ON public.marketing_visual_identities FOR UPDATE
  USING (is_member_of_org(auth.uid(), organization_id));
