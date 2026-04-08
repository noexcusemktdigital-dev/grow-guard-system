

# Correção e Melhoria: Automações e API do CRM

## Problema Principal
A edge function `crm-run-automations` tenta inserir em `automation_execution_logs`, mas essa tabela **não existe**. Os logs de execução (sucesso, erro, skip) são perdidos silenciosamente. As automações executam, mas sem rastreabilidade.

## Plano

### 1. Criar tabela `automation_execution_logs`
Migração SQL para criar a tabela com:
- `id`, `organization_id`, `automation_id`, `event_id`, `lead_id`
- `action_type`, `status` (success/error/skipped), `error_message`
- `metadata` (jsonb), `created_at`
- RLS policy para membros da organização
- Índice em `(organization_id, created_at)`

### 2. Adicionar aba de "Logs de Execução" no painel de Automações
Dentro do componente `CrmAutomations.tsx`, adicionar uma seção/tab que lista os últimos logs de execução das automações com:
- Status (sucesso/erro/skip) com badge colorido
- Nome da automação, nome do lead, data
- Filtro por status e automação
- Permite diagnosticar problemas rapidamente

### 3. Gatilhos `lead_stuck` e `no_contact_sla` (verificação)
Esses dois triggers dependem de um processo periódico que detecte leads parados. Verificar se o cron job faz essa detecção ou se esses gatilhos nunca disparam (as 2 automações com `lead_stuck` têm `execution_count: 0`).

### Detalhes Técnicos
- Tabela: `automation_execution_logs` com FK para `crm_automations`, `crm_automation_queue`, `crm_leads`
- RLS: `SELECT` para membros autenticados da org via `is_member_of_org`
- `INSERT` liberado para service_role (edge function usa service key)
- Componente de logs: query via hook novo `useAutomationLogs`

### Arquivos Modificados
1. **Migração SQL** -- criar `automation_execution_logs`
2. **`src/hooks/useAutomationLogs.ts`** -- novo hook para buscar logs
3. **`src/components/crm/CrmAutomations.tsx`** -- adicionar aba de logs
4. **`supabase/functions/crm-run-automations/index.ts`** -- adicionar detecção de `lead_stuck` / `no_contact_sla` (se ausente)

