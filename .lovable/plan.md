
# CRM Completo: Integracoes, Configuracoes, Roleta e Automacoes

## Resumo

Este plano finaliza o CRM com 6 grandes blocos: integracoes para captar leads de fontes externas, configuracoes avancadas (multiplos funis, times, atribuicao), roleta de leads, filtros detalhados, automacoes de CRM e automacoes de IA + CRM.

---

## Bloco 1 -- Integracoes de Leads (Fontes Externas)

### Edge Function: `crm-lead-webhook`

Nova edge function que recebe leads de qualquer fonte externa via POST. O cliente recebe uma URL unica por organizacao para configurar em:
- Meta Leads (Facebook/Instagram Ads)
- Google Ads
- Landing pages e formularios
- RD Station, HubSpot, etc.
- Qualquer sistema que envie webhook

**Endpoint:** `POST /crm-lead-webhook/{org_id}`

**Payload aceito (flexivel):**
```json
{
  "name": "Nome do Lead",
  "email": "email@exemplo.com",
  "phone": "11999999999",
  "company": "Empresa",
  "source": "Meta Leads",
  "value": 5000,
  "tags": ["ads", "campanha-jan"],
  "custom_fields": { "utm_source": "facebook", "campanha": "promo-jan" }
}
```

**Logica:**
1. Valida campos obrigatorios (name)
2. Verifica duplicata por telefone ou email na mesma org
3. Se duplicata: atualiza tags e registra atividade "Lead atualizado via webhook"
4. Se novo: cria lead na primeira etapa do funil padrao
5. Aplica regra de roleta (se ativa) para atribuir `assigned_to`
6. Retorna `{ success: true, lead_id: "..." }`

### Importacao CSV

Funcionalidade no frontend para importar leads em massa:
- Upload de arquivo CSV
- Preview dos dados com mapeamento de colunas
- Importacao via `createLead` em batch
- Relatorio de sucesso/erros

### Interface de Integracoes (aba nas Configuracoes)

Card para cada integracao mostrando:
- URL do webhook unica da org (copiavel)
- Instrucoes de como configurar em cada plataforma
- Log das ultimas entradas recebidas
- Toggle para ativar/desativar

---

## Bloco 2 -- Configuracoes Avancadas do CRM

### Pagina de Configuracoes (`/cliente/crm/config`)

Substituir o modal `CrmFunnelManager` por uma pagina completa de configuracoes acessivel pelo icone de engrenagem, com abas:

**Aba Funis:**
- Lista de todos os funis da organizacao (nao so o default)
- Criar novo funil (ex: "Funil Pos-Venda", "Funil Parcerias")
- Editar etapas de cada funil (nome, cor, icone, ordem)
- Marcar qual e o funil padrao
- Excluir funil (se nao tem leads vinculados)

**Aba Equipe:**
- Lista de membros da organizacao (via `organization_memberships` + `profiles`)
- Filtro por role
- Toggle para ativar/desativar membro como "vendedor" no CRM
- Cada membro mostra: nome, cargo, qtd de leads atribuidos

**Aba Atribuicao:**
- Selecionar funil e definir quais membros atuam nele
- Configuracao da roleta (ativa/desativa por funil)
- Ordem de atribuicao da roleta

**Aba SLA e Alertas:**
- Tempo maximo sem primeiro contato (horas)
- Tempo maximo de tarefa aberta (dias)
- Alertas habilitados (toggle)
- Tarefas automaticas ao mover etapa (toggle)

**Aba Integracoes:**
- URL do webhook (gerada automaticamente)
- Instrucoes para Meta Leads, Google Ads, formularios
- Importacao CSV

### Migration necessaria

Nova tabela `crm_settings`:
- `id` uuid PK
- `organization_id` uuid (unique)
- `lead_roulette_enabled` boolean default false
- `roulette_members` jsonb default '[]' (lista de user_ids na roleta)
- `sla_first_contact_hours` int default 24
- `sla_task_open_days` int default 3
- `alerts_enabled` boolean default true
- `auto_tasks_on_stage_move` boolean default true
- `created_at`, `updated_at`
- RLS: membros da org podem SELECT, admins podem ALL

---

## Bloco 3 -- Roleta de Leads

### Como funciona

Quando um novo lead entra (manual, webhook ou importacao), se a roleta esta ativa:
1. Busca a lista de `roulette_members` do `crm_settings`
2. Busca o ultimo lead criado na org e ve qual membro foi atribuido
3. Atribui o proximo membro da lista (round-robin)
4. Salva o `assigned_to` no lead

### Onde aplica
- Na criacao manual de lead (se roleta ativa, preenche `assigned_to` automaticamente)
- No webhook de lead externo
- Na importacao CSV

### Interface
- No header do CRM, mostrar "Roleta: Ativa" ou "Desativada" com badge
- Na configuracao, lista de membros na roleta com drag para reordenar
- Toggle para ativar/desativar

---

## Bloco 4 -- Filtros Detalhados

Expandir a barra de filtros existente:

- **Responsavel** (assigned_to): select com membros da equipe
- **Periodo de criacao**: date range (de/ate)
- **Valor minimo/maximo**: dois inputs numericos
- **Status**: Ativo / Vendido / Perdido (baseado em won_at/lost_at)
- **Funil**: select para filtrar por funil_id (quando tem multiplos funis)
- **Busca avancada**: busca em custom_fields tambem

