
-- 1. Create finance_closings table
CREATE TABLE public.finance_closings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  title text NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  file_url text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.finance_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org closings" ON public.finance_closings
  FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage closings" ON public.finance_closings
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 2. Add columns to contracts table
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_document text,
  ADD COLUMN IF NOT EXISTS client_phone text,
  ADD COLUMN IF NOT EXISTS client_address text,
  ADD COLUMN IF NOT EXISTS service_description text,
  ADD COLUMN IF NOT EXISTS monthly_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_months integer,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

-- 3. Allow franqueados to insert and update contracts
CREATE POLICY "Members can insert contracts" ON public.contracts
  FOR INSERT WITH CHECK (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update contracts" ON public.contracts
  FOR UPDATE USING (is_member_of_org(auth.uid(), organization_id));

-- 4. Create closing-files storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('closing-files', 'closing-files', true);

CREATE POLICY "Members can view closing files" ON storage.objects
  FOR SELECT USING (bucket_id = 'closing-files');

CREATE POLICY "Admins can upload closing files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'closing-files');
