
-- Add attachment_url column to announcements
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS attachment_url text;

-- Create storage bucket for announcement attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcement-attachments', 'announcement-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the bucket
CREATE POLICY "Authenticated users can upload announcement attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'announcement-attachments');

CREATE POLICY "Anyone can view announcement attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'announcement-attachments');

CREATE POLICY "Authenticated users can delete announcement attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'announcement-attachments');
