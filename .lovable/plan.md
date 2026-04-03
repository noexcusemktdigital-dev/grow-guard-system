

## Plano — Simplificar ferramenta de Tarefas (sem IA, sem progresso)

### Mudanças

O objetivo é remover a geração por IA e o KPI de progresso. Tarefas são adicionadas automaticamente pelo CRM (já existem triggers que fazem isso) ou manualmente. Se não houver tarefas pendentes, exibe mensagem "Nenhuma tarefa pendente no momento".

### Alterações em `ClienteChecklist.tsx`

1. **Remover KPI de Progresso**: Eliminar o 4º card ("Progresso %") e a variável `progressPct`. Manter apenas 3 KPIs: Pendentes, Atrasadas, Concluídas hoje.

2. **Remover botão "Gerar Tarefas IA"**: Eliminar o botão com `Wand2`, a função `handleGenerate`, o state `generating`, e a importação do `supabase` para invoke. Manter apenas "Nova Tarefa".

3. **Remover referência a IA no empty state**: Trocar os dois botões por apenas "Nova Tarefa" e mensagem "Nenhuma tarefa pendente no momento. Novas demandas do CRM aparecerão aqui automaticamente."

4. **Remover sourceConfig "IA"**: Alterar `system` de "IA" para "CRM" (tarefas vindas do CRM).

5. **Remover imports não utilizados**: `Wand2`, `Sparkles` (se não usado), `Flame`.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClienteChecklist.tsx` | Simplificar conforme acima |

### O que NÃO muda

- `TaskFormDialog` continua igual (admin pode atribuir a outros)
- `TaskCard` continua igual
- Filtros de prioridade e membro (admin) continuam
- Seções Atrasadas/Pendentes/Concluídas continuam
- Gamificação (+10 XP) continua
- Edge function `generate-daily-tasks` permanece disponível mas não é chamada pela UI

