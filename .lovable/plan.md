# Correção das automações "Mover/Duplicar para outro funil"

## Diagnóstico

Investiguei o código (`supabase/functions/crm-run-automations/index.ts` + `src/components/crm/CrmAutomations.tsx`) e os logs em `automation_execution_logs` / `crm_automation_queue`. Encontrei 4 problemas reais:

### 1. `move_mode: "duplicate"` é ignorado pelo backend
A UI deixa o usuário escolher entre **Transferir** e **Duplicar**, e salva `action_config.move_mode` no banco. Confirmei nos logs que suas duas automações têm `move_mode: "duplicate"`. Porém o edge function (case `move_to_funnel`, linhas 454–480) **sempre faz `UPDATE` no lead** — nunca cria cópia. Por isso "duplicar" simplesmente transfere.

### 2. Filtro de etapa não aplica (`specific_stage` ignorado)
A automação "manda para outro funil" tem `trigger_config: { specific_stage: "qualificacao" }`, mas a função `matchesTriggerConfig` só lê a chave `stage`. Resultado: a automação dispara em **toda** mudança de etapa do funil, não só em "qualificação".

### 3. Loop de execuções (causa da lentidão)
Após mover/duplicar, o backend enfileira um novo evento `stage_change` no funil destino. Se houver qualquer automação no funil destino (ou a mesma automação reagir de novo), gera reprocessamento. Os logs mostram a mesma automação "manda para outro funil" executando 4× no mesmo minuto para o mesmo lead. A fila vive com pendentes (7 agora) e o budget de 12s da função estoura.

### 4. Ausência de proteção anti-recursão
Não há checagem para evitar que um lead duplicado/transferido dispare a mesma automação em cascata.

---

## O que vou alterar

### A. `supabase/functions/crm-run-automations/index.ts`

**case `move_to_funnel`** — passar a respeitar `move_mode`:

- **`move_mode === "duplicate"`** (padrão para "ganho vai para outro funil"):
  - Buscar o lead completo, fazer `INSERT` de uma cópia em `crm_leads` com:
    - `funnel_id = target_funnel_id`, `stage = target_stage` (ou primeira etapa do funil destino se vazio)
    - Resetar `won_at`, `lost_at`, `lost_reason` (a cópia entra "ativa" no novo funil)
    - Copiar `name`, `phone`, `email`, `value`, `source`, `assigned_to`, `tags`, `notes`, `organization_id`
    - Adicionar `metadata.duplicated_from_lead_id` e `metadata.duplicated_by_automation_id` para rastreio e anti-loop
  - **Não** atualizar o lead original (ele permanece como está).
- **`move_mode === "transfer"`** (ou ausente, fallback): manter UPDATE atual.
- **Em ambos os casos**: parar de enfileirar manualmente um novo `stage_change` no destino. O trigger `enqueue_crm_automation` já cuida disso quando há INSERT/UPDATE real, e fazê-lo manualmente está alimentando o loop.

**Anti-recursão**:
- Antes de executar a ação, ler `lead.metadata?.duplicated_by_automation_id`. Se for igual a `automation.id`, pular execução e logar status `skipped` com `reason: "anti_recursion"`.

### B. `matchesTriggerConfig` (mesma função)

Aceitar **ambas** as chaves de filtro de etapa:
```ts
const cfgStage = config.stage ?? config.specific_stage;
if (cfgStage && triggerData?.new_stage && cfgStage !== triggerData.new_stage) return false;
```
Mesmo tratamento para `funnel_id` (já cobre seu caso, mas a UI usa `selectedFunnels`/`funnel_id` — vou aceitar `funnels` array também: se existir e não vazio, exigir `funnel_id ∈ funnels`).

### C. Limpar fila travada (uma vez)

Marcar como processados os eventos pendentes acumulados pela versão antiga (não vão mais ser válidos com a nova lógica). Migration simples:
```sql
UPDATE crm_automation_queue
SET processed = true, last_error = 'cleared after move_to_funnel logic fix'
WHERE processed = false AND trigger_type IN ('stage_change','lead_won');
```

### D. UI (`src/components/crm/CrmAutomations.tsx`) — pequeno ajuste

- Garantir que ao salvar uma automação com `action_type === "move_to_funnel"` e `move_mode` indefinido, default seja `"transfer"` (já é o visual default; só persistir explicitamente para evitar ambiguidade no backend).
- Sem mudança visual.

---

## Resultado esperado

- **"Lead vendido → duplica para outro funil"**: cria uma cópia no funil destino na primeira etapa; o lead original permanece marcado como ganho no funil de origem.
- **"Mudança para etapa Qualificação → duplica para funil X"**: só dispara quando a etapa nova é exatamente `qualificacao`; cria cópia sem mexer no original.
- Sem loop de execuções → fila zera rápido, automações respondem em ≤ 2 min (próximo tick do cron) em vez de demorar/empilhar.

## Arquivos a editar

- `supabase/functions/crm-run-automations/index.ts` (lógica do case + matcher + anti-recursão)
- `src/components/crm/CrmAutomations.tsx` (default `move_mode: "transfer"` no save)
- 1 migration SQL para limpar fila pendente

Sem mudanças de schema — `crm_leads.metadata` já é JSONB.
