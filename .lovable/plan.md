

# CRM Final: Filtros, Contatos, Equipe, SLA, Automacoes e Integracoes com Make/Zapier

## Resumo

Plano consolidado com todas as melhorias pendentes: filtros unificados com datas e responsaveis, base de contatos completa, gestao de times, SLA com minutos/horas, automacoes avancadas vinculadas a funis e equipes, limite de funis por plano, e integracoes com plataformas de automacao externas (Make, Zapier, n8n).

---

## 1. Filtros Unificados em Painel Unico

Substituir os filtros separados (barra + "Mais filtros") em `ClienteCRM.tsx` por um unico botao **"Filtros"** que abre um Popover com todos os filtros organizados:

- Busca por texto (continua visivel fora do painel)
- **Responsavel** (assigned_to) -- select com membros da equipe
- **Periodo de criacao** (data de / data ate) -- usando inputs date
- Origem (source)
- Tags
- Status (Ativo / Vendido / Perdido)
- Valor minimo / maximo
- Funil (quando ha multiplos)
- Badge mostrando quantos filtros estao ativos
- Botao "Limpar tudo"

---

## 2. Base de Contatos Completa

### Nova tabela `crm_contacts`
- `id`, `organization_id`, `name`, `email`, `phone`, `company`, `position`, `notes`, `tags`, `source`, `custom_fields`, `created_at`, `updated_at`
- RLS: membros podem SELECT/INSERT/UPDATE, admins podem DELETE

### Coluna `contact_id` em `crm_leads`
- Nullable, vincula lead a um contato existente

### Pagina `/cliente/contatos`
- Tabela com busca e filtro por tags
- Botao "+ Novo Contato" com dialog
- Edicao via Sheet lateral
- Importacao CSV de contatos
- Botao "Criar Lead" a partir de um contato (pre-preenche dados)
- Contagem de leads vinculados por contato

### Sidebar
- Adicionar item "Contatos" na secao Vendas, abaixo de "CRM", com icone `Users`

### Dialog de Novo Lead
- Adicionar campo Combobox "Contato" que busca na tabela `crm_contacts`
- Ao selecionar, preenche nome, telefone, email, empresa automaticamente
- Campo opcional

---

## 3. Integracoes com Plataformas (Make, Zapier, n8n)

### Na aba Integracoes (`CrmIntegrations.tsx`)

Adicionar uma nova secao **"Plataformas de Automacao"** com cards para:

**Make (Integromat)**
- Campo para o usuario colar a URL do webhook do Make
- Botao "Testar conexao" que envia um payload de teste
- Instrucoes de como configurar o cenario no Make
- Eventos disponiveis: novo lead criado, lead mudou de etapa, lead vendido/perdido

**Zapier**
- Campo para URL do webhook do Zapier
- Botao "Testar" (usando `mode: "no-cors"`)
- Instrucoes de como criar o Zap

**n8n**
- Campo para URL do webhook do n8n
- Botao "Testar conexao"
- Instrucoes basicas

**Webhook Generico**
- Campo para qualquer URL de webhook
- Selecao de quais eventos disparar (checkboxes)
- Headers customizados (opcional)

### Como funciona

Os webhooks sao salvos na tabela `crm_settings` em um campo `outbound_webhooks` (jsonb array):
```json
[
  { "name": "Make", "url": "https://hook.make.com/...", "events": ["lead_created", "stage_changed", "lead_won", "lead_lost"], "active": true },
  { "name": "Zapier", "url": "https://hooks.zapier.com/...", "events": ["lead_created"], "active": true }
]
```

Quando um evento acontece (criar lead, mover etapa, etc.), o frontend dispara os webhooks ativos correspondentes com o payload do lead.

### Migration necessaria
- Adicionar coluna `outbound_webhooks` (jsonb default '[]') na tabela `crm_settings`

---

## 4. Funis com Limite por Plano

No `CrmFunnelManager.tsx`:
- Consultar `useClienteSubscription` para verificar o plano
- Plano basico: maximo 2 funis; planos superiores: sem limite
- Se atingiu o limite, desabilitar botao "Criar novo funil" com mensagem de upgrade
- Listar todos os funis (nao so o default)
- Criar novos funis com nome e descricao
- Marcar funil como padrao
- Excluir funil (se nao tem leads vinculados)

---

## 5. Gestao de Equipe com Times

### Nova tabela `crm_teams`
- `id`, `organization_id`, `name`, `description`, `members` (jsonb -- lista de user_ids), `funnel_ids` (jsonb -- funis vinculados), `created_at`, `updated_at`
- RLS: membros podem SELECT, admins podem ALL

