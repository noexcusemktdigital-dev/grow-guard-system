ALTER TABLE organizations ALTER COLUMN onboarding_completed SET DEFAULT false;
UPDATE organizations SET onboarding_completed = false WHERE onboarding_completed IS NULL AND type = 'cliente';