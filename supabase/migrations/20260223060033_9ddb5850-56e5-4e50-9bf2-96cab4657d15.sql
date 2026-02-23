
INSERT INTO storage.buckets (id, name, public) VALUES ('social-arts', 'social-arts', true);

CREATE POLICY "Anyone can view social arts" ON storage.objects FOR SELECT USING (bucket_id = 'social-arts');

CREATE POLICY "Authenticated users can upload social arts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'social-arts' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update social arts" ON storage.objects FOR UPDATE USING (bucket_id = 'social-arts' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete social arts" ON storage.objects FOR DELETE USING (bucket_id = 'social-arts' AND auth.role() = 'authenticated');
