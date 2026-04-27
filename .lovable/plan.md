## Resumo

Aplicar 3 correções nas automações do CRM: (1) ajustar `move_to_funnel` no edge function, (2) corrigir trigger DB para incluir `funnel_id` em `lead_won`, (3) melhorar feedback visual e botão "Executar agora" na UI.

---

## Correção 1 — `supabase/functions/crm-run-automations/index.ts` (case `move_to_funnel`)

A lógica `transfer`/`duplicate` já existe (linhas 469–530), mas falta um detalhe: trocar o `notes` do lead duplicado por uma mensagem rastreável. **Não vamos** enfileirar `stage_change` manualmente como pediu o snippet, porque isso reintroduziria o loop infinito que corrigimos antes — o trigger DB `enqueue_crm_automation` já dispara `lead_created` no INSERT, e a metadata `duplicated_by_automation_id` impede recursão.

Alteração mínima no bloco duplicate:
- `notes: (lead as any).notes ?? null` → `notes: \`Duplicado automaticamente de: ${lead.name} (automação: ${automation.name})\``

## Correção 2 — Nova migration corrigindo `enqueue_crm_automation`

Criar `supabase/migrations/<timestamp>_fix_lead_won_trigger_data.sql` que faz `CREATE OR REPLACE FUNCTION public.enqueue_crm_automation()` adicionando `funnel_id`, `stage` e `value` ao `trigger_data` do evento `lead_won` (e `funnel_id` no `lead_lost`). A função alvo é a real do banco (`enqueue_crm_automation`, não `enqueue_automation_on_lead_change` como no snippet original).

Mantém todos os outros eventos (`lead_created`, `stage_change`, `lead_lost`, `tag_added`) idênticos, apenas com payload enriquecido onde necessário.

## Correção 3 — `src/components/crm/CrmAutomations.tsx`

### 3a. Badges de status na lista de automações (linhas ~833–843)
Substituir o badge atual "execução" por um conjunto contextual:
- **`execution_count > 0`**: badge verde "✅ Executada {N}x"
- **`last_executed_at`**: badge cinza "🕐 há {tempo relativo}" (usar `date-fns` formatDistanceToNow já disponível no projeto)
- **`is_active && execution_count === 0`**: badge âmbar "⚠️ Aguardando próximo ciclo (5 min)"

### 3b. Botão "▶ Executar agora" no header da lista (linha ~797)
Adicionar ao lado do botão "Nova automação":
```tsx
<Button size="sm" variant="outline" onClick={forceRun} disabled={running}>
  <Play className="w-3.5 h-3.5" /> Executar agora
</Button>
```

Implementar `forceRun` no escopo de `AutomationsListTab` (recebendo `onRefetch` por prop, ou usando `useQueryClient` + invalidate) que invoca `supabase.functions.invoke("crm-run-automations")`, exibe toast de sucesso/erro e revalida queries de automações + logs após 2s.

### 3c. Passar callback de refetch
`AutomationsListTab` já é usado em duas instâncias (IA e Time). Adicionar prop opcional `onForceRun` ou inicializar `useQueryClient()` direto no componente para invalidar `["crm-automations"]` e `["automation-logs"]` após executar.

---

## Arquivos alterados

- `supabase/functions/crm-run-automations/index.ts` — ajuste do `notes` no bloco duplicate
- `supabase/migrations/<timestamp>_fix_lead_won_trigger_data.sql` — nova migration
- `src/components/crm/CrmAutomations.tsx` — badges contextuais + botão "Executar agora"

Sem mudanças em outras telas ou contratos.
