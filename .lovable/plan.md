

## Plano de Reestruturação: Integração Matriz ↔ Franqueado ↔ Cliente

### Contexto atual

O sistema já possui uma arquitetura de herança baseada em `parent_org_id` na tabela `organizations`. A hierarquia atual:

```text
Franqueadora (NoExcuse)         ← parent_org_id = NULL
  └─ Franqueado (Allure)        ← parent_org_id = Franqueadora
       └─ Cliente (SaaS)        ← parent_org_id = NULL ❌ (desconectado)
```

**RPCs "with_parent" existentes e funcionais** (Matriz → Franqueado):
- `get_announcements_with_parent` — Comunicados ✅
- `get_daily_message_with_parent` — Mensagem do Dia ✅
- `get_goals_with_parent` — Metas ✅
- `get_calendar_events_with_parent` — Agenda ✅
- `get_contract_templates_with_parent` — Templates de Contrato ✅
- `get_contracts_for_unit` — Contratos ✅
- `get_closings_with_parent` — Fechamentos (DRE) ✅
- `get_rankings_with_parent` — Rankings ✅
- `get_network_tickets` — Suporte (Franqueado → Matriz) ✅
- `get_network_crm_data` — Dados CRM da rede ✅
- `get_network_contracts` — Contratos da rede ✅

### Problemas identificados

| # | Problema | Impacto |
|---|---------|---------|
| 1 | **Clientes SaaS não têm `parent_org_id`** vinculando ao Franqueado | Clientes não recebem comunicados, metas, ou mensagens do dia da rede |
| 2 | **"Unidade Teste"** (franqueado) sem `parent_org_id` | Franqueado órfão, não recebe dados da matriz |
| 3 | **"Nova Unidade"** sem `unit_org_id` | Não pode ser alvo de comunicados segmentados |
| 4 | **Clientes duplicados** ("Rafael Marutaka's Company" x3) | Dados dispersos, provisionamento falho |
| 5 | **Dashboard do Franqueado** não mostra dados agregados dos clientes | Franqueado não vê performance dos clientes atendidos |
| 6 | **Matriz não tem visibilidade sobre clientes SaaS** | Franqueadora não monitora a base de clientes da rede |
| 7 | **Atendimento/Suporte** é unidirecional (Franqueado→Matriz) | Clientes não conseguem abrir chamados para o franqueado |

### Plano de ação (por prioridade)

---

#### Fase 1 — Corrigir dados e vincular clientes (Backend)

**1.1 Migration: Vincular clientes ao franqueado**
- Os clientes SaaS vendidos por um franqueado devem ter `parent_org_id` apontando para a organização do franqueado
- Isso ativa automaticamente TODAS as RPCs "with_parent" para clientes (comunicados, metas, mensagem do dia, agenda)
- A Edge Function `signup-saas` precisa aceitar um parâmetro opcional `franchisee_org_id` para vincular automaticamente novos clientes

**1.2 Limpeza de dados**
- Corrigir "Unidade Teste" — vincular `parent_org_id` à Franqueadora
- Corrigir "Nova Unidade" — criar organização vinculada e preencher `unit_org_id`
- Limpar organizações duplicadas de teste

---

#### Fase 2 — Visibilidade da rede no Dashboard (Frontend + Backend)

**2.1 Nova RPC: `get_network_client_stats`**
- Para franqueados: agregar dados dos clientes filhos (total de leads, receita, WhatsApp ativo)
- Para matriz: agregar dados de TODA a rede (franqueados + clientes)

**2.2 Dashboard da Matriz** (`Home.tsx`)
- Adicionar KPI "Clientes SaaS Ativos" — total de organizações do tipo 'cliente' na rede
- Adicionar card "Performance SaaS" com MRR, churn e ativação

**2.3 Dashboard do Franqueado** (`FranqueadoDashboard.tsx`)
- Adicionar KPI "Clientes Ativos" — contagem de orgs filhas tipo 'cliente'
- Adicionar card "Saúde dos Clientes" com métricas de uso (leads, WhatsApp, créditos)

---

#### Fase 3 — Suporte bidirecional Cliente ↔ Franqueado (Backend + Frontend)

**3.1 Expandir `get_network_tickets`**
- Já funciona para Franqueado→Matriz
- Precisamos garantir que também funcione para Cliente→Franqueado (já funcionará automaticamente via `parent_org_id`)

**3.2 Criar módulo de Suporte no portal do Cliente**
- Atualmente o cliente não tem módulo de suporte/chamados
- Reutilizar a mesma tabela `support_tickets` e hooks existentes
- Adicionar rota `/cliente/suporte` e página `ClienteSuporte.tsx`

---

#### Fase 4 — Comunicados em cascata (Backend)

**4.1 Ajustar RPC `get_announcements_with_parent`**
- Já suporta 2 níveis (grandparent → parent → child)
- Com clientes vinculados via `parent_org_id`, comunicados da Matriz chegarão automaticamente aos clientes
- Franqueados poderão criar comunicados segmentados para seus clientes

**4.2 Formulário do Franqueado para comunicados**
- Permitir que franqueados criem comunicados direcionados aos seus clientes
- Reutilizar `ComunicadoForm.tsx` adaptado para listar organizações filhas do tipo 'cliente'

---

#### Fase 5 — Agenda e Eventos compartilhados

**5.1 A RPC `get_calendar_events_with_parent` já suporta herança**
- Com clientes vinculados, eventos marcados como `visibility = 'network'` já aparecerão para clientes
- Ajustar `ComunicadoForm` e `AgendaEventForm` para permitir segmentação por tipo de organização (franqueado vs cliente)

---

#### Fase 6 — Monitoramento centralizado na Matriz

**6.1 Expandir o módulo SaaS da Franqueadora** (`SaasDashboard.tsx`)
- Listar todos os clientes da rede com dados reais (org name, plano, créditos, última atividade)
- Permitir drill-down por franqueado para ver seus clientes

**6.2 Alertas de saúde da rede**
- Clientes inativos (sem login > 7 dias)
- Créditos baixos
- Churn risk (assinatura próxima do vencimento)

---

### Arquivos que serão criados/alterados

| Arquivo | Ação |
|---------|------|
| Migration SQL (dados) | Vincular clientes existentes, limpar duplicatas |
| Migration SQL (RPC) | Criar `get_network_client_stats` |
| `supabase/functions/signup-saas/index.ts` | Aceitar `franchisee_org_id` |
| `src/pages/Home.tsx` | Adicionar KPIs de clientes SaaS |
| `src/pages/franqueado/FranqueadoDashboard.tsx` | Adicionar KPIs de clientes |
| `src/pages/cliente/ClienteSuporte.tsx` | **Novo** — Módulo de suporte para clientes |
| `src/App.tsx` | Adicionar rota `/cliente/suporte` |
| `src/components/ClienteSidebar.tsx` | Adicionar link Suporte |
| `src/hooks/useNetworkClientStats.ts` | **Novo** — hook para stats de clientes |

### Escopo e abordagem

Este é um projeto grande. Recomendo executar **Fase 1 primeiro** (correção de dados e vínculos), porque ela sozinha já ativa a maioria das integrações que já existem no código mas estão "dormentes" por falta do `parent_org_id` nos clientes.

Quer que eu comece pela Fase 1 (correção de dados e vinculação de clientes)?

