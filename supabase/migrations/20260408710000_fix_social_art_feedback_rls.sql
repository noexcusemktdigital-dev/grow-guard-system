-- Migration: Fix social_art_feedback RLS - remove USING(true) policies
-- DATA-001: "Service role full access" with USING(true) allowed cross-org data access
-- The 20260403 migration fixed new policy names but left original permissive policies in place
-- Safe to run multiple times (idempotent)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'social_art_feedback'
  ) THEN
    -- Drop the original overly-permissive policies from the initial migration
    DROP POLICY IF EXISTS "Service role full access" ON public.social_art_feedback;
    DROP POLICY IF EXISTS "Members can view org feedback" ON public.social_art_feedback;
    DROP POLICY IF EXISTS "Members can insert feedback" ON public.social_art_feedback;

    -- Also drop any other permissive policies that may exist
    DROP POLICY IF EXISTS "Allow all authenticated" ON public.social_art_feedback;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.social_art_feedback;

    -- Ensure correct org-scoped SELECT policy exists (idempotent)
    DROP POLICY IF EXISTS "social_art_feedback_org_select" ON public.social_art_feedback;
    CREATE POLICY "social_art_feedback_org_select"
      ON public.social_art_feedback FOR SELECT TO authenticated
      USING (public.is_member_of_org(auth.uid(), organization_id));

    -- Ensure correct org-scoped INSERT policy exists (idempotent)
    DROP POLICY IF EXISTS "social_art_feedback_org_insert" ON public.social_art_feedback;
    CREATE POLICY "social_art_feedback_org_insert"
      ON public.social_art_feedback FOR INSERT TO authenticated
      WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

    -- Ensure correct org-scoped UPDATE policy exists (idempotent)
    DROP POLICY IF EXISTS "social_art_feedback_org_update" ON public.social_art_feedback;
    CREATE POLICY "social_art_feedback_org_update"
      ON public.social_art_feedback FOR UPDATE TO authenticated
      USING (public.is_member_of_org(auth.uid(), organization_id))
      WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

  END IF;
END $$;
