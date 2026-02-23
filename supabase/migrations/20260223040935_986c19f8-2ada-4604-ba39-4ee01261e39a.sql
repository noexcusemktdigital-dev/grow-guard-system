
-- Add new columns to client_dispatches
ALTER TABLE public.client_dispatches
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS max_per_day integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS delay_seconds integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'manual';

-- Create dispatch-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispatch-media', 'dispatch-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to dispatch-media
CREATE POLICY "Authenticated users can upload dispatch media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dispatch-media' AND auth.role() = 'authenticated');

-- Allow public read access to dispatch-media
CREATE POLICY "Public can read dispatch media"
ON storage.objects FOR SELECT
USING (bucket_id = 'dispatch-media');

-- Allow authenticated users to delete own dispatch media
CREATE POLICY "Authenticated users can delete dispatch media"
ON storage.objects FOR DELETE
USING (bucket_id = 'dispatch-media' AND auth.role() = 'authenticated');
