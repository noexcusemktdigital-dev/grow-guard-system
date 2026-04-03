

## Plano — Implementação: Reformular Tarefas com geração automática CRM

Este plano já foi aprovado. Resumo da implementação:

### 1. Nova Edge Function: `generate-daily-tasks`

Criar `supabase/functions/generate-daily-tasks/index.ts`:
- Adapta a lógica de `generate-daily-checklist` para inserir na tabela `client_tasks` (não `client_checklist_items`)
- Aceita `target_user_id` no body (admin pode gerar para outros)
- Verifica duplicatas: se já existem tarefas `source=system` para o target user no dia, retorna sem gerar
- Coleta contexto CRM (leads parados, tarefas vencidas, propostas, mensagens)
- Chama IA para gerar 5-8 tarefas, insere com `due_date=hoje`, `priority` em inglês (high/medium/low), `source=system`
- Debita 5 créditos
- Registrar em `supabase/config.toml`

### 2. Reescrever `ClienteChecklist.tsx`

Eliminar as 3 abas (Hoje / Minhas Tarefas / Time) e o componente `DailyChecklistTab`.

Layout unificado:
- **Header KPIs**: Pendentes | Atrasadas | Concluídas hoje | Progresso %
- **Botões**: "Gerar Tarefas do Dia" (5 créditos, chama `generate-daily-tasks`) + "Nova Tarefa"
- **Admin**: filtro por membro do time, pode atribuir tarefas a qualquer membro
- **Usuário**: vê apenas suas tarefas
- **Seções**: Atrasadas (vermelho) → Pendentes → Concluídas (colapsável)
- Manter `TaskFormDialog`, toggle, delete, edit, XP award

### 3. Atualizar `useClienteTasks.ts`

Sem mudanças estruturais necessárias — os filtros existentes já suportam o novo layout.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/generate-daily-tasks/index.ts` | Criar |
| `src/pages/cliente/ClienteChecklist.tsx` | Reescrever |
| `supabase/config.toml` | Adicionar função |

