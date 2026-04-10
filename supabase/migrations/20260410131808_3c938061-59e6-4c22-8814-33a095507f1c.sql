-- Create storage bucket for followup creative images
INSERT INTO storage.buckets (id, name, public) VALUES ('followup-assets', 'followup-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload followup assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'followup-assets');

-- Allow public read
CREATE POLICY "Public can read followup assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'followup-assets');

-- Allow owners to delete their uploads
CREATE POLICY "Users can delete own followup assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'followup-assets');