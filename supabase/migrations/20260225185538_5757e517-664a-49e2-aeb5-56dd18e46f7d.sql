
CREATE OR REPLACE FUNCTION public.debit_credits(
  _org_id UUID,
  _amount INT,
  _description TEXT,
  _source TEXT DEFAULT 'ai_usage'
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _wallet_id UUID;
  _current_balance INT;
  _new_balance INT;
BEGIN
  -- Lock the wallet row to prevent race conditions
  SELECT id, balance INTO _wallet_id, _current_balance
  FROM credit_wallets
  WHERE organization_id = _org_id
  FOR UPDATE;

  IF _wallet_id IS NULL THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  IF _current_balance < _amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  _new_balance := _current_balance - _amount;

  UPDATE credit_wallets
  SET balance = _new_balance, updated_at = now()
  WHERE id = _wallet_id;

  INSERT INTO credit_transactions (organization_id, type, amount, balance_after, description, metadata)
  VALUES (_org_id, 'consumption', -_amount, _new_balance, _description, jsonb_build_object('source', _source));

  RETURN _new_balance;
END;
$$;