### `CrmTeamManager.tsx` reescrito:
- Duas abas: "Times" e "Membros"
- **Times:** Criar/editar/excluir times, atribuir membros, vincular a funis
- **Membros:** Lista de membros da org com cargo, toggle para ativar como vendedor, contagem de leads

---

## 6. SLA com Minutos/Horas e Mais Opcoes

### Migration
- Adicionar `sla_first_contact_minutes` (int default 1440), `sla_no_response_minutes` (int default 4320), `sla_stage_stuck_days` (int default 7) na tabela `crm_settings`

### `CrmSlaConfig.tsx` reescrito:
- Tempo maximo para 1o contato: input numerico + select "minutos" ou "horas"
- Tempo maximo sem resposta do lead
- Tempo maximo de lead na mesma etapa (dias)
- Frequencia de follow-up automatico
- Cada SLA com toggle individual para ativar/desativar
- Salva internamente em minutos

---

## 7. Automacoes Completas

### Migration
- Adicionar colunas em `crm_automations`: `description`, `funnel_ids` (jsonb default '[]'), `team_ids` (jsonb default '[]'), `assigned_user_ids` (jsonb default '[]'), `priority` (int default 0)

### `CrmAutomations.tsx` reescrito com:

**Mais triggers:**
- Mudanca de etapa (de X para Y)
- Lead criado (filtro por origem)
- Sem contato (SLA)
- Tarefa atrasada
- Lead parado na etapa (X dias)
- Lead vendido
- Lead perdido
- Tag adicionada

**Mais acoes:**
- Criar tarefa (titulo, prazo, prioridade)
- Adicionar/remover tag
- Mudar etapa
- Notificar responsavel
- Enviar WhatsApp
- Atribuir a pessoa/time
- Mover para outro funil
- IA: Qualificar lead
- IA: Primeiro contato
- IA: Follow-up

**Vinculo a funis e equipes:**
- Cada automacao pode ser vinculada a um ou mais funis (ou "todos")
- Vinculada a times ou pessoas especificas
- Filtro por funil na lista

**Dialog de criacao expandido:**
1. Nome e descricao
2. Trigger com configs condicionais
3. Escopo: selecao de funis e equipes
4. Acao com configs condicionais
5. Prioridade

---

## Arquivos a criar/editar

| Acao | Arquivo |
|------|---------|
| Migration | Criar `crm_contacts`, `crm_teams`; alterar `crm_settings` e `crm_automations`; adicionar `contact_id` em `crm_leads` |
| Criar | `src/hooks/useCrmContacts.ts` |
| Criar | `src/pages/cliente/ClienteContatos.tsx` |
| Reescrever | `src/pages/cliente/ClienteCRM.tsx` (filtros unificados) |
| Reescrever | `src/components/crm/CrmAutomations.tsx` (completo) |
| Reescrever | `src/components/crm/CrmTeamManager.tsx` (times + membros) |
| Reescrever | `src/components/crm/CrmSlaConfig.tsx` (minutos/horas) |
| Reescrever | `src/components/crm/CrmIntegrations.tsx` (Make/Zapier/n8n) |
| Editar | `src/components/crm/CrmFunnelManager.tsx` (multi-funil + limite plano) |
| Editar | `src/components/crm/CrmNewLeadDialog.tsx` (select contato) |
| Editar | `src/components/crm/CrmLeadDetailSheet.tsx` (contato vinculado) |
| Editar | `src/components/ClienteSidebar.tsx` (item Contatos) |
| Editar | `src/App.tsx` (rota /cliente/contatos) |
| Editar | `src/hooks/useCrmTeam.ts` (CRUD de times) |
| Editar | `src/hooks/useCrmAutomations.ts` (novos campos) |

## Detalhes Tecnicos

- Contatos sao independentes de `whatsapp_contacts` -- bases separadas
- `contact_id` em `crm_leads` e nullable para compatibilidade
- Webhooks outbound (Make/Zapier) sao disparados no frontend via `fetch` com `mode: "no-cors"` para Zapier e POST normal para Make/n8n
- A deduplicacao do Combobox de contatos usa busca por nome/telefone/email com debounce
- O limite de funis por plano usa `useClienteSubscription` -- campo `plan` da subscription
- SLA armazenado em minutos; UI converte para minutos ou horas conforme selecao
- Automacoes com `funnel_ids = []` significam "todos os funis"
- RLS segue padrao multi-tenant com `is_member_of_org`

