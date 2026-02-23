
-- Add new columns to client_ai_agents
ALTER TABLE public.client_ai_agents
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'sdr',
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS crm_actions jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS whatsapp_instance_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Create storage bucket for agent knowledge files
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-knowledge', 'agent-knowledge', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for agent-knowledge bucket: org members can upload
CREATE POLICY "Org members can upload agent knowledge"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agent-knowledge'
  AND auth.uid() IS NOT NULL
);

-- RLS: org members can read agent knowledge
CREATE POLICY "Org members can read agent knowledge"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'agent-knowledge'
  AND auth.uid() IS NOT NULL
);

-- RLS: org members can delete agent knowledge
CREATE POLICY "Org members can delete agent knowledge"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'agent-knowledge'
  AND auth.uid() IS NOT NULL
);
