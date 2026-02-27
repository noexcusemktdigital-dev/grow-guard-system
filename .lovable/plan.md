

## Plano: Agenda Franqueadora, Usuarios em Unidades e Implantacao

### 1. Agenda da Franqueadora — Views Semana, Mes e Dia

A agenda da franqueadora (`src/pages/Agenda.tsx`) atualmente so tem view de Mes. O franqueado (`FranqueadoAgenda.tsx`) ja tem as 3 views implementadas (Month, Week, Day) com componentes `WeekView` e `DayView`.

Alteracoes em `src/pages/Agenda.tsx`:
- Adicionar state `viewMode` ("month" | "week" | "day")
- Adicionar toggle de views no header (botoes Mes/Semana/Dia)
- Copiar os componentes `WeekView` e `DayView` do `FranqueadoAgenda.tsx` (mesma logica de slots de hora 7h-22h)
- Ajustar calculo de `startDate/endDate` para variar conforme `viewMode`
- Adicionar funcoes `navigatePrev/navigateNext` com logica por view (subMonths/addMonths, subWeeks/addWeeks, subDays/addDays)
- Manter todas as features existentes: sidebar de calendarios, Google Calendar, formulario de evento, visibilidade por unidade

---

### 2. Unidades — Criar usuarios pela franqueadora

Atualmente `UnidadeUsuariosReal.tsx` so lista membros. Nao tem botao para convidar/criar usuarios.

Alteracoes em `src/components/unidades/UnidadeUsuariosReal.tsx`:
- Adicionar botao "Convidar Membro" no topo da tabela
- Abrir Dialog com campos: Nome, Email, Role (franqueado/cliente_admin/cliente_user)
- Ao confirmar, chamar a edge function `invite-user` passando `organization_id` = `unitOrgId`, `role` e dados do usuario
- Exibir senha temporaria retornada no callback de sucesso
- Invalidar query `unit-members` apos sucesso

---

### 3. Implantacao — Vincular a unidade, data de inicio, sem nome separado

O formulario atual de "Nova Implantacao" pede nome manual, responsavel manual e data alvo. O correto e:
- **Obrigatorio vincular a uma unidade** (select de unidades cadastradas)
- **Nome da implantacao = nome da unidade** (automatico, sem campo separado)
- **Data e de inicio** (nao "data alvo")
- O responsavel pode ser puxado automaticamente da unidade

Alteracoes em `src/pages/Onboarding.tsx`:
- No dialog "Nova Implantacao": remover campo "Nome da implantacao"
- Tornar select de unidade **obrigatorio** (nao opcional)
- Ao selecionar unidade, auto-preencher nome da implantacao com nome da unidade e responsavel com `manager_name`
- Renomear campo "Data alvo" para "Data de inicio"
- Ao criar, passar `name` = nome da unidade, `start_date` = data informada, `unit_org_id` = id da unidade
- Na listagem de cards, mostrar data de inicio ao inves de data alvo como info principal
- Adicionar campo `start_date` no insert do `createUnit` mutation (ja aceito pelo hook)

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/Agenda.tsx` | Reescrever: adicionar views Semana e Dia (copiar padrao do FranqueadoAgenda) |
| `src/components/unidades/UnidadeUsuariosReal.tsx` | Editar: adicionar botao + dialog para convidar membro |
| `src/pages/Onboarding.tsx` | Editar: vincular unidade obrigatoria, nome automatico, data de inicio |

### Sequencia

1. Agenda (views semana/dia)
2. Unidades (criar usuarios)
3. Implantacao (vincular unidade + data inicio)

