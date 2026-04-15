
-- ═══════════════════════════════════════════════════════════════
-- RECOMPENSAS AUTOMÁTICAS DE CRÉDITOS AO SUBIR DE NÍVEL
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.check_and_grant_level_rewards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _old_level integer;
  _new_level integer;
  _reward_credits integer;
  _level_thresholds integer[] := ARRAY[0, 500, 1500, 3000, 6000, 12000];
  _level_rewards integer[]    := ARRAY[0, 100, 300, 500, 800, 1500];
  i integer;
BEGIN
  _old_level := 1;
  _new_level := 1;

  FOR i IN 1..array_length(_level_thresholds, 1) LOOP
    IF COALESCE(OLD.xp, 0) >= _level_thresholds[i] THEN _old_level := i; END IF;
    IF COALESCE(NEW.xp, 0) >= _level_thresholds[i] THEN _new_level := i; END IF;
  END LOOP;

  IF _new_level > _old_level THEN
    FOR i IN (_old_level + 1).._new_level LOOP
      _reward_credits := _level_rewards[i];

      IF _reward_credits > 0 THEN
        UPDATE public.credit_wallets
        SET balance = balance + _reward_credits
        WHERE organization_id = NEW.organization_id;

        INSERT INTO public.credit_transactions (
          organization_id, type, amount, balance_after,
          description, metadata
        )
        SELECT
          NEW.organization_id,
          'purchase',
          _reward_credits,
          cw.balance,
          'Recompensa de nível ' || i || ' na gamificação (+' || _reward_credits || ' créditos)',
          jsonb_build_object('source', 'level_reward', 'level', i, 'user_id', NEW.user_id)
        FROM public.credit_wallets cw
        WHERE cw.organization_id = NEW.organization_id;

        INSERT INTO public.client_notifications (
          user_id, organization_id, title, message, type, action_url
        ) VALUES (
          NEW.user_id,
          NEW.organization_id,
          '🎉 Você subiu para o Nível ' || i || '!',
          'Parabéns! Você ganhou ' || _reward_credits || ' créditos bônus como recompensa.',
          'GAMIFICATION',
          '/cliente/gamificacao'
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_level_rewards ON client_gamification;
CREATE TRIGGER trg_level_rewards
  AFTER UPDATE ON public.client_gamification
  FOR EACH ROW
  WHEN (OLD.xp IS DISTINCT FROM NEW.xp)
  EXECUTE FUNCTION check_and_grant_level_rewards();
