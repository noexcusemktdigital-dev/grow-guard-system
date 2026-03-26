ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false;
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;