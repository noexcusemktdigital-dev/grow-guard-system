

# Modulo Agenda -- Calendario Nativo do Sistema

## Resumo

Criar o modulo "Agenda" dentro da secao Principal do sidebar. Calendario completo com 3 niveis (Usuario, Unidade, Rede) + Agendas Colaborativas, visualizacoes Dia/Semana/Mes/Lista, sistema de convites com aceitar/recusar, bloqueios de horario para disponibilidade, e campos preparados para integracao futura com Google Calendar.

---

## Arquivos

```text
CRIAR:
src/data/agendaData.ts                              -- tipos, mock data, helpers
src/pages/Agenda.tsx                                -- pagina principal (calendario + detalhe + config)
src/components/agenda/AgendaCalendar.tsx             -- visualizacao mes/semana/dia
src/components/agenda/AgendaListView.tsx             -- visualizacao lista
src/components/agenda/AgendaEventForm.tsx            -- formulario de criacao/edicao de evento
src/components/agenda/AgendaEventDetail.tsx          -- detalhe do evento com convites
src/components/agenda/AgendaSidebar.tsx              -- painel lateral de calendarios (ligar/desligar camadas)
src/components/agenda/AgendaConfig.tsx               -- configuracoes (Google Calendar, compartilhamento)

MODIFICAR:
src/components/FranqueadoraSidebar.tsx  -- remover disabled do item "Agenda"
src/App.tsx                            -- adicionar rota /franqueadora/agenda
```

---

## 1. Dados (agendaData.ts)

### Tipos

```text
CalendarLevel = "usuario" | "unidade" | "rede" | "colaborativa"

EventType = "Reuniao" | "CS" | "Comercial" | "Treinamento" | "Evento" | "Prazo" | "Bloqueio"

EventStatus = "Confirmado" | "Pendente" | "Cancelado"

EventVisibility = "Privado" | "Interno unidade" | "Rede" | "Colaborativo"

InviteStatus = "Aceito" | "Recusado" | "Pendente"

RecurrenceType = "none" | "daily" | "weekly" | "biweekly" | "monthly"

CalendarConfig:
  id, nome, nivel (CalendarLevel),
  cor (string hex), ownerId, ownerNome,
  unidadeId? (para calendarios de unidade),
  participantes? (para colaborativas: { userId, nome, permissao: "editor" | "visualizador" }[]),
  compartilharComUnidade (bool), compartilharComFranqueadora (bool),
  mostrarDetalhes (bool -- ou apenas ocupado/livre)

AgendaEvent:
  id, titulo, descricao,
  inicio (ISO datetime), fim (ISO datetime),
  allDay (bool),
  calendarId, nivel (CalendarLevel),
  tipo (EventType), status (EventStatus),
  visibilidade (EventVisibility),
  recorrencia (RecurrenceType),
  participantes: EventParticipant[],
  local? (string -- endereco ou "Online"),
  linkMeet? (string -- Google Meet/Zoom),
  anexos? (string[]),
  criadoPor, criadoPorNome,
  unidadeId?,
  -- Google Calendar prep fields:
  googleEventId?, googleCalendarId?,
  syncStatus? ("synced" | "pending" | "error"),
  lastSyncedAt?,
  criadoEm, atualizadoEm

EventParticipant:
  userId, nome, unidadeNome?,
  email?,
  status (InviteStatus),
  respondidoEm?

TimeBlock (Bloqueio de horario):
  id, userId, userNome,
  titulo (ex: "Disponivel para CS", "Bloqueado"),
  inicio, fim,
  recorrencia (RecurrenceType),
  tipo: "disponivel" | "bloqueado",
  criadoEm
```

### Calendarios Mock

- "Minha Agenda" (usuario, cor azul, owner Davi)
- "Agenda Curitiba" (unidade u1, cor verde)
- "Agenda Rede" (rede, cor roxo)
- "Projeto Expansao SP" (colaborativa, cor laranja, 3 participantes)
- "Onboarding Bahia" (colaborativa, cor teal, 2 participantes)

### Eventos Mock (15-18 eventos)

