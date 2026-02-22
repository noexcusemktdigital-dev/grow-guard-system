
-- Create crm_products table
CREATE TABLE public.crm_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'un',
  category text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org products" ON public.crm_products FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage products" ON public.crm_products FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'cliente_admin'::app_role));

CREATE TRIGGER update_crm_products_updated_at BEFORE UPDATE ON public.crm_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create crm_partner_companies table
CREATE TABLE public.crm_partner_companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  document text,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_partner_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org partners" ON public.crm_partner_companies FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can insert partners" ON public.crm_partner_companies FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Members can update partners" ON public.crm_partner_companies FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can delete partners" ON public.crm_partner_companies FOR DELETE USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'cliente_admin'::app_role));

CREATE TRIGGER update_crm_partner_companies_updated_at BEFORE UPDATE ON public.crm_partner_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Alter crm_proposals to add new columns
ALTER TABLE public.crm_proposals ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.crm_proposals ADD COLUMN IF NOT EXISTS partner_company_id uuid REFERENCES public.crm_partner_companies(id) ON DELETE SET NULL;
ALTER TABLE public.crm_proposals ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.crm_proposals ADD COLUMN IF NOT EXISTS valid_until date;
ALTER TABLE public.crm_proposals ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE public.crm_proposals ADD COLUMN IF NOT EXISTS discount_total numeric NOT NULL DEFAULT 0;