Layout: barra expansivel com botao "Mais filtros" que abre linha adicional com os filtros avancados.

---

## Bloco 5 -- Automacoes de CRM

### Tabela `crm_automations`
- `id` uuid PK
- `organization_id` uuid
- `name` text
- `trigger_type` text ('stage_change' | 'lead_created' | 'no_contact_sla' | 'task_overdue')
- `trigger_config` jsonb (ex: { from_stage: "novo", to_stage: "contato" })
- `action_type` text ('create_task' | 'send_whatsapp' | 'change_stage' | 'assign_to' | 'add_tag' | 'notify')
- `action_config` jsonb (ex: { task_title: "Fazer follow-up", due_days: 2 })
- `is_active` boolean default true
- `created_at`, `updated_at`
- RLS: membros podem SELECT, admins podem ALL

### Interface de Automacoes

Pagina/aba dentro das configuracoes do CRM:
- Lista de automacoes com toggle ativo/inativo
- Criar nova automacao:
  - Selecionar trigger (Quando...)
  - Selecionar acao (Entao...)
  - Configurar parametros
- Exemplos pre-prontos:
  - "Quando lead entra em Contato, criar tarefa 'Agendar reuniao' em 2 dias"
  - "Quando lead fica 24h sem contato, notificar responsavel"
  - "Quando lead e marcado como Vendido, adicionar tag 'cliente'"

### Motor de automacoes

A execucao acontece em dois pontos:
1. **No frontend** (ao mover lead de etapa): verifica automacoes com trigger `stage_change` e executa acoes simples (criar tarefa, adicionar tag, mudar estagio)
2. **No webhook** (ao receber lead externo): aplica automacoes com trigger `lead_created`

---

## Bloco 6 -- Automacoes IA + CRM

### Automacoes com Agente de IA

Novas opcoes de `action_type` nas automacoes:
- `ai_qualify`: Agente de IA analisa o lead e sugere qualificacao (temperatura)
- `ai_first_contact`: Agente envia mensagem automatica de primeiro contato via WhatsApp
- `ai_followup`: Agente envia follow-up automatico se lead nao responde em X dias

### Interface
- Na lista de automacoes, acoes de IA aparecem com badge "IA"
- Ao selecionar acao de IA, pode escolher qual agente usar
- Preview do prompt que sera usado

### Execucao
- As acoes de IA sao executadas via a edge function `ai-agent-reply` ja existente
- O trigger `no_contact_sla` chama o agente para enviar follow-up
- O trigger `lead_created` pode chamar o agente para primeiro contato

---

## Arquivos a criar/editar

| Acao | Arquivo |
|------|---------|
| Migration | Criar tabela `crm_settings` e `crm_automations` |
| Criar | `supabase/functions/crm-lead-webhook/index.ts` |
| Criar | `src/hooks/useCrmSettings.ts` |
| Criar | `src/hooks/useCrmAutomations.ts` |
| Criar | `src/hooks/useCrmTeam.ts` (buscar membros da org) |
| Criar | `src/components/crm/CrmConfigPage.tsx` (pagina de config completa) |
| Criar | `src/components/crm/CrmAutomations.tsx` |
| Criar | `src/components/crm/CrmCsvImport.tsx` |
| Criar | `src/components/crm/CrmIntegrations.tsx` |
| Criar | `src/components/crm/CrmTeamManager.tsx` |
| Criar | `src/components/crm/CrmRouletteConfig.tsx` |
| Editar | `src/pages/cliente/ClienteCRM.tsx` (filtros avancados, badge roleta, assigned_to nos cards, navegacao para config) |
| Editar | `src/components/crm/CrmLeadDetailSheet.tsx` (campo responsavel, campo funil) |
| Editar | `src/components/crm/CrmNewLeadDialog.tsx` (selecao de funil, aplicar roleta) |
| Editar | `src/hooks/useCrmLeads.ts` (filtros avancados na query) |
| Editar | `supabase/config.toml` (registrar crm-lead-webhook) |
| Editar | Roteamento (adicionar rota /cliente/crm/config) |

---

## Detalhes Tecnicos

- A tabela `crm_leads` ja tem `assigned_to` (uuid), `funnel_id` (uuid) e `custom_fields` (jsonb) -- nao precisa de migration para leads
- Os membros da equipe vem de `organization_memberships` JOIN `profiles` -- nenhuma tabela nova para isso
- A roleta usa round-robin simples baseado no ultimo lead atribuido
- O webhook `crm-lead-webhook` usa `SUPABASE_SERVICE_ROLE_KEY` (nao precisa de auth do usuario)
- Automacoes simples (criar tarefa, adicionar tag) rodam no frontend; automacoes de IA chamam edge functions
- A deduplicacao no webhook compara `phone` e `email` na mesma `organization_id`
- Cada organizacao pode ter multiplos funis, cada funil com suas etapas independentes
- O seletor de funil no header do CRM permite alternar entre funis (filtro por `funnel_id`)

## Ordem de implementacao sugerida

1. Migration (crm_settings + crm_automations)
2. Hooks (useCrmSettings, useCrmTeam, useCrmAutomations)
3. Edge function crm-lead-webhook
4. Pagina de configuracoes (funis, equipe, roleta, SLA, integracoes)
5. Filtros avancados no CRM principal
6. Roleta de leads (logica + UI)
7. Automacoes de CRM
8. Automacoes IA + CRM
9. Importacao CSV
