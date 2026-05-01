-- Salva últimos 3 dias em tabela temporária leve (apenas erros recentes, ~poucos MB)
CREATE TABLE IF NOT EXISTS public.automation_execution_logs_recent AS
SELECT * FROM public.automation_execution_logs 
WHERE created_at >= now() - interval '3 days'
  AND status = 'error'
LIMIT 100000;

-- Renomeia tabela inchada (será dropada depois)
ALTER TABLE public.automation_execution_logs RENAME TO automation_execution_logs_old;

-- Cria tabela nova vazia com mesma estrutura
CREATE TABLE public.automation_execution_logs (LIKE public.automation_execution_logs_old INCLUDING ALL);

-- Restaura constraints/RLS necessárias
ALTER TABLE public.automation_execution_logs ENABLE ROW LEVEL SECURITY;