-- Limpar eventos pendentes acumulados na fila pela lógica antiga
-- (que entrava em loop por enfileirar manualmente stage_change após move_to_funnel)
UPDATE public.crm_automation_queue
SET processed = true,
    last_error = 'cleared after move_to_funnel logic fix'
WHERE processed = false
  AND trigger_type IN ('stage_change', 'lead_won');