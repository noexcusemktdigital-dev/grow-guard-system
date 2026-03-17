
-- Drop existing restrictive policies on crm_funnels and crm_leads to allow org members
DO $$ BEGIN
  -- Drop existing policies if they exist (safe)
  DROP POLICY IF EXISTS "Admins can manage funnels" ON crm_funnels;
  DROP POLICY IF EXISTS "Members can view funnels" ON crm_funnels;
  DROP POLICY IF EXISTS "Members can manage own org funnels" ON crm_funnels;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Allow all org members to manage funnels
CREATE POLICY "Members can manage own org funnels"
ON crm_funnels FOR ALL
USING (public.is_member_of_org(auth.uid(), organization_id))
WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));
