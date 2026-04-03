-- DATA-007: Audit logs para operações críticas (pagamentos, roles, créditos)

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  table_name      TEXT        NOT NULL,
  operation       TEXT        NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id       UUID,
  organization_id UUID,
  user_id         UUID,
  old_data        JSONB,
  new_data        JSONB,
  changed_fields  TEXT[]
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_org"
  ON public.audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record  ON public.audit_logs (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created   ON public.audit_logs (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created  ON public.audit_logs (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _record_id       UUID;
  _organization_id UUID;
  _changed_fields  TEXT[];
  _old             JSONB;
  _new             JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _old := to_jsonb(OLD);
    _record_id       := (OLD).id;
    _organization_id := COALESCE((OLD).organization_id, NULL);
  ELSE
    _new := to_jsonb(NEW);
    _record_id       := (NEW).id;
    _organization_id := COALESCE((NEW).organization_id, NULL);
  END IF;

  IF TG_OP = 'UPDATE' THEN
    _old := to_jsonb(OLD);
    SELECT array_agg(key)
    INTO _changed_fields
    FROM jsonb_each(_new) AS n(key, val)
    WHERE n.val IS DISTINCT FROM (_old ->> key)::jsonb;
  END IF;

  INSERT INTO public.audit_logs
    (table_name, operation, record_id, organization_id, user_id, old_data, new_data, changed_fields)
  VALUES
    (TG_TABLE_NAME, TG_OP, _record_id, _organization_id, auth.uid(), _old, _new, _changed_fields);

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_user_roles ON public.user_roles;
CREATE TRIGGER trg_audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_credit_wallets ON public.credit_wallets;
CREATE TRIGGER trg_audit_credit_wallets
  AFTER INSERT OR UPDATE ON public.credit_wallets
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_credit_transactions ON public.credit_transactions;
CREATE TRIGGER trg_audit_credit_transactions
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_subscriptions ON public.subscriptions;
CREATE TRIGGER trg_audit_subscriptions
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

COMMENT ON TABLE public.audit_logs IS
  'DATA-007: Trilha de auditoria imutável para operações críticas. Gravada via triggers AFTER; nenhum usuário pode alterar ou excluir registros.';