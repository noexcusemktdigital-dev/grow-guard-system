

## Plano: Revisão Completa do Portal SaaS (Cliente Final)

Este plano cobre 5 frentes: Dashboard por perfil, remoção de Comunicados como página, evolução do Checklist, ajuste da Gamificação e arquitetura de hierarquia Empresa > Admin > Usuário com Times.

---

### 1. Início (Dashboard) — Visão por perfil

**Problema**: O dashboard atual mostra os mesmos KPIs e seções para admin e usuário.

**Mudanças em `ClienteInicio.tsx`**:
- **Admin**: Mantém visão completa atual (KPIs financeiros, receita semanal, metas, próximos passos, gráficos)
- **Usuário (cliente_user)**: Dashboard simplificado focado em produtividade pessoal:
  - KPIs: "Meus Leads", "Minhas Conversões", "Meu XP", "Tarefas Pendentes" (sem receita total)
  - Remove gráfico de receita semanal (financeiro é admin-only)
  - Mantém: Tarefas do dia, gamificação, metas pessoais, alertas operacionais (leads sem contato, mensagens pendentes)
  - Remove: "Próximos Passos" de configuração (WhatsApp, integrações)
- Usar `useRoleAccess().isAdmin` para condicionar seções
- Comunicados críticos da franqueadora aparecem como alertas no topo (integrar `useAnnouncements` + banner inline)

---

### 2. Comunicados — Remover página, manter como alertas

**Mudanças**:
- **Remover** rota `/cliente/comunicados` do `App.tsx`
- **Remover** item "Comunicados" da sidebar em `ClienteSidebar.tsx` (`globalSection`)
- **Remover** arquivo `ClienteComunicados.tsx` (ou manter sem rota)
- **Integrar no Dashboard**: No `ClienteInicio.tsx`, adicionar seção de comunicados não lidos como cards de alerta no topo (comunicados críticos com banner animado, normais como cards discretos)
- **Manter `AnnouncementPopupDialog`**: Já existe no `ClienteLayout.tsx` — comunicados críticos continuam aparecendo como popup
- **Manter nas Notificações**: Comunicados já aparecem no `NotificationBell` — sem mudança necessária

---

### 3. Checklist — Evolução para To-Do List completo

**Problema**: Hoje só suporta tarefas do dia (diárias) com criação manual simples e tarefas automáticas. Falta: prazos, atribuição por admin a usuários/times, e tarefas do sistema com escopo semanal/mensal.

**Mudanças de banco (migração SQL)**:
- Criar tabela `client_tasks`:
  - `id`, `organization_id`, `title`, `description`, `due_date`, `priority` (low/medium/high)
  - `source` (manual/admin/system), `status` (pending/done)
  - `created_by` (quem criou), `assigned_to` (UUID do usuário atribuído, nullable)
  - `assigned_team` (text, slug do time, nullable)
  - `completed_at`, `completed_by`, `created_at`, `updated_at`
- RLS: membros da org podem ler todas as tarefas da org; criar/editar baseado em role
- Manter compatibilidade com `client_checklist` existente para tarefas diárias automáticas

**Mudanças em `ClienteChecklist.tsx`**:
- Renomear para "Tarefas" no sidebar e header
- Abas: "Hoje" (checklist diário existente), "Minhas Tarefas" (atribuídas ao usuário), "Time" (admin vê todas)
- Formulário de criação expandido: título, descrição, prazo, prioridade, atribuir a usuário ou time (admin only)
- Filtros: por status, prioridade, prazo, responsável
- Tarefas do sistema: card com badge "Sistema" + descrição do que resolver
- Admin pode criar tarefas para qualquer membro da org

**Novo hook `useClienteTasks.ts`**: CRUD na tabela `client_tasks`

---

### 4. Gamificação — Foco em engajamento e preenchimento de dados

**Problema**: Atual foca apenas em CRM (leads/vendas). Precisa incentivar uso completo da plataforma e preenchimento de dados.

**Mudanças em `ClienteGamificacao.tsx`**:
- **Novas medalhas de uso da plataforma**:
  - "Perfil Completo" (nome, telefone, cargo preenchidos)
  - "Empresa Configurada" (CNPJ, endereço, telefone da org)
  - "Integrador" (WhatsApp conectado)
  - "Estrategista" (plano de marketing ou vendas preenchido)
  - "Comunicador" (10+ mensagens enviadas no chat)
- **Score de Completude do Perfil**: Barra de progresso mostrando % de dados preenchidos (perfil + org + integrações). Cada campo preenchido = XP
- **Desafios semanais**: Card com desafios rotativos (ex: "Contate 5 leads esta semana", "Complete seu plano de vendas")
- **Ranking por time**: Além do ranking individual, ranking por time (se times existirem)
- **Admin view**: Painel de visão geral da equipe — quem está ativo, quem precisa de incentivo, ranking consolidado
- **User view**: Foco pessoal — meu nível, minhas medalhas, meu ranking no time

---

### 5. Arquitetura de Hierarquia e Gestão de Usuários

**Problema**: O sistema de times existe na sidebar de Configurações mas é básico. Falta gestão visual de times e hierarquia clara.

**Mudanças em `ClienteConfiguracoes.tsx` (aba Usuários)**:
- Expandir a aba "Usuários" para incluir sub-seção de "Times"
- **Gestão de Times**: Criar/editar times na org do cliente (usar tabela `org_teams` existente + `org_team_members`)
- **Atribuição a times**: No convite de usuário, permitir selecionar time(s)
- **Visão de hierarquia**: Card visual mostrando Empresa > Admins > Usuários agrupados por time
- **Permissões visuais**: Badge clara mostrando o que cada papel pode fazer (Admin: tudo | Usuário: operacional)

**Mudanças na sidebar `ClienteSidebar.tsx`**:
- Substituir "Comunicados" por nada (removido)
- Renomear "Checklist" para "Tarefas"
- Manter ordem: Início, Tarefas, Gamificação

---

### Resumo de arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClienteInicio.tsx` | Condicionar seções por role (admin vs user), adicionar alertas de comunicados |
| `src/components/ClienteSidebar.tsx` | Remover "Comunicados", renomear "Checklist" → "Tarefas" |
| `src/App.tsx` | Remover rota `/cliente/comunicados` |
| `src/pages/cliente/ClienteChecklist.tsx` | Reescrever como sistema de tarefas com abas, atribuição e prazos |
| `src/pages/cliente/ClienteGamificacao.tsx` | Adicionar medalhas de uso, score de completude, visão admin vs user |
| `src/pages/cliente/ClienteConfiguracoes.tsx` | Expandir aba Usuários com gestão de times e hierarquia visual |
| `src/hooks/useClienteTasks.ts` | Novo hook para CRUD de tarefas |
| **Migração SQL** | Criar tabela `client_tasks` com RLS |

### Ordem de execução
1. Migração SQL (tabela `client_tasks`)
2. Sidebar + rotas (remover comunicados, renomear checklist)
3. Dashboard condicional (admin vs user)
4. Sistema de Tarefas (novo checklist)
5. Gamificação (medalhas de uso + visão por role)
6. Gestão de usuários e times (configurações)

