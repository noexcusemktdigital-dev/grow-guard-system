

# CRM Expansao -- Modulo Completo com Kanban, Lista e Detalhe

## Resumo

Criar o modulo "CRM Expansao" dentro da secao Rede do sidebar. O CRM possui dois funis (Franquia e Clientes), visualizacao Kanban e Lista, pagina de detalhe do lead com 5 abas (Dados, Atividades, Tarefas, Arquivos, Propostas), sistema de conversao integrado a Unidades e Contratos, importacao CSV (placeholder), alertas inteligentes e configuracoes admin.

---

## Arquitetura de Arquivos

```text
CRIAR:
src/data/crmData.ts                         -- tipos, interfaces, mock data, helpers
src/pages/CrmExpansao.tsx                   -- pagina principal com Kanban/Lista/Detalhe
src/components/crm/CrmKanban.tsx            -- visualizacao Kanban com drag simulado
src/components/crm/CrmList.tsx              -- visualizacao Lista (tabela)
src/components/crm/CrmLeadDetail.tsx        -- pagina detalhe do lead (5 abas)
src/components/crm/CrmAlerts.tsx            -- alertas inteligentes no topo
src/components/crm/CrmConfig.tsx            -- configuracoes admin (etapas, origens, SLA)

MODIFICAR:
src/components/FranqueadoraSidebar.tsx       -- remover disabled do "CRM Expansao"
src/App.tsx                                 -- adicionar rota /franqueadora/crm
```

---

## 1. Dados (`src/data/crmData.ts`)

### Tipos Principais

```text
FunnelType = "franchise" | "clients"

FranchiseFunnelStage = "Novo Lead" | "Primeiro Contato" | "Follow-up" |
  "Apresentacao da Franquia" | "Liberacao de COF e Minuta" |
  "Apresentacao de Projecao" | "Proposta" | "Venda" | "Oportunidade Perdida"

ClientFunnelStage = "Novo Lead" | "Primeiro Contato" | "Follow-up" |
  "Diagnostico" | "Apresentacao de Estrategia" | "Proposta" |
  "Venda" | "Oportunidade Perdida"

LeadTemperature = "Frio" | "Morno" | "Quente"
LeadOrigin = "Meta Leads" | "Formulario" | "WhatsApp" | "Indicacao" | "Organico" | "Eventos"
LeadStatus = "Ativo" | "Perdido" | "Vendido"
ContactStatus = "Sem contato" | "Em andamento" | "Sem resposta"

Lead:
  id, nome, telefone, whatsapp, email,
  cidade, uf, funnel (FunnelType), stage (string),
  origin (LeadOrigin), responsavel, temperature (LeadTemperature),
  contactStatus (ContactStatus), leadStatus (LeadStatus),
  tags (string[]), observacoes, valorPotencial?,
  criadoEm, atualizadoEm,
  -- Campos Franquia:
  perfil? ("investidor" | "operador"), capitalDisponivel?,
  prazoDecisao?, cidadeInteresse?,
  -- Campos Clientes:
  empresa?, segmento?, ticketPotencial?, dorPrincipal?

Activity:
  id, leadId, tipo ("ligacao" | "whatsapp" | "reuniao" | "email"),
  dataHora, resultado, proximoPasso, anexo?

Task:
  id, leadId, descricao, dataHora, status ("Aberta" | "Concluida" | "Atrasada"),
  responsavel

LeadFile:
  id, leadId, nome, tipo, data

LeadProposal:
  id, leadId, valor, status ("rascunho" | "enviada" | "aceita")
```

### Mock Data

- 8-10 leads distribuidos entre os dois funis (Franquia: 4-5, Clientes: 4-5)
- Leads em etapas variadas para preencher o Kanban
- 2-3 leads com temperatura "Quente" e tarefas vencidas (para alertas)
- 1 lead com status "Vendido", 1 "Perdido"
- Atividades mock (3-4 registros para leads variados)
- Tarefas mock (4-5 incluindo atrasadas)
- 1-2 arquivos mock e 1 proposta mock
- Responsaveis: "Davi", "Gabriel", "Victor"
- Origens variadas: Meta Leads, Indicacao, Organico, WhatsApp

### Helpers

- `getLeadsByFunnel(funnel)` -- filtra leads por funil
- `getLeadsByStage(funnel, stage)` -- filtra por funil e etapa
- `getActivitiesForLead(leadId)` -- atividades do lead
- `getTasksForLead(leadId)` -- tarefas do lead
- `getFilesForLead(leadId)` -- arquivos do lead
- `getProposalsForLead(leadId)` -- propostas do lead
- `getAlerts()` -- retorna leads sem contato ha 24h, tarefas vencidas, quentes parados
- `FRANCHISE_STAGES` e `CLIENT_STAGES` -- arrays de etapas por funil

