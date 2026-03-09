-- Normalize group phone formats to @g.us standard
UPDATE whatsapp_contacts 
SET phone = REPLACE(phone, '-group', '@g.us')
WHERE contact_type = 'group' AND phone LIKE '%group';

-- Also normalize any that already have @g.us doubled
UPDATE whatsapp_contacts 
SET phone = REPLACE(phone, '@g.us@g.us', '@g.us')
WHERE phone LIKE '%@g.us@g.us%';