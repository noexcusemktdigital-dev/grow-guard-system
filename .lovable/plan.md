

# Testes Completos — Agenda (ClienteAgenda)

## Contexto
A tela `ClienteAgenda` (~495 linhas) oferece visualização Mês/Semana/Dia, criação/edição/exclusão de eventos, e integração com Google Calendar. Usa `calendar_events` no banco via RPC `get_calendar_events_with_parent`.

---

## Problemas Identificados

### 1. Console error: "Function components cannot be given refs"
O `GoogleSetupWizard` é um function component usado como filho direto do render, mas o `Dialog` do Radix tenta passar ref. O warning aparece nos logs.

**Fix**: O `GoogleSetupWizard` já encapsula seu próprio `<Dialog>`, então o problema é menor (cosmético). Porém, vale garantir que o componente use `forwardRef` se necessário, ou simplesmente ignorar pois é o Dialog interno que o gera.

### 2. Sem `staleTime` — flicker ao trocar de view
`useCalendarEvents` não tem `staleTime`, causando refetch e flash de skeleton toda vez que o usuário troca entre Mês/Semana/Dia ou navega.

**Fix**: Adicionar `staleTime: 1000 * 60 * 2` em `useCalendarEvents` e `useCalendars`.

### 3. Delete sem confirmação
Clicar "Excluir" no detail sheet deleta o evento sem qualquer confirmação. Risco de perda acidental.

**Fix**: Adicionar `AlertDialog` antes de deletar (mesmo padrão usado no Checklist).

### 4. Clicar num dia no mês abre "Novo Evento" em vez de navegar pro dia
No month view, ao clicar numa célula de dia, sempre abre o formulário de criação. Não há forma de "entrar" no dia para ver detalhes. Seria mais intuitivo: click = navegar para day view, e o botão "+" cria evento.

**Fix**: Clicar na célula do dia muda para `viewMode="day"` com `setCurrentDate(day)`. Manter o botão "Novo Evento" no header para criação.

### 5. Sem validação de data fim > data início
O formulário permite criar evento com data fim anterior à data início sem avisar.

**Fix**: Validar `endAt > startAt` no `handleSave()`.

### 6. Sem empty state didático
Quando não há eventos, a grade do calendário fica vazia sem nenhum incentivo. Não há mensagem como "Crie seu primeiro evento".

**Fix**: Adicionar um card de empty state quando `events.length === 0` com CTA para criar evento.

### 7. Sem contagem de eventos no header
O usuário não sabe quantos eventos tem no período visível. Falta um mini-KPI.

**Fix**: Adicionar badge com contagem de eventos ao lado do título "Agenda".

### 8. Formulário não limpa ao fechar
Se o usuário abre o form de edição, fecha sem salvar, e depois clica "Novo Evento", os campos ficam preenchidos com dados do evento anterior.

**Fix**: Garantir `openNewEvent()` sempre reseta todos os campos (já faz, mas o `onOpenChange` do Dialog pode fechar sem chamar reset). Adicionar reset no `onOpenChange(false)`.

### 9. "Dia todo" não ajusta os inputs de hora
Quando marca "Dia todo", os campos datetime-local continuam visíveis e editáveis. Deveriam esconder a parte de hora ou trocar para `type="date"`.

**Fix**: Quando `allDay=true`, mostrar inputs `type="date"` em vez de `datetime-local`.

### 10. Eventos no week/day view não calculam altura proporcional corretamente
No `WeekView`, os eventos usam `top` baseado em minutos mas não têm `height`, podendo se sobrepor. No `DayView` tem `minHeight` mas não reflete duração real no grid.

**Fix**: Adicionar `height` calculada proporcional à duração no `WeekView`.

---

## Melhorias

| # | Correção/Melhoria | Impacto |
|---|---|---|
| 1 | `staleTime: 2min` nos hooks | Performance |
| 2 | Confirmação antes de excluir | Segurança dados |
| 3 | Click no dia = navegar para day view | UX intuitiva |
| 4 | Validação fim > início | Bug prevention |
| 5 | Empty state com CTA | Onboarding |
| 6 | Badge contagem de eventos | Informação |
| 7 | Reset form ao fechar dialog | Bug fix |
| 8 | Inputs date quando "Dia todo" | UX |
| 9 | Altura proporcional no WeekView | Visual fix |

## Arquivos a alterar
- `src/pages/cliente/ClienteAgenda.tsx` — itens 2-9
- `src/hooks/useCalendar.ts` — item 1 (staleTime)

