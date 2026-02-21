

# Modulo Comercial 360 -- Integracao Completa

## Resumo

Transformar os 7 modulos do pilar Vendas (CRM, Chat, Agentes IA, Plano de Vendas, Scripts, Disparos, Relatorios) em um sistema integrado e coeso. Atualmente cada modulo funciona isoladamente com dados desconectados. A proposta e criar referencias cruzadas de dados, enriquecer o CRM como nucleo central, preparar Disparos para WhatsApp/Z-API, conectar Scripts ao Plano de Vendas e adicionar metricas de IA/WhatsApp aos Relatorios.

---

## Estado Atual vs Desejado

| Modulo | Hoje | Desejado |
|--------|------|----------|
| CRM | Kanban basico, detalhe simples | Detalhe rico com historico WhatsApp, diagnostico, proposta, timeline, tags, origem |
| Chat | 3 colunas funcionando | Botao "Criar Lead" funcional que adiciona ao CRM, referencia bidirecional |
| Agentes IA | Cards + config + teste | Regras de acionamento por etapa do funil, metricas vindas do Chat |
| Plano de Vendas | 6 abas completas | Sem mudanca (ja esta robusto) -- apenas referenciado pelos outros modulos |
| Scripts | Lista simples com 4 categorias | Categorias alinhadas ao funil (Prospeccao, Diagnostico, Fechamento, Objecoes), badge "Usado pela IA" |
| Disparos | Lista de emails generica | Reposicionar para WhatsApp via Z-API, segmentacao por tag CRM, campanhas, follow-ups |
| Relatorios | Graficos basicos de vendas | Adicionar aba WhatsApp/IA com metricas de conversas, taxa resposta IA, tempo medio |

---

## 1. CRM -- Detalhe Enriquecido do Lead

O detalhe do lead (ao clicar no card) sera expandido de um card simples para uma pagina completa com abas:

**Aba Resumo:**
- Dados do lead (nome, telefone, email, valor, temperatura)
- Etapa atual do funil com badge colorido
- Responsavel
- Origem (Google Ads, Instagram, WhatsApp, Indicacao, Site)
- Tags editaveis (Lead Quente, Decisor, Orcamento Alto)
- Data de criacao + ultima interacao

**Aba Historico:**
- Timeline de atividades (mensagens, mudancas de etapa, notas)
- Cada entrada com icone, timestamp e descricao
- Formato visual: linha vertical com pontos coloridos

**Aba WhatsApp:**
- Ultimas mensagens do chat vinculado (referencia aos dados do Chat)
- Se vinculado: mostra preview das mensagens
- Se nao vinculado: botao "Vincular conversa"
- Indicador se foi atendido por IA ou humano

**Aba Notas:**
- Textarea para notas livres
- Historico de notas salvas com data

**Aba Tarefas:**
- Lista de tarefas vinculadas ao lead
- Botao adicionar tarefa
- Status: Pendente, Feita, Atrasada

Campos adicionais no tipo CrmLead:
- origin: string (canal de aquisicao)
- tags: string[]
- diagnosticoDone: boolean
- propostaEnviada: boolean
- propostaAceita: boolean
- lastInteraction: string
- linkedConversationId: string | null
- timeline: TimelineEntry[]
- tasks: LeadTask[]
- notes: LeadNote[]

---

## 2. Disparos -- Reposicionar para WhatsApp Z-API

Reformular completamente o modulo Disparos:

**Header:** "Disparos WhatsApp" com badge "Z-API"

**KPIs no topo:**
- Mensagens enviadas hoje
- Taxa de entrega
- Taxa de resposta
- Campanhas ativas

**Novo formulario de disparo:**
- Tipo: Mensagem unica / Campanha / Follow-up automatico
- Segmentacao: por tag CRM (multi-select com tags do CRM)
- Filtro por etapa do funil
- Filtro por temperatura
- Conta WhatsApp de envio (select com contas conectadas)
- Mensagem com preview

**Lista de disparos com colunas:**
- Nome/assunto
- Tipo (WhatsApp)
- Segmento (tags)
- Destinatarios
- Status (Enviado, Agendado, Rascunho, Em andamento)
- Taxa entrega / Taxa resposta
- Data

**Secao Follow-ups automaticos:**
- Regras configuráveis: "Se lead nao respondeu em X dias, enviar mensagem Y"
- Lista de follow-ups ativos

---

## 3. Scripts -- Alinhados ao Funil + IA

Reestruturar categorias e adicionar conexao com IA:

