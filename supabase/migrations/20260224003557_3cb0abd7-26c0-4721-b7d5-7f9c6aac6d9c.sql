
-- Add attachments column to support_tickets (array of URLs)
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}';

-- Add subcategory column to support_tickets
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS subcategory text;

-- Add attachments to support_messages (for images in chat)
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}';

-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: members can upload
CREATE POLICY "Members can upload support files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'support-attachments');
CREATE POLICY "Anyone can view support files" ON storage.objects FOR SELECT USING (bucket_id = 'support-attachments');

-- Enable realtime for support_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
