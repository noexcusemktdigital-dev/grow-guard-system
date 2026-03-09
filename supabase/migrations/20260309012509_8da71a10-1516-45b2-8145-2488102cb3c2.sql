UPDATE whatsapp_contacts 
SET phone = REPLACE(phone, '@g.us', '') || '-group'
WHERE contact_type = 'group' AND phone LIKE '%@g.us';

UPDATE whatsapp_contacts 
SET phone = REPLACE(phone, '-group-group', '-group')
WHERE phone LIKE '%-group-group%';