**Novas categorias (alinhadas ao funil):**
- Prospeccao (abordagem inicial)
- Diagnostico (perguntas de qualificacao)
- Fechamento (proposta e negociacao)
- Quebra de Objecoes (respostas para objecoes comuns)

**Cada script ganha:**
- Badge "Usado pela IA" se vinculado a um agente
- Badge da etapa do funil correspondente
- Botao "Enviar para Agente IA" (vincula script como instrucao do agente)
- Contagem de uso (quantas vezes foi copiado/usado)

**Secao "Gerar Script com IA":**
- Collapsible no topo
- Inputs: etapa do funil, tom de voz, objetivo
- Botao "Gerar" (mock -- gera template pre-definido baseado nos inputs)
- Resultado editavel

---

## 4. Relatorios -- Adicionar metricas WhatsApp/IA

Adicionar aba ou secao dedicada:

**Novas metricas:**
- Conversas WhatsApp (total, por periodo)
- Taxa de resposta por canal
- Performance da IA (conversas resolvidas, taxa resolucao, tempo medio)
- Conversao por etapa do funil (funil visual)
- ROI comercial (receita / investimento em ads)
- Tempo medio de resposta (humano vs IA)

**Novos graficos:**
- BarChart: Conversas por status (IA, Humano, Encerrado)
- LineChart: Taxa de resposta ao longo do tempo
- PieChart: Distribuicao de leads por origem

---

## 5. Agentes IA -- Regras de Acionamento

Adicionar secao de regras no dialog de configuracao:

**Regras configuráveis:**
- "Se lead na etapa [select etapa] -> acionar este agente"
- "Se tag = [select tag] -> acionar este agente"
- "Se horario fora do expediente -> acionar este agente"

Interface: lista de regras com botao adicionar, cada regra com condicao + acao.

---

## Secao Tecnica

### Arquivos modificados

```
src/data/clienteData.ts              -- Expandir CrmLead com campos novos, novos mocks para disparos WhatsApp, scripts alinhados ao funil, dados de relatorio expandidos
src/pages/cliente/ClienteCRM.tsx     -- Detalhe do lead com abas (Resumo, Historico, WhatsApp, Notas, Tarefas)
src/pages/cliente/ClienteDisparos.tsx -- Reescrever como hub de disparos WhatsApp com segmentacao CRM
src/pages/cliente/ClienteScripts.tsx  -- Novas categorias, badges IA, secao gerar script
src/pages/cliente/ClienteRelatorios.tsx -- Adicionar metricas WhatsApp/IA com novos graficos
src/pages/cliente/ClienteAgentesIA.tsx -- Adicionar regras de acionamento no dialog de config
```

### Novos tipos

```typescript
interface TimelineEntry {
  id: string;
  type: "message" | "stage_change" | "note" | "task" | "call";
  description: string;
  date: string;
  icon: string;
}

interface LeadTask {
  id: string;
  title: string;
  status: "pendente" | "feita" | "atrasada";
  dueDate: string;
}

interface LeadNote {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

// CrmLead expandido
interface CrmLead {
  // ... campos existentes ...
  origin: string;
  tags: string[];
  diagnosticoDone: boolean;
  propostaEnviada: boolean;
  propostaAceita: boolean;
  lastInteraction: string;
  linkedConversationId: string | null;
  timeline: TimelineEntry[];
  tasks: LeadTask[];
  notes: LeadNote[];
}

// Disparo WhatsApp
interface WhatsAppDisparo {
  id: string;
  type: "unica" | "campanha" | "followup";
  name: string;
  segment: string[];
  funnelStage: string | null;
  temperature: string | null;
  accountId: string;
  message: string;
  recipients: number;
  status: "enviado" | "agendado" | "rascunho" | "andamento";
  deliveryRate?: number;
  responseRate?: number;
  sentAt?: string;
  scheduledAt?: string;
}

// Regra de acionamento IA
interface IARule {
  id: string;
  condition: "stage" | "tag" | "offhours";
  value: string;
  action: string;
}
```

### Ordem de implementacao

Devido ao tamanho, dividir em 2 etapas:

**Etapa 1 (esta implementacao):**
1. Expandir `clienteData.ts` com todos os novos tipos e dados mock
2. Reescrever CRM com detalhe enriquecido (abas)
3. Reescrever Disparos como hub WhatsApp

**Etapa 2 (proxima implementacao):**
4. Reestruturar Scripts com categorias do funil + geracao IA
5. Expandir Relatorios com metricas WhatsApp/IA
6. Adicionar regras de acionamento nos Agentes IA

### Dependencias

Nenhuma nova -- todas as libs necessarias ja estao instaladas (recharts, dnd-kit, radix components).