- 3-4 eventos pessoais (usuario)
- 3-4 eventos de unidade (reunioes com clientes, rotina)
- 3-4 eventos de rede (convencao, fechamento DRE, treinamento rede, campanha)
- 2-3 eventos colaborativos (reuniao onboarding, sprint expansao)
- 2 bloqueios de horario (CS disponivel, bloqueado pessoal)
- 1 evento cancelado
- 2 eventos com convites pendentes
- Distribuidos entre fev e mar 2026

### Convites Mock

- 8-10 participantes distribuidos entre eventos
- Mix de Aceito/Pendente/Recusado

### Helpers

- `getEventsForDate(date, calendarIds[])` -- eventos de um dia filtrados por calendarios ativos
- `getEventsForWeek(date, calendarIds[])` -- eventos da semana
- `getEventsForMonth(date, calendarIds[])` -- eventos do mes
- `getEventColor(calendarId)` -- cor do calendario do evento
- `getTypeIcon(tipo)` -- icone do tipo
- `getStatusColor(status)` -- cor do status
- `getInviteStatusColor(status)` -- cor do convite
- `getPendingInvites(userId)` -- convites pendentes do usuario
- `getBlocksForUser(userId)` -- bloqueios de horario
- `isTimeAvailable(userId, inicio, fim)` -- verifica disponibilidade

---

## 2. Pagina Principal (Agenda.tsx)

### Layout

```text
+--------------------------------------------------+
| Header (Agenda + badge + controles)              |
+--------------------------------------------------+
| AgendaSidebar  |  Calendar/List/Detail/Config     |
| (calendarios)  |  (area principal)                |
| 200px          |  flex-1                           |
+--------------------------------------------------+
```

### State

- `view`: "month" | "week" | "day" | "list" | "detail" | "config"
- `currentDate`: Date (data de referencia para navegacao)
- `selectedEventId`: null ou id
- `activeCalendars`: string[] (ids dos calendarios ativos/visiveis)
- `showEventForm`: boolean (dialog para criar/editar)
- `editingEvent`: null ou AgendaEvent

### Header

- Titulo "Agenda" com icone Calendar
- Badge "Franqueadora"
- Navegacao de data: < Hoje > (botoes prev/next/today)
- Label do periodo atual (ex: "Fevereiro 2026", "17-23 Fev 2026", "21 Fev 2026")
- Toggle visualizacao: Mes | Semana | Dia | Lista
- Botao Configuracoes
- Botao "+ Novo Evento" (abre dialog)

### Filtros rapidos (chips)

- Tipo: Reuniao, CS, Comercial, Treinamento, Evento, Prazo
- Nivel: Usuario, Unidade, Rede, Colaborativa
- Status: Confirmado, Pendente, Cancelado

### Alerta de convites pendentes

- Se houver convites pendentes, mostrar banner no topo com count e botao "Ver convites"

---

## 3. Painel Lateral de Calendarios (AgendaSidebar.tsx)

### Mini calendario

- Calendario pequeno (react-day-picker) para navegacao rapida de data
- Clicar em um dia muda currentDate e vai para visao Dia

### Secao "Meus Calendarios"

Checkboxes com cor do calendario:
- Minha Agenda (cor azul, checkbox)
- Minha unidade se aplicavel

### Secao "Rede"

- Agenda da Rede (cor roxo, checkbox)

### Secao "Colaborativas"

Lista de agendas colaborativas do usuario:
- Projeto Expansao SP (cor laranja, checkbox)
- Onboarding Bahia (cor teal, checkbox)

### Secao "Convites Pendentes"

- Count de convites pendentes
- Lista resumida dos proximos 3 convites com botoes Aceitar/Recusar inline

### Botao "Gerenciar Calendarios"

- Abre config

---

## 4. Visualizacao Mes (AgendaCalendar.tsx)

### Grid do Mes

- Grid 7 colunas (Dom-Sab) x 5-6 linhas
- Cada celula mostra:
  - Numero do dia
  - Ate 3 eventos (pill com cor do calendario + titulo truncado)
  - "+N mais" se houver mais
- Clicar em evento abre detalhe
- Clicar em dia vazio abre form com data pre-preenchida
- Clicar em "+N mais" vai para visao Dia

