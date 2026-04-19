-- Mapeamento de formulários do Meta Lead Ads para funis do CRM
CREATE TABLE public.meta_leadgen_form_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  page_id text NOT NULL,
  page_name text,
  form_id text, -- NULL = mapeamento padrão (fallback) para a página/org
  form_name text,
  funnel_id uuid REFERENCES public.crm_funnels(id) ON DELETE SET NULL,
  stage text,
  assigned_to uuid, -- responsável padrão (opcional)
  is_default boolean DEFAULT false, -- true = fallback da organização
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (organization_id, page_id, form_id)
);

CREATE INDEX idx_meta_leadgen_mappings_org ON public.meta_leadgen_form_mappings(organization_id);
CREATE INDEX idx_meta_leadgen_mappings_page_form ON public.meta_leadgen_form_mappings(page_id, form_id);

ALTER TABLE public.meta_leadgen_form_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_view_mappings" ON public.meta_leadgen_form_mappings FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "members_insert_mappings" ON public.meta_leadgen_form_mappings FOR INSERT
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "members_update_mappings" ON public.meta_leadgen_form_mappings FOR UPDATE
  USING (public.is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "members_delete_mappings" ON public.meta_leadgen_form_mappings FOR DELETE
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE TRIGGER trg_meta_mappings_updated BEFORE UPDATE ON public.meta_leadgen_form_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Páginas do Facebook assinadas para receber webhooks de leadgen
CREATE TABLE public.meta_leadgen_subscribed_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  page_id text NOT NULL,
  page_name text,
  page_access_token text NOT NULL, -- token da página (necessário para fetch de lead detail)
  subscribed_at timestamptz DEFAULT now(),
  last_lead_at timestamptz,
  active boolean DEFAULT true,
  UNIQUE (organization_id, page_id)
);

CREATE INDEX idx_meta_leadgen_pages_org ON public.meta_leadgen_subscribed_pages(organization_id);
CREATE INDEX idx_meta_leadgen_pages_page_id ON public.meta_leadgen_subscribed_pages(page_id);

ALTER TABLE public.meta_leadgen_subscribed_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_view_pages" ON public.meta_leadgen_subscribed_pages FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "members_insert_pages" ON public.meta_leadgen_subscribed_pages FOR INSERT
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "members_update_pages" ON public.meta_leadgen_subscribed_pages FOR UPDATE
  USING (public.is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "members_delete_pages" ON public.meta_leadgen_subscribed_pages FOR DELETE
  USING (public.is_member_of_org(auth.uid(), organization_id));

-- Log de eventos de leadgen recebidos
CREATE TABLE public.meta_leadgen_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  page_id text NOT NULL,
  form_id text NOT NULL,
  leadgen_id text NOT NULL,
  raw_payload jsonb,
  lead_data jsonb, -- dados do lead após fetch da Graph API
  crm_lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  status text DEFAULT 'pending', -- pending | processed | failed | duplicate
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (leadgen_id)
);

CREATE INDEX idx_meta_leadgen_events_org ON public.meta_leadgen_events(organization_id);
CREATE INDEX idx_meta_leadgen_events_status ON public.meta_leadgen_events(status);

ALTER TABLE public.meta_leadgen_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_view_events" ON public.meta_leadgen_events FOR SELECT
  USING (organization_id IS NULL OR public.is_member_of_org(auth.uid(), organization_id));