
# Auditoria Completa: Franqueadora + Franqueado

## Modulos da Franqueadora -- Status Individual

### 1. Dashboard (Home.tsx) -- OK com ressalva
- Saudacao, KPIs de leads, comunicados e agenda funcionam
- **PROBLEMA**: Usa `HomeAtalhos` que tem links hardcoded para `/franqueadora/*` -- funciona porque so e usado no contexto correto, mas o Franqueado tambem usa o mesmo componente `HomeAtalhos` e os links apontam para `/franqueadora/*` em vez de `/franqueado/*`
- **Gravidade: MEDIA** -- Os atalhos no dashboard do Franqueado levam para rotas da Franqueadora (acesso negado)

### 2. Agenda -- OK
- Hook `useCalendarEvents` usa RPC `get_calendar_events_with_parent` corretamente
- Suporta filtro por datas, visibilidade cruzada
- Criacao de eventos salva na org do usuario

### 3. Comunicados -- OK
- Hook `useAnnouncements` usa RPC `get_announcements_with_parent`
- Segmentacao por unidade e prioridade funcionam

### 4. CRM Expansao -- OK
- Leads isolados por `organization_id` -- correto para franqueadora
- Bulk actions, drag-and-drop, filtros avancados

### 5. Propostas -- OK
- Propostas isoladas por `organization_id`
- Gerador integrado com calculadora

### 6. Unidades -- OK
- Provisionamento via `provision-unit`
- Dados, usuarios, documentos, financeiro

### 7. Onboarding -- OK
- Checklists, reunioes e tarefas isolados por org

### 8. Atendimento/Suporte -- OK
- Franqueadora ve tickets da rede via `get_network_tickets`
- Mensagens bidirecionais

### 9. Marketing Drive -- OK
- Assets e pastas geridos pela Franqueadora
- Franqueado consome via `useContentSourceOrgId`

### 10. Academy/Treinamentos -- OK
- Modulos e aulas da org pai, progresso por usuario

### 11. Metas & Ranking -- OK com ressalva
- RPC `get_goals_with_parent` funciona
- `useGoalProgress` calcula progresso baseado em leads/atividades do CRM da org
- **PROBLEMA**: O calculo de progresso de metas usa `crm_leads` e `crm_activities` filtrados por `organization_id` do usuario. Para metas da franqueadora com scope `network`, o progresso deveria agregar dados de TODAS as unidades, mas so ve dados da propria org
- **Gravidade: MEDIA** -- Franqueadora ve progresso da rede como zero (nao agrega)

### 12. Financeiro -- OK
- Dashboard, receitas, despesas, repasse, fechamentos
- Fechamentos com visibilidade cruzada via `get_closings_with_parent`

### 13. Contratos -- OK
- Templates com heranca via `get_contract_templates_with_parent`
- Rede via `get_network_contracts`
- Unidade ve contratos proprios + onde e `unit_org_id` via `get_contracts_for_unit`

### 14. Matriz -- OK
- Gestao de usuarios da franqueadora
- Convites via `invite-user`

### 15. SaaS Dashboard -- OK
- Gestao de clientes, custos, erros e suporte

---

## Modulos do Franqueado -- Status Individual

### 1. Dashboard (FranqueadoDashboard.tsx) -- PROBLEMA
- Mostra KPIs de leads, contratos, eventos e metas
- Mensagem do dia e comunicados funcionam via RPCs with_parent
- **ERRO CRITICO**: Usa `HomeAtalhos` que tem links hardcoded para `/franqueadora/*`
- O franqueado clica em "Marketing" e vai para `/franqueadora/marketing` (acesso negado)

### 2. CRM de Vendas -- OK
- Leads isolados por org do franqueado
- Kanban, filtros, bulk actions

### 3. Prospeccao IA -- OK
- Isolado por org, chama edge function `generate-prospection`

### 4. Criador de Estrategia -- OK
- Isolado por org, chama edge function `generate-strategy`

### 5. Diagnostico NOE -- OK
- Avaliacao por categorias com radar chart
- Integrado com leads do CRM

### 6. Gerador de Propostas -- OK
- Isolado por org, gera PDF

### 7. Agenda (FranqueadoAgenda) -- OK
- Usa `get_calendar_events_with_parent` para ver eventos da rede

### 8. Comunicados Matriz -- OK
- Usa `get_announcements_with_parent`

### 9. Suporte -- OK
- Cria tickets na propria org, franqueadora ve tudo

### 10. Marketing/Materiais -- OK
- Consome assets da org pai via `useContentSourceOrgId`
- Somente visualizacao/download

### 11. NOE Academy -- OK
- Modulos da org pai, progresso individual

### 12. Financeiro -- OK com melhorias possiveis
- KPIs baseados em contratos ativos
- Controle de pagamentos via Asaas
- Fechamentos da franqueadora visiveis
- Pagamento de sistema (R$ 250)

### 13. Meus Contratos -- OK
- Usa `get_contracts_for_unit` para ver proprios + franquia
- Formulario de criacao de contrato

### 14. Configuracoes -- OK
- Dados da unidade, equipe, contrato de franquia
- Convite de funcionarios via `invite-user`

---

## Integracao Franqueadora-Franqueado -- Diagnostico

### FUNCIONANDO CORRETAMENTE
1. Comunicados (get_announcements_with_parent)
2. Marketing/Drive (useContentSourceOrgId -> get_parent_org_id)
3. Academy/Treinamentos (sourceOrgId da org pai)
4. Suporte/Atendimento (get_network_tickets)
5. Unidades (parent_org_id via provision-unit)
6. Mensagem do Dia (get_daily_message_with_parent)
7. Metas e Ranking (get_goals_with_parent)
8. Fechamentos Financeiros (get_closings_with_parent)
9. Contratos de Franquia (get_contracts_for_unit)
10. Templates de Contrato (get_contract_templates_with_parent)
11. Agenda (get_calendar_events_with_parent)

### PROBLEMAS ENCONTRADOS

#### ERRO 1: HomeAtalhos hardcoded para Franqueadora
- **Gravidade: ALTA**
- O componente `HomeAtalhos` tem links fixos para `/franqueadora/*`
- O franqueado usa o mesmo componente no seu dashboard
- Resultado: franqueado clica nos atalhos e recebe acesso negado
- **Correcao**: Criar uma versao que detecta o role do usuario ou recebe os atalhos como prop, mapeando para `/franqueado/*`

#### ERRO 2: Progresso de metas nao agrega dados da rede
- **Gravidade: MEDIA**
- `useGoalProgress` filtra leads e atividades por `organization_id` do usuario
- Para metas `network` ou `global` criadas pela franqueadora, o progresso deveria agregar dados de todas as unidades filhas
- Resultado: franqueadora ve progresso = 0 para metas de rede
- **Correcao**: Criar uma query que busca dados de todas as orgs filhas quando o scope e `network`/`global`

#### ERRO 3: Rankings isolados por org
- **Gravidade: BAIXA**
- `useRankings` filtra por `organization_id = orgId`
- Rankings deveriam ser visiveis entre unidades para funcionar como ranking de rede
- **Correcao**: Criar RPC `get_rankings_with_parent` ou ajustar para buscar da org pai

#### ERRO 4: Franqueadora Sidebar nao mostra dados do usuario logado
- **Gravidade: BAIXA**
- A sidebar da franqueadora exibe "Admin" e "Franqueadora" fixos no footer
- A sidebar do franqueado usa `profile.full_name` dinamico
- **Correcao**: Usar `useAuth` na sidebar da franqueadora tambem

---

## Plano de Implementacao

### Fase 1 -- Correcoes Criticas

1. **HomeAtalhos dinamico**: Refatorar o componente para aceitar uma prop de atalhos ou detectar automaticamente o role, mapeando para as rotas corretas (`/franqueado/*` ou `/franqueadora/*`)

2. **GoalProgress para metas de rede**: Alterar `useGoalProgress` para, quando o scope da meta e `network` ou `global`, buscar leads/atividades de todas as orgs filhas (via uma nova RPC ou query)

### Fase 2 -- Polimento

3. **Rankings cruzados**: Criar RPC `get_rankings_with_parent` para que franqueado veja o ranking da rede

4. **Sidebar da Franqueadora**: Usar dados do usuario logado no footer

### Detalhes Tecnicos

**Arquivos a modificar:**
- `src/components/home/HomeAtalhos.tsx` -- aceitar prop de atalhos com rotas dinamicas
- `src/pages/Home.tsx` -- passar atalhos da franqueadora
- `src/pages/franqueado/FranqueadoDashboard.tsx` -- passar atalhos do franqueado
- `src/hooks/useGoalProgress.ts` -- criar logica de agregacao cross-org para metas de rede
- `src/hooks/useGoals.ts` (useRankings) -- usar RPC com parent
- `src/components/FranqueadoraSidebar.tsx` -- usar useAuth

**Nova RPC (se necessario):**
- `get_network_crm_leads(_parent_org_id)` -- retorna leads de todas as orgs filhas para calculo de metas de rede
