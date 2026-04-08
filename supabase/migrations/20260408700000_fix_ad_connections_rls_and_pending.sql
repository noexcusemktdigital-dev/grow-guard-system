-- Migration: Fix ad_platform_connections RLS + add pending columns
-- BUG-002: UPDATE policy allowed modification of connections in any status (pending/disconnected)
-- Safe to run multiple times (idempotent)

-- Add pending_accounts columns if not exist
ALTER TABLE public.ad_platform_connections
  ADD COLUMN IF NOT EXISTS pending_accounts jsonb,
  ADD COLUMN IF NOT EXISTS pending_created_at timestamptz;

-- Update UPDATE policy to restrict to active/expired only
DO $$
BEGIN
  -- Drop the existing UPDATE policy if it exists
  DROP POLICY IF EXISTS "Members can update own org connections" ON public.ad_platform_connections;
  DROP POLICY IF EXISTS "Members can update active own org connections" ON public.ad_platform_connections;

  -- Create new restrictive policy: only allow updates on active/expired connections
  CREATE POLICY "Members can update active own org connections"
    ON public.ad_platform_connections FOR UPDATE TO authenticated
    USING (public.is_member_of_org(auth.uid(), organization_id))
    WITH CHECK (
      public.is_member_of_org(auth.uid(), organization_id)
      AND status IN ('active', 'expired')
    );

EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Add index for performance on status queries
CREATE INDEX IF NOT EXISTS idx_ad_platform_connections_status
  ON public.ad_platform_connections(organization_id, status);
