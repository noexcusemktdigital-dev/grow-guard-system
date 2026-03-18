

# Testes Completos — Tarefas (Checklist)

## Contexto
A tela `ClienteChecklist` tem 3 abas: **Hoje** (checklist diário), **Minhas Tarefas** (client_tasks pessoais), **Time** (admin vê todas). Usa dois sistemas de dados distintos: `client_checklist_items` (diário) e `client_tasks` (tarefas gerais).

---

## Bugs e Problemas Identificados

### 1. Checklist diário nunca é gerado automaticamente
A aba "Hoje" depende da edge function `generate-daily-checklist`, mas **nenhuma parte do frontend a chama automaticamente**. O usuário abre a aba e vê "Nenhuma tarefa hoje" sem saber que precisa gerar. Não existe botão "Gerar com IA" na tela.

**Fix**: Adicionar botão "Gerar Checklist IA (5 créditos)" no empty state da aba Hoje. Ao clicar, chamar a edge function e recarregar.

### 2. Sem `staleTime` — flicker ao navegar
Tanto `useClienteChecklist` quanto `useClienteTasks` não têm `staleTime`, causando refetch e flash de skeleton toda vez que o usuário troca de aba ou volta à página.

**Fix**: Adicionar `staleTime: 1000 * 60 * 2` em ambos.

### 3. Tarefa concluída não dá XP (client_tasks)
O `toggleTask` em `useClienteTasks` apenas muda o status para "done", mas **não concede XP** na gamificação. Diferente do checklist diário que dá +10 XP por item. Isso desmotiva o uso da aba "Minhas Tarefas".

**Fix**: Adicionar lógica de +10 XP no `toggleTask` do `useClienteTaskMutations`, similar ao `toggleChecklistItem`.

### 4. Delete sem confirmação
Clicar no ícone de lixeira deleta a tarefa instantaneamente sem pedir confirmação. Fácil de perder dados por acidente.

**Fix**: Adicionar um `confirm()` ou mini-dialog antes de deletar.

### 5. Select "Ninguém (eu)" com `value=""`  — bug no Radix
O `<SelectItem value="">Ninguém (eu)</SelectItem>` com valor vazio causa comportamento inconsistente no Radix Select (valor empty string não é tratado corretamente como seleção válida).

**Fix**: Usar `value="__none__"` e tratar no submit como `undefined`.

### 6. Tarefas concluídas truncadas a 5
Na aba Minhas Tarefas, `done.slice(0, 5)` mostra apenas 5 tarefas concluídas sem indicar que há mais ou oferecer "ver todas".

**Fix**: Adicionar botão "Ver todas (N)" quando há mais de 5 concluídas.

### 7. Sem KPIs/resumo na página
A página não tem nenhum card de resumo (total pendente, atrasadas, concluídas hoje). O dashboard Início tem isso mas a tela dedicada não.

**Fix**: Adicionar uma barra de 3 mini-KPIs no topo: Pendentes, Atrasadas, Concluídas Hoje.

### 8. Sem edição de tarefa existente
Não existe funcionalidade para editar título, descrição, prazo ou prioridade de uma tarefa já criada. O `updateTask` existe no hook mas nunca é usado na UI.

**Fix**: Adicionar click no card da tarefa para abrir dialog de edição (reutilizando o dialog de criação com dados preenchidos).

---

## Melhorias Propostas

| # | Correção/Melhoria | Impacto |
|---|---|---|
| 1 | Botão "Gerar Checklist IA" no empty state | UX crítico |
| 2 | `staleTime: 2min` nos hooks | Performance |
| 3 | +10 XP ao concluir client_task | Gamificação |
| 4 | Confirmação antes de deletar | Segurança dados |
| 5 | Fix SelectItem value="" → "__none__" | Bug fix |
| 6 | "Ver todas" nas concluídas | UX |
| 7 | Mini-KPIs no topo da página | UX |
| 8 | Dialog de edição de tarefa | Funcionalidade |

## Arquivos a alterar
- `src/pages/cliente/ClienteChecklist.tsx` — itens 1, 4, 5, 6, 7, 8
- `src/hooks/useClienteTasks.ts` — itens 2, 3
- `src/hooks/useClienteContent.ts` — item 2

