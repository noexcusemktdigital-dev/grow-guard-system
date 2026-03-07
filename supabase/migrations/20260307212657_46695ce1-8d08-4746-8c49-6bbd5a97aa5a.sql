
-- Allow franchisees to view their own unit via unit_org_id
CREATE POLICY "Franchisee can view own unit"
ON public.units
FOR SELECT
TO authenticated
USING (is_member_of_org(auth.uid(), unit_org_id));

-- Add missing column referenced in code
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS saas_commission_percent numeric DEFAULT 0;
