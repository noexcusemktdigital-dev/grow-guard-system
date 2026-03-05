ALTER TABLE public.organization_memberships
ADD CONSTRAINT fk_memberships_profiles
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;