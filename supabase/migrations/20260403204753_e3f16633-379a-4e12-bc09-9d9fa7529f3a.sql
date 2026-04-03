
-- =============================================
-- Support Access Tokens + Logs + RLS + Expiry
-- =============================================

-- 1. Support access tokens table
CREATE TABLE public.support_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  access_level TEXT NOT NULL DEFAULT 'read_only' CHECK (access_level IN ('read_only', 'full')),
  ip_created TEXT,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Support access logs table (immutable audit)
CREATE TABLE public.support_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES public.support_access_tokens(id) ON DELETE SET NULL,
  support_user_id UUID,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS on support_access_tokens
ALTER TABLE public.support_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own org tokens"
  ON public.support_access_tokens FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can update own org tokens"
  ON public.support_access_tokens FOR UPDATE TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can insert own org tokens"
  ON public.support_access_tokens FOR INSERT TO authenticated
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

-- 4. RLS on support_access_logs
ALTER TABLE public.support_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own org logs"
  ON public.support_access_logs FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

-- Insert via security definer function only (no direct insert policy for users)

-- 5. Security definer function to insert audit logs
CREATE OR REPLACE FUNCTION public.insert_support_access_log(
  _token_id UUID,
  _support_user_id UUID,
  _organization_id UUID,
  _action TEXT,
  _metadata JSONB DEFAULT '{}',
  _ip_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO support_access_logs (token_id, support_user_id, organization_id, action, metadata, ip_address)
  VALUES (_token_id, _support_user_id, _organization_id, _action, _metadata, _ip_address)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- 6. Expiration function (called by cron)
CREATE OR REPLACE FUNCTION public.expire_support_access_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _count INTEGER;
BEGIN
  UPDATE support_access_tokens
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- Indexes
CREATE INDEX idx_support_tokens_org ON public.support_access_tokens(organization_id);
CREATE INDEX idx_support_tokens_hash ON public.support_access_tokens(token_hash);
CREATE INDEX idx_support_tokens_active ON public.support_access_tokens(is_active, expires_at) WHERE is_active = true;
CREATE INDEX idx_support_logs_org ON public.support_access_logs(organization_id);
CREATE INDEX idx_support_logs_token ON public.support_access_logs(token_id);