### Visualizacao Semana

- 7 colunas (dias) x linhas de hora (8h-20h)
- Eventos posicionados por horario e duracao
- Bloqueios de horario com fundo hachurado
- All-day events no topo

### Visualizacao Dia

- 1 coluna x linhas de hora (7h-22h)
- Eventos posicionados por horario
- Mais espaco para detalhes (titulo + participantes + tipo)
- Bloqueios visiveis

---

## 5. Visualizacao Lista (AgendaListView.tsx)

### Agrupamento por dia

Lista cronologica dos proximos 14 dias (ou periodo selecionado):
- Header do dia (ex: "Sexta, 21 de Fevereiro")
- Cards dos eventos desse dia:
  - Horario, titulo, tipo (badge), calendario (badge cor), participantes (avatars), status
  - Clicar abre detalhe

### Filtros

Usar os mesmos filtros rapidos do header (tipo, nivel, status)

---

## 6. Formulario de Evento (AgendaEventForm.tsx)

### Dialog/Sheet

#### Secao 1 -- Basico

- Titulo (Input obrigatorio)
- Descricao (Textarea)
- All-day (Switch)
- Data/Hora inicio (Input datetime-local)
- Data/Hora fim (Input datetime-local)
- Recorrencia (Select: Nenhuma, Diaria, Semanal, Quinzenal, Mensal)

#### Secao 2 -- Classificacao

- Calendario (Select: lista dos calendarios do usuario)
- Tipo (Select: Reuniao, CS, Comercial, Treinamento, Evento, Prazo, Bloqueio)
- Status (Select: Confirmado, Pendente, Cancelado)
- Visibilidade (Select: Privado, Interno unidade, Rede, Colaborativo)

#### Secao 3 -- Participantes

- Adicionar participantes internos (Select multi com usuarios do sistema -- mockUnidadeUsers)
- Adicionar unidades inteiras (Select multi com unidades)
- E-mails externos (Input, placeholder para Google Calendar)
- Lista de participantes adicionados com botao remover

#### Secao 4 -- Local e Links

- Local (Input: endereco ou "Online")
- Link videoconferencia (Input: Google Meet/Zoom URL)
- Anexos (Input placeholder)

#### Secao 5 -- Google Calendar (placeholder)

- Campos readonly:
  - google_event_id (vazio, placeholder)
  - sync_status: "Nao sincronizado"
  - Mensagem: "Conecte o Google Calendar nas configuracoes para sincronizar este evento"

### Botoes

- "Salvar" (cria/atualiza evento)
- "Cancelar"

---

## 7. Detalhe do Evento (AgendaEventDetail.tsx)

### Card com informacoes completas

- Titulo grande
- Badges: tipo, calendario (com cor), status, visibilidade
- Data/hora inicio e fim
- Recorrencia (se houver)
- Local / Link (clicavel)
- Descricao
- Anexos

### Secao Participantes e Convites

Tabela:
- Nome, Unidade, Status do convite (Aceito/Pendente/Recusado com badge), Respondido em
- Se o usuario logado tem convite pendente: botoes "Aceitar" / "Recusar" em destaque

### Secao Google Calendar (placeholder)

- Status de sincronizacao: "Nao sincronizado"
- google_event_id: vazio
- Botao "Sincronizar" (desabilitado, placeholder)

### Acoes

- Editar (abre form)
- Cancelar evento (muda status)
- Excluir (dialog de confirmacao)

---

## 8. Configuracoes (AgendaConfig.tsx)

### Secao 1 -- Meus Calendarios

Lista de calendarios do usuario com opcoes:
- Cor (seletor de cor simples)
- Compartilhar com unidade (toggle)
- Compartilhar com franqueadora (toggle)
- Mostrar detalhes vs ocupado/livre (toggle)

### Secao 2 -- Agendas Colaborativas

- Botao "Criar Agenda Colaborativa"
- Formulario: nome, cor, participantes (com permissao editor/visualizador)
- Lista das colaborativas existentes com opcao de editar participantes

### Secao 3 -- Bloqueios de Horario

