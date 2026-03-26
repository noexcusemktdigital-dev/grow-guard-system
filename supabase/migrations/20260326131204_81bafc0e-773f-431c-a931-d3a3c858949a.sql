
-- Remove duplicate roles keeping the one with highest priority per user_id
DELETE FROM user_roles a USING user_roles b
WHERE a.user_id = b.user_id AND a.id > b.id;

-- Drop old composite constraint and add single-column unique constraint
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE(user_id);