---

## 2. Pagina Principal (`src/pages/CrmExpansao.tsx`)

### Navegacao via state

- State `view`: "kanban" | "list" | "detail" | "config"
- State `selectedLeadId`: null ou id
- State `activeFunnel`: "franchise" | "clients"

### Header

- Titulo "CRM Expansao" com icone TrendingUp
- Badge "Franqueadora"
- Subtitulo: "Gestao de leads e oportunidades da rede"

### Barra de Controles (topo)

- Seletor de funil: "Franquia" | "Clientes" (pills/tabs visuais)
- Toggle de visualizacao: Kanban | Lista
- Botao "Configuracoes" (abre view config)
- Botao "+ Novo Lead" (Dialog)
- Botao "Importar CSV" (placeholder -- toast informativo)

### Filtros (chips inline, padrao do projeto)

- Responsavel (Select)
- Origem (Select)
- Temperatura (Select: Frio/Morno/Quente)
- Cidade/UF (Input)
- Status de contato (Select)
- Busca por nome/telefone/email (Input)
- Botao limpar filtros

### Alertas

Componente `CrmAlerts` no topo com cards:
- Leads sem 1o contato ha 24h (badge vermelho)
- Leads com tarefa vencida (badge laranja)
- Leads quentes parados ha 3+ dias (badge amarelo)
- Taxa de conversao do mes (badge azul)

---

## 3. Kanban (`src/components/crm/CrmKanban.tsx`)

### Layout

Colunas horizontais, uma por etapa do funil selecionado.
Scroll horizontal para funis com muitas etapas (9 para Franquia, 8 para Clientes).

### Header da Coluna

- Nome da etapa
- Contagem de cards
- Cor diferente para "Venda" (verde) e "Oportunidade Perdida" (vermelho)

### Cards

Cada card exibe:
- Nome do lead (bold)
- Cidade/UF (text muted)
- Badge de origem (cor por tipo)
- Responsavel
- Badge de temperatura (Frio=azul, Morno=amarelo, Quente=vermelho)
- Proxima tarefa (data, se existir)
- Valor potencial (se preenchido)
- Tag "Atrasado" se tarefa vencida (badge vermelho)

### Acoes no Card

Botoes discretos (hover):
- "Abrir" -- seta view para detail
- "Mover >" -- Select inline para mudar etapa (simula drag-and-drop)
- "Marcar Perdido" -- muda status
- "Converter (Venda)" -- fluxo de conversao

### Interacao

Clicar no card abre o detalhe do lead.

---

## 4. Lista (`src/components/crm/CrmList.tsx`)

### Tabela

Colunas:
- Lead (nome)
- Funil
- Etapa (badge)
- Responsavel
- Origem (badge)
- Cidade/UF
- Temperatura (badge colorido)
- Ultimo contato (data)
- Proxima tarefa (data)
- Status (Ativo/Perdido/Vendido)
- Acoes: Editar, Mover etapa, Abrir detalhe

---

## 5. Detalhe do Lead (`src/components/crm/CrmLeadDetail.tsx`)

### Header do Lead

- Nome grande
- Badges: funil, etapa, temperatura, status
- Botoes: Voltar, Editar dados, Mover etapa, Registrar contato, Converter

### 5 Abas (Tabs shadcn)

#### Aba A -- Dados

Formulario editavel:
- Campos comuns: Nome, Telefone/WhatsApp, Email, Cidade/UF, Funil, Etapa, Origem, Responsavel, Temperatura, Observacoes, Tags
- Campos condicionais Franquia: Perfil, Capital disponivel, Prazo decisao, Cidade de interesse
- Campos condicionais Clientes: Empresa, Segmento, Ticket potencial, Dor principal
- Botao Salvar

#### Aba B -- Atividades (Timeline)

- Lista cronologica reversa
- Cada registro: icone por tipo (Phone, MessageSquare, Video, Mail), data/hora, resultado, proximo passo
- Botao "+ Registrar Atividade" (Dialog): Tipo (Select), Data/hora, Resultado (Textarea), Proximo passo (Input)

#### Aba C -- Tarefas

- Lista de tarefas com: descricao, data/hora, responsavel, status (badge)
- Tarefas atrasadas destacadas em vermelho
- Botao "+ Nova Tarefa" (Dialog): Descricao, Data/hora, Responsavel
- Checkbox para marcar como concluida

