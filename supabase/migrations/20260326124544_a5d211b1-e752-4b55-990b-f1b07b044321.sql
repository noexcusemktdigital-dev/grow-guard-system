CREATE TABLE public.crm_lead_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.crm_products(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  discount_percent numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id, product_id)
);

ALTER TABLE public.crm_lead_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage lead products"
  ON public.crm_lead_products FOR ALL TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));