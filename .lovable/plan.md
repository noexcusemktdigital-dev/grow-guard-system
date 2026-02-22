

# Migrar Plataforma de Mock para Ambiente Operacional Real

## Escopo Total

A plataforma possui **15 arquivos de dados mock** consumidos por **43+ páginas/componentes**. O banco de dados atual tem apenas 6 tabelas (auth/org). Precisamos criar ~30 tabelas novas e reescrever toda a camada de dados.

---

## FASE 1 -- Criar Todas as Tabelas no Banco

Criar as seguintes tabelas com `organization_id` (multi-tenant) e RLS:

### Grupo CRM (Franqueadora + Cliente)
- `crm_funnels` -- configuracao dos funis por org
- `crm_leads` -- leads unificados (franchise + clients + cliente SaaS)
- `crm_activities` -- historico de atividades do lead
- `crm_tasks` -- tarefas vinculadas a leads
- `crm_files` -- arquivos do lead
- `crm_proposals` -- propostas comerciais
- `crm_lead_notes` -- notas do lead (cliente SaaS)

### Grupo Financeiro
- `finance_months` -- registros mensais (caixa)
- `finance_clients` -- clientes do financeiro
- `finance_revenues` -- receitas
- `finance_expenses` -- despesas
- `finance_employees` -- colaboradores/folha
- `finance_franchisees` -- franqueados
- `finance_installments` -- parcelas (emprestimos/investimentos)

### Grupo Comunicacao
- `announcements` -- comunicados
- `announcement_views` -- visualizacoes/confirmacoes
- `daily_messages` -- mensagens do dia (home)

### Grupo Atendimento
- `support_tickets` -- chamados
- `support_messages` -- mensagens do chamado

### Grupo Contratos
- `contract_templates` -- modelos de contrato
- `contracts` -- contratos gerados

### Grupo Academy
- `academy_modules` -- modulos de treinamento
- `academy_lessons` -- aulas
- `academy_quizzes` -- quizzes
- `academy_quiz_questions` -- perguntas
- `academy_progress` -- progresso do usuario
- `academy_quiz_attempts` -- tentativas
- `academy_certificates` -- certificados

### Grupo Agenda
- `calendars` -- calendarios
- `calendar_events` -- eventos
- `event_participants` -- participantes

### Grupo Marketing
- `marketing_assets` -- materiais
- `marketing_folders` -- pastas

### Grupo Onboarding
- `onboarding_units` -- unidades em implantacao
- `onboarding_checklist` -- itens do checklist
- `onboarding_meetings` -- reunioes
- `onboarding_tasks` -- tarefas
- `onboarding_indicators` -- indicadores

### Grupo Metas/Ranking
- `goals` -- metas
- `rankings` -- ranking mensal

### Grupo Unidades
- `units` -- dados de unidades franqueadas

### Grupo Matriz (Usuarios)
- `permission_profiles` -- perfis de permissao
- `module_permissions` -- permissoes por modulo

### Grupo Cliente SaaS (adicional)
- `client_checklist_items` -- checklist diario
- `client_campaigns` -- campanhas marketing
- `client_content` -- conteudos/posts
- `client_scripts` -- scripts de vendas
- `client_dispatches` -- disparos
- `client_sites` -- sites/LPs
- `client_notifications` -- notificacoes
- `client_gamification` -- pontos e medalhas

Todas as tabelas terao:
- `organization_id uuid NOT NULL` com FK para organizations
- `created_at`, `updated_at` timestamps
- RLS habilitado com politicas baseadas em `is_member_of_org()`
- Indexes adequados

---

## FASE 2 -- Criar Hooks de Dados (React Query + Supabase)

Para cada dominio, criar um hook customizado em `src/hooks/`:

- `useCrmLeads.ts` -- CRUD de leads com filtros por funil/estagio
- `useCrmActivities.ts` -- atividades do lead
- `useCrmTasks.ts` -- tarefas do lead
- `useFinance.ts` -- receitas, despesas, DRE
- `useAnnouncements.ts` -- comunicados
- `useSupportTickets.ts` -- chamados
- `useContracts.ts` -- contratos e templates
- `useAcademy.ts` -- modulos, aulas, progresso
- `useCalendar.ts` -- agenda e eventos
- `useMarketing.ts` -- materiais
- `useOnboarding.ts` -- implantacao
- `useGoals.ts` -- metas e ranking
- `useUnits.ts` -- unidades
- `useClienteCrm.ts` -- CRM do cliente SaaS
- `useClienteWallet.ts` -- wallet real (ja existe tabela credit_wallets)
- `useClienteSubscription.ts` -- plano real (ja existe tabela subscriptions)

Cada hook usara `@tanstack/react-query` + `supabase` client, filtrando por `organization_id` do usuario logado.

---

## FASE 3 -- Substituir Mocks nos Componentes

Reescrever **todas as 43+ paginas** para:
1. Remover imports de `@/data/*`
2. Usar os novos hooks
3. Adicionar estados de loading (skeleton)
4. Adicionar **empty states** ("Seu CRM esta vazio. Crie seu primeiro lead.")

Exemplos de empty states por modulo:
- CRM: "Nenhum lead encontrado. Crie seu primeiro lead para comecar."
- Financeiro: "Nenhuma receita registrada. Adicione sua primeira receita."
- Comunicados: "Nenhum comunicado. Crie o primeiro comunicado."
- Academy: "Nenhum modulo disponivel."
- Agenda: "Sua agenda esta vazia. Crie seu primeiro evento."
- Contratos: "Nenhum contrato. Crie seu primeiro contrato."

---

## FASE 4 -- Remover Todos os Mocks

Deletar os 15 arquivos de dados mock:
- `src/data/mockData.ts`
- `src/data/crmData.ts`
- `src/data/clienteData.ts`
- `src/data/homeData.ts`
- `src/data/comunicadosData.ts`
- `src/data/contratosData.ts`
- `src/data/atendimentoData.ts`
- `src/data/academyData.ts`
- `src/data/agendaData.ts`
- `src/data/marketingData.ts`
- `src/data/franqueadoData.ts`
- `src/data/matrizData.ts`
- `src/data/metasRankingData.ts`
- `src/data/onboardingData.ts`
- `src/data/unidadesData.ts`

Manter apenas os **types/interfaces** que serao movidos para `src/types/` ou gerados automaticamente pelo Supabase.

---

## FASE 5 -- Corrigir Feature Gating para Dados Reais

- `FeatureGateContext.tsx` atualmente usa `mockSubscription` e `mockWallet`
- Substituir por consultas reais as tabelas `subscriptions` e `credit_wallets`
- Garantir que o bloqueio funciona com dados reais (trial expirado, sem creditos)

---

## FASE 6 -- Desativar Simulacoes

Remover qualquer KPI, grafico ou metrica que mostre valores inventados:
- Dashboard Home: mostrar dados reais ou empty state
- Taxa de conversao: calcular a partir de leads reais
- ROI estimado: so mostrar quando houver dados
- Metricas de campanhas: so mostrar com dados reais

---

## Ordem de Execucao

Devido ao tamanho, a implementacao sera feita em **blocos sequenciais**:

1. **Bloco 1**: Migration SQL (todas as tabelas + RLS) -- uma unica migracao
2. **Bloco 2**: Hooks de dados (todos os hooks de uma vez)
3. **Bloco 3**: Paginas Franqueadora (CRM, Financeiro, Comunicados, Atendimento, Contratos, Academy, Agenda, Marketing, Onboarding, Metas, Unidades, Matriz, Home)
4. **Bloco 4**: Paginas Franqueado (Dashboard, CRM, Financeiro, Academy, etc.)
5. **Bloco 5**: Paginas Cliente SaaS (Inicio, CRM, Chat, Conteudos, Campanhas, etc.)
6. **Bloco 6**: Feature Gating real + cleanup final + deletar mocks

### Detalhes Tecnicos

- Todas as queries usarao `organization_id` do usuario logado (obtido via `get_user_org_id(auth.uid())`)
- RLS padrao: `is_member_of_org(auth.uid(), organization_id)` para SELECT, e roles especificos para INSERT/UPDATE/DELETE
- Os types serao inferidos do `src/integrations/supabase/types.ts` gerado automaticamente
- Empty states usarao componentes reutilizaveis com icone + mensagem + botao de acao

