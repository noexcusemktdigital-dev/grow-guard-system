
-- Add financial columns to units
ALTER TABLE public.units 
  ADD COLUMN IF NOT EXISTS royalty_percent numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS system_fee numeric DEFAULT 250,
  ADD COLUMN IF NOT EXISTS transfer_percent numeric DEFAULT 20,
  ADD COLUMN IF NOT EXISTS system_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS financial_notes text;

-- Create unit_documents table
CREATE TABLE IF NOT EXISTS public.unit_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'Outros',
  file_url text,
  visibility text DEFAULT 'both',
  notes text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unit_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for unit_documents
CREATE POLICY "Members can view unit docs" ON public.unit_documents
  FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert unit docs" ON public.unit_documents
  FOR INSERT TO authenticated
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can delete unit docs" ON public.unit_documents
  FOR DELETE TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

-- Create storage bucket for unit documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('unit-documents', 'unit-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload unit docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'unit-documents');

CREATE POLICY "Anyone can view unit docs" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'unit-documents');

CREATE POLICY "Authenticated users can delete unit docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'unit-documents');
