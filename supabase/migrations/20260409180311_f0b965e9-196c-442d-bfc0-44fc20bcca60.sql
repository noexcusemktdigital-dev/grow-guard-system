
ALTER TABLE public.ad_platform_connections
  DROP CONSTRAINT IF EXISTS ad_platform_connections_status_check;

ALTER TABLE public.ad_platform_connections
  ADD CONSTRAINT ad_platform_connections_status_check
  CHECK (status IN ('active', 'expired', 'disconnected', 'pending'));