#### Aba D -- Arquivos

- Lista: nome, tipo, data
- Botao "+ Anexar Arquivo" (Dialog com input file simulado)

#### Aba E -- Propostas

- Lista: valor, status (badge)
- Botao "+ Nova Proposta" (Dialog): Valor, Status
- Placeholder para link com calculadora/gerador de contratos

---

## 6. Fluxo de Conversao (Venda)

### Funil Franquia

Ao marcar "Venda":
1. Muda leadStatus para "Vendido"
2. Muda stage para "Venda"
3. Dialog de confirmacao com checklist:
   - Criar Unidade no modulo Unidades (placeholder -- toast)
   - Criar Contrato de Franquia no modulo Contratos (placeholder -- toast)
   - Criar tarefa "Iniciar Onboarding" (placeholder)
4. Toast de sucesso com resumo

### Funil Clientes

Ao marcar "Venda":
1. Muda leadStatus para "Vendido"
2. Muda stage para "Venda"
3. Dialog de confirmacao:
   - Criar Cliente em Receitas (placeholder -- toast)
   - Criar Contrato de Cliente (placeholder -- toast)
   - Criar tarefa "Criar cobranca no Asaas" (placeholder)

---

## 7. Dialog Novo Lead

Formulario completo:
- Nome, Telefone, WhatsApp, Email, Cidade, UF
- Funil (Select: Franquia/Clientes)
- Origem (Select com opcoes)
- Responsavel (Select)
- Temperatura (Select: Frio/Morno/Quente)
- Observacoes
- Campos condicionais por funil (como na aba Dados)
- Etapa default: "Novo Lead"

---

## 8. Alertas Inteligentes (`src/components/crm/CrmAlerts.tsx`)

Cards no topo do CRM:
- Leads sem 1o contato ha 24h (count + cor vermelha)
- Tarefas vencidas (count + cor laranja)
- Leads quentes parados ha 3+ dias (count + cor amarela)
- Taxa conversao do mes (% + cor azul)
- Tempo medio por etapa (dias + cor cinza)

---

## 9. Configuracoes (`src/components/crm/CrmConfig.tsx`)

### Etapas por Funil

Lista editavel de etapas para cada funil (reordenar, renomear -- placeholder visual)

### Origens de Lead

Lista de origens configuradas

### Responsaveis

Lista de responsaveis disponiveis

### Regras de SLA

- Tempo maximo sem contato (horas)
- Tempo maximo tarefa aberta (dias)
- Toggles para alertas

### Integracoes (Placeholder)

- Meta Leads API (campo URL + token -- placeholder)
- Webhook URL para formularios (exibir URL ficticia)
- CSV Import: area de upload simulado

---

## 10. Design e Visual

### Cores por contexto

- Temperatura: Frio=blue, Morno=amber, Quente=red
- Status: Ativo=green, Perdido=red, Vendido=emerald
- Funil: Franquia=purple, Clientes=blue
- Etapas: gradiente de cinza a verde (Novo Lead ate Venda)
- Oportunidade Perdida: vermelho

### Efeitos

- Cards Kanban com hover elevacao + sombra
- Badges coloridos por tipo
- Timeline de atividades com linha conectora vertical
- Alertas com icone + pulse se critico
- Transicao fade-in entre views
- Filtros como chips clean com X para remover

---

## 11. Sidebar e Rotas

### FranqueadoraSidebar.tsx

Na secao `redeSection`, remover `disabled: true` do item "CRM Expansao":
```text
{ label: "CRM Expansão", icon: TrendingUp, path: "/franqueadora/crm" }
```

### App.tsx

Adicionar rota:
```text
<Route path="crm" element={<CrmExpansao />} />
```

---

## 12. Ordem de Implementacao

1. `crmData.ts` -- tipos, etapas por funil, mock leads (8-10), atividades, tarefas, arquivos, propostas, helpers
2. `CrmAlerts.tsx` -- cards de alertas inteligentes
3. `CrmKanban.tsx` -- visualizacao Kanban com cards e acoes
4. `CrmList.tsx` -- visualizacao Lista (tabela)
5. `CrmLeadDetail.tsx` -- detalhe do lead com 5 abas e fluxo de conversao
6. `CrmConfig.tsx` -- configuracoes admin
7. `CrmExpansao.tsx` -- pagina hub com header, filtros, seletor funil, views
8. `FranqueadoraSidebar.tsx` + `App.tsx` -- ativar menu e rota

