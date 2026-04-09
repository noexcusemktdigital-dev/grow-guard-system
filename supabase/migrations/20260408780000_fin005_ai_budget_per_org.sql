-- FIN-005: Controle de orçamento mensal de IA por organização
-- Auditoria Sistema Noe — 2026-04-08
-- Adiciona teto de créditos mensais por org + alerta ao atingir threshold
-- Atualiza debit_credits para rastrear consumo mensal e emitir alerta em audit_logs_noe

-- ============================================================
-- 1. Colunas de controle de orçamento em credit_wallets
-- ============================================================
ALTER TABLE public.credit_wallets
  ADD COLUMN IF NOT EXISTS monthly_budget_credits   integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS budget_alert_threshold   integer DEFAULT 80,
  ADD COLUMN IF NOT EXISTS monthly_consumed_credits integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_month             date    DEFAULT date_trunc('month', now())::date,
  ADD COLUMN IF NOT EXISTS budget_alert_sent        boolean DEFAULT false;

COMMENT ON COLUMN public.credit_wallets.monthly_budget_credits IS 'Limite mensal de créditos de IA. NULL = sem limite.';
COMMENT ON COLUMN public.credit_wallets.budget_alert_threshold IS 'Percentual de consumo para acionar alerta (default 80%).';
COMMENT ON COLUMN public.credit_wallets.monthly_consumed_credits IS 'Créditos de IA consumidos no mês atual.';

-- ============================================================
-- 2. debit_credits atualizado — rastreia consumo mensal
-- ============================================================
CREATE OR REPLACE FUNCTION public.debit_credits(
  _org_id uuid, _amount integer, _description text,
  _source text DEFAULT 'ai_usage'::text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _wallet_id          UUID;
  _current_balance    INT;
  _new_balance        INT;
  _budget             INT;
  _threshold          INT;
  _consumed           INT;
  _budget_month       DATE;
  _alert_sent         BOOLEAN;
  _alert_pct          INT;
BEGIN
  SELECT id, balance, monthly_budget_credits, budget_alert_threshold,
         monthly_consumed_credits, budget_month, budget_alert_sent
  INTO _wallet_id, _current_balance, _budget, _threshold,
       _consumed, _budget_month, _alert_sent
  FROM credit_wallets WHERE organization_id = _org_id FOR UPDATE;

  IF _wallet_id IS NULL THEN RAISE EXCEPTION 'WALLET_NOT_FOUND'; END IF;
  IF _current_balance < _amount THEN RAISE EXCEPTION 'INSUFFICIENT_CREDITS'; END IF;

  _new_balance := _current_balance - _amount;

  -- Reset mensal
  IF _budget_month IS NULL OR _budget_month < date_trunc('month', now())::date THEN
    _consumed := 0;
    _budget_month := date_trunc('month', now())::date;
    _alert_sent := false;
  END IF;

  _consumed := _consumed + _amount;

  -- Alerta de orçamento (uma vez por mês)
  IF _budget IS NOT NULL AND NOT _alert_sent THEN
    _alert_pct := (_consumed * 100) / NULLIF(_budget, 0);
    IF _alert_pct >= _threshold THEN
      INSERT INTO public.audit_logs_noe(
        organization_id, resource_type, resource_id, action, new_value, metadata
      ) VALUES (
        _org_id, 'credit_budget', _wallet_id::text, 'budget_alert_threshold_reached',
        _consumed::text,
        jsonb_build_object('budget', _budget, 'consumed', _consumed,
          'threshold_pct', _threshold, 'actual_pct', _alert_pct, 'month', _budget_month)
      );
      _alert_sent := true;
    END IF;
  END IF;

  UPDATE credit_wallets
  SET balance = _new_balance, monthly_consumed_credits = _consumed,
      budget_month = _budget_month, budget_alert_sent = _alert_sent, updated_at = now()
  WHERE id = _wallet_id;

  INSERT INTO credit_transactions (organization_id, type, amount, balance_after, description, metadata)
  VALUES (_org_id, 'consumption', -_amount, _new_balance, _description,
          jsonb_build_object('source', _source, 'monthly_consumed', _consumed));

  RETURN _new_balance;
END;
$$;

-- ============================================================
-- 3. Função helper para setar orçamento da org (admin)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_org_ai_budget(
  _org_id uuid, _monthly_budget integer, _alert_threshold integer DEFAULT 80
)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$
  UPDATE public.credit_wallets
  SET monthly_budget_credits = _monthly_budget,
      budget_alert_threshold = LEAST(GREATEST(_alert_threshold, 1), 100),
      budget_alert_sent = false, updated_at = now()
  WHERE organization_id = _org_id;
$$;

GRANT EXECUTE ON FUNCTION public.set_org_ai_budget TO authenticated;
GRANT EXECUTE ON FUNCTION public.debit_credits TO service_role;
