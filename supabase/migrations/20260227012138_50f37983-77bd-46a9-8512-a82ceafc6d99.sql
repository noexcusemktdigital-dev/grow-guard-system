
-- Function to resolve the content source org (parent if franchisee, self if franchisor)
CREATE OR REPLACE FUNCTION public.get_parent_org_id(_org_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT parent_org_id FROM organizations WHERE id = _org_id AND parent_org_id IS NOT NULL),
    _org_id
  );
$$;

-- Create marketing-assets storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('marketing-assets', 'marketing-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for marketing-assets bucket
CREATE POLICY "Authenticated users can upload marketing assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketing-assets');

CREATE POLICY "Anyone can view marketing assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marketing-assets');

CREATE POLICY "Authenticated users can delete marketing assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'marketing-assets');
