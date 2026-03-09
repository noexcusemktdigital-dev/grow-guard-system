-- Add contact_type column to classify contacts (individual, group, broadcast)
ALTER TABLE whatsapp_contacts 
ADD COLUMN contact_type text DEFAULT 'individual' CHECK (contact_type IN ('individual', 'group', 'broadcast'));

-- Create index for efficient filtering by type
CREATE INDEX idx_whatsapp_contacts_type 
ON whatsapp_contacts(organization_id, contact_type);

-- Add participant_count for groups
ALTER TABLE whatsapp_contacts
ADD COLUMN participant_count integer DEFAULT NULL;

-- Backfill existing contacts as 'individual'
UPDATE whatsapp_contacts 
SET contact_type = 'individual' 
WHERE contact_type IS NULL;