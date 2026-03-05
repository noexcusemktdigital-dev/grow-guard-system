
-- Drop FK constraint on reward_id to allow flexible level-based claims
ALTER TABLE public.gamification_claims DROP CONSTRAINT IF EXISTS gamification_claims_reward_id_fkey;
-- Make reward_id a plain text field for flexibility
ALTER TABLE public.gamification_claims ALTER COLUMN reward_id TYPE text USING reward_id::text;
