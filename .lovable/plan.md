
# Franqueado - Modulo 1: Agenda, Comunicados e Suporte

Desenvolvimento dos tres primeiros modulos da area do franqueado com persistencia real no banco de dados.

---

## 1. Agenda do Franqueado

### Funcionalidades
- Visualizacao em grade mensal (mesmo padrao da Franqueadora)
- Criar, editar e excluir eventos pessoais e compartilhados
- Formulario completo: titulo, descricao, data/hora inicio e fim, local, dia todo, cor
- Sidebar lateral com lista de calendarios (Pessoal, Compartilhado, Franqueadora)
- Eventos criados pela Franqueadora aparecem como somente leitura (cor diferente)
- Detalhe do evento ao clicar (Sheet lateral)
- Integracao com Google Calendar (fase futura, preparar UI com botao "Conectar Google Agenda")

### Alteracoes no banco de dados
- Adicionar coluna `unit_id` (uuid, nullable) na tabela `calendar_events` para identificar eventos de unidade
- Adicionar coluna `visibility` (text, default 'private') na tabela `calendar_events` com valores: private, unit, network
- Adicionar coluna `readonly` (boolean, default false) para eventos enviados pela franqueadora
- Criar tabela `calendar_event_invites` para convites entre usuarios da mesma unidade:
  - id, event_id, user_id, status (pending/accepted/declined), created_at

### Arquivos modificados/criados
- `src/pages/franqueado/FranqueadoAgenda.tsx` - Reescrever com grid mensal, sidebar de calendarios, formulario completo
- `src/hooks/useCalendar.ts` - Adicionar filtro por unit_id e visibility

---

## 2. Comunicados (recebidos da Matriz)

### Funcionalidades
- Lista de comunicados recebidos em ordem cronologica
- Filtros por prioridade (Normal, Alta, Critica) e tipo
- Comunicados com prioridade "Critica" exibem badge vermelho destacado
- Detalhe do comunicado ao clicar (expande inline ou abre Sheet)
- Secao "Arquivados" - comunicados ja lidos ficam separados
- Confirmacao de leitura ("Li e concordo") para comunicados criticos
- Somente leitura - franqueado nao cria comunicados

### Alteracoes no banco de dados
- Adicionar coluna `target_unit_ids` (uuid[], default '{}') na tabela `announcements` para segmentacao por unidades especificas (vazio = todas)
- Usar tabela existente `announcement_views` para rastrear leitura e confirmacao

### Arquivos modificados/criados
- `src/pages/franqueado/FranqueadoComunicados.tsx` - Reescrever com filtros, detalhe expandivel, secao arquivados e confirmacao de leitura
- `src/hooks/useAnnouncements.ts` - Adicionar filtro por unidade e funcao de marcar como lido/confirmado

---

## 3. Suporte (Chamados bidirecionais)

### Funcionalidades
- Renomear "Suporte Matriz" para "Suporte" na sidebar
- Layout split-view: lista de chamados a esquerda, chat/detalhes a direita
- Cards de resumo no topo: Abertos, Em Analise, Resolvidos
- Criar chamado com: titulo, categoria, prioridade, descricao
- Timeline de mensagens no chamado (estilo chat)
- Franqueado e Matriz podem enviar mensagens no mesmo chamado
- Status do chamado visivel com badges coloridos
- Filtros por status e busca por texto
- Indicador de SLA (tempo desde abertura)

### Alteracoes no banco de dados
- Nenhuma alteracao necessaria - tabelas `support_tickets` e `support_messages` ja existem com a estrutura correta

### Arquivos modificados/criados
- `src/pages/franqueado/FranqueadoSuporte.tsx` - Reescrever com layout split-view e chat integrado
- `src/components/FranqueadoSidebar.tsx` - Renomear "Suporte Matriz" para "Suporte"
- `src/hooks/useSupportTickets.ts` - Adicionar hook para mensagens com refetch automatico

---

## Detalhes Tecnicos

### Migracao SQL

```sql
-- 1. Novas colunas em calendar_events
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id);
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS readonly boolean DEFAULT false;

-- 2. Tabela de convites de eventos
CREATE TABLE IF NOT EXISTS calendar_event_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE calendar_event_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invites" ON calendar_event_invites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Members can manage invites" ON calendar_event_invites FOR ALL USING (
  EXISTS (SELECT 1 FROM calendar_events ce WHERE ce.id = event_id AND is_member_of_org(auth.uid(), ce.organization_id))
);

-- 3. Coluna target_unit_ids em announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_unit_ids uuid[] DEFAULT '{}';
```

### Estrutura de componentes

```text
FranqueadoAgenda.tsx
  +-- CalendarGrid (grade mensal)
  +-- CalendarSidebar (lista de calendarios + mini-calendar)
  +-- EventFormDialog (criar/editar evento)
  +-- EventDetailSheet (detalhe ao clicar)

FranqueadoComunicados.tsx
  +-- ComunicadoFilters (filtros prioridade/tipo)
  +-- ComunicadoCard (card com expand)
  +-- ComunicadoDetail (detalhe + confirmacao leitura)

FranqueadoSuporte.tsx
  +-- TicketList (lista lateral)
  +-- TicketDetail (detalhes + chat)
  +-- TicketChatTimeline (mensagens)
  +-- NewTicketDialog (criar chamado)
```

### Ordem de implementacao
1. Migracao SQL (todas as alteracoes de schema)
2. Sidebar - renomear "Suporte Matriz" para "Suporte"
3. Agenda - componente completo com grid, formulario e detalhe
4. Comunicados - lista com filtros, detalhe e confirmacao
5. Suporte - layout split-view com chat
