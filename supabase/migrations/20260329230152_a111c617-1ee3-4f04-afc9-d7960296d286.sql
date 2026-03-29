
-- Clean duplicate org for micaellamcosta@gmail.com (user_id: 6975761c-e955-495c-8183-f61aca319f20)
-- Remove membership to duplicate org
DELETE FROM organization_memberships 
WHERE user_id = '6975761c-e955-495c-8183-f61aca319f20' 
  AND organization_id = '72cec3bd-2b8d-4e16-9986-6c51b40e6076';

-- Remove duplicate user_role if exists (keep only one)
DELETE FROM user_roles 
WHERE user_id = '6975761c-e955-495c-8183-f61aca319f20' 
  AND id != (
    SELECT id FROM user_roles 
    WHERE user_id = '6975761c-e955-495c-8183-f61aca319f20' 
    ORDER BY created_at ASC LIMIT 1
  );

-- Remove subscription for duplicate org
DELETE FROM subscriptions WHERE organization_id = '72cec3bd-2b8d-4e16-9986-6c51b40e6076';

-- Remove credit wallet for duplicate org
DELETE FROM credit_wallets WHERE organization_id = '72cec3bd-2b8d-4e16-9986-6c51b40e6076';

-- Remove the duplicate organization itself
DELETE FROM organizations WHERE id = '72cec3bd-2b8d-4e16-9986-6c51b40e6076';
