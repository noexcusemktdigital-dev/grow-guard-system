-- DATA-007: Audit log table for critical operations
CREATE TABLE IF NOT EXISTS public.audit_logs_noe (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid      REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role    text,
  action        text        NOT NULL, -- 'credit_deduct', 'credit_add', 'role_change', 'payment_confirmed', 'payment_failed', 'lead_assign', etc
  resource_type text        NOT NULL, -- 'credit_wallet', 'user_role', 'payment', 'crm_lead'
  resource_id   text,
  old_value     jsonb,
  new_value     jsonb,
  metadata      jsonb       DEFAULT '{}',
  ip_address    inet,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs_noe ENABLE ROW LEVEL SECURITY;

-- Only admins/service_role can read audit logs
CREATE POLICY "Admins can view org audit logs"
  ON public.audit_logs_noe FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR (
      public.is_member_of_org(auth.uid(), organization_id)
      AND EXISTS (
        SELECT 1 FROM public.organization_memberships
        WHERE user_id = auth.uid()
          AND organization_id = audit_logs_noe.organization_id
          AND role IN ('admin', 'super_admin', 'cliente_admin')
      )
    )
  );

-- Service role insert
CREATE POLICY "Service role insert audit logs"
  ON public.audit_logs_noe FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_audit_logs_org_action ON public.audit_logs_noe(organization_id, action, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs_noe(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs_noe(resource_type, resource_id);

-- Trigger on credit_wallets to log all balance changes
CREATE OR REPLACE FUNCTION public.log_credit_wallet_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.balance IS DISTINCT FROM NEW.balance THEN
    INSERT INTO public.audit_logs_noe(organization_id, resource_type, resource_id, action, old_value, new_value)
    VALUES (
      NEW.organization_id,
      'credit_wallet',
      NEW.id::text,
      CASE WHEN NEW.balance > OLD.balance THEN 'credit_add' ELSE 'credit_deduct' END,
      jsonb_build_object('balance', OLD.balance),
      jsonb_build_object('balance', NEW.balance, 'delta', NEW.balance - OLD.balance)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_credit_wallet ON public.credit_wallets;
CREATE TRIGGER trg_audit_credit_wallet
  AFTER UPDATE ON public.credit_wallets
  FOR EACH ROW EXECUTE FUNCTION public.log_credit_wallet_change();