- Botao "Criar Bloqueio"
- Formulario: titulo, tipo (disponivel/bloqueado), horario inicio/fim, recorrencia
- Lista de bloqueios ativos com opcao de editar/excluir
- Explicacao: "Use bloqueios para definir sua disponibilidade para reunioes de onboarding e CS"

### Secao 4 -- Google Calendar (placeholder)

- Botao "Conectar Google Calendar" (desabilitado)
- Texto: "Em breve: sincronize sua agenda com o Google Calendar"
- Opcoes previstas (visualmente, desabilitadas):
  - Modo: Exportar / Importar / 2 vias
  - Calendarios para sincronizar: checkboxes
  - Ultimo sync: nunca
- Campos tecnicos preparados no tipo do evento (google_event_id, google_calendar_id, syncStatus, lastSyncedAt)

---

## 9. Convites + Confirmacao

### Fluxo

- Ao criar evento com participantes, cada participante recebe status "Pendente"
- No painel lateral (AgendaSidebar), secao "Convites Pendentes" mostra os convites
- No detalhe do evento, participante pode Aceitar/Recusar
- Ao aceitar: evento aparece no calendario pessoal
- Ao recusar: evento fica com badge "Recusado" na lista de participantes
- Toast de confirmacao ao responder

### Visual

- Convite pendente: badge amarelo pulsante
- Aceito: badge verde
- Recusado: badge vermelho

---

## 10. Bloqueios de Horario

### Tipos

- **Disponivel**: horarios em que o usuario esta disponivel para reunioes (CS, onboarding)
- **Bloqueado**: horarios indisponiveis

### Visual no Calendario

- Bloqueios aparecem como faixas de fundo no calendario (dia/semana)
- Disponivel: fundo verde claro com borda tracejada
- Bloqueado: fundo vermelho claro com borda tracejada

### Logica

- `isTimeAvailable(userId, inicio, fim)` verifica se nao ha conflito com bloqueios
- Ao criar evento em horario bloqueado: aviso visual (mas permite)

---

## 11. Design

### Cores dos Calendarios

- Minha Agenda: azul (#3B82F6)
- Unidade: verde (#10B981)
- Rede: roxo (#8B5CF6)
- Colaborativas: laranja (#F59E0B), teal (#14B8A6), etc.

### Eventos no Grid

- Pills arredondados com cor do calendario
- Hover mostra tooltip com horario + tipo
- Clique abre detalhe

### Convites

- Pendente: amarelo com pulse
- Aceito: verde
- Recusado: vermelho/cinza

### Bloqueios

- Disponivel: bg-emerald-50 border-dashed border-emerald-300
- Bloqueado: bg-red-50 border-dashed border-red-300

---

## 12. Sidebar e Rotas

### FranqueadoraSidebar.tsx

Na secao `principalSection`, remover `disabled: true` do item "Agenda":
```text
{ label: "Agenda", icon: Calendar, path: "/franqueadora/agenda" }
```

### App.tsx

Adicionar rota:
```text
import Agenda from "./pages/Agenda";
<Route path="agenda" element={<Agenda />} />
```

---

## 13. Ordem de Implementacao

1. `agendaData.ts` -- tipos completos (com campos Google Calendar), calendarios mock (5), eventos mock (15-18), convites, bloqueios, helpers
2. `AgendaSidebar.tsx` -- painel lateral com mini-calendario, checkboxes de calendarios, convites pendentes
3. `AgendaCalendar.tsx` -- visualizacao mes/semana/dia com grid, pills de eventos, bloqueios
4. `AgendaListView.tsx` -- visualizacao lista agrupada por dia
5. `AgendaEventForm.tsx` -- formulario completo com participantes, recorrencia, campos Google Calendar
6. `AgendaEventDetail.tsx` -- detalhe com convites aceitar/recusar, info Google Calendar
7. `AgendaConfig.tsx` -- configuracoes de calendarios, colaborativas, bloqueios, Google Calendar placeholder
8. `Agenda.tsx` -- pagina hub com layout sidebar + area principal, filtros, navegacao de data
9. `FranqueadoraSidebar.tsx` + `App.tsx` -- ativar menu e rota

