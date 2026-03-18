INSERT INTO storage.buckets (id, name, public) VALUES ('crm-files', 'crm-files', true);

CREATE POLICY "Allow authenticated uploads to crm-files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'crm-files');
CREATE POLICY "Allow authenticated reads from crm-files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'crm-files');
CREATE POLICY "Allow authenticated deletes from crm-files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'crm-files');