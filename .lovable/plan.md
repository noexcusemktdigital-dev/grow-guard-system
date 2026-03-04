

# Bloco 2: CRM + Conversas

## Escopo
Quatro melhorias interligadas: (A) valores agregados por etapa no Kanban, (B) tutorial pop-up passo a passo com recomendacoes do plano de vendas, (C) automacoes mais dinamicas e fluidas, (D) chat espelhando WhatsApp com organizacao por grupos, leads e responsaveis.

---

## A. Valores por Etapa no CRM Kanban

### Situacao Atual
O header de cada coluna Kanban mostra apenas o nome da etapa e a contagem de leads. O valor (`lead.value`) aparece no card individual mas nao ha soma por coluna.

### Alteracoes
- Adicionar soma de valores por etapa no header de cada coluna Kanban (`ClienteCRM.tsx`)
- Mostrar `R$ X.XXX` abaixo do badge de contagem
- Adicionar barra de progresso visual por etapa (% do total do funil)
- No topo do pipeline, mostrar um resumo: total de leads, valor total, valor medio, taxa de conversao

### Arquivos
| Arquivo | Acao |
|---------|------|
| `src/pages/cliente/ClienteCRM.tsx` | Adicionar sumario de pipeline + valores por coluna |

---

## B. Tutorial Pop-up Passo a Passo

### Situacao Atual
Nao existe tutorial. O CRM abre direto sem orientacao.

### Alteracoes
- Criar componente `CrmTutorial.tsx` — modal/overlay multi-step que guia o usuario
- Steps: (1) Entenda seu funil, (2) Crie seu primeiro lead, (3) Configure automacoes, (4) Use a Roleta, (5) Acompanhe metricas
- Cada step tem titulo, descricao, e **recomendacoes personalizadas** baseadas no `sales_plans.answers`:
  - Segmento da empresa → sugere automacoes especificas
  - Ticket medio → sugere configuracao de valor por lead
  - Diferenciais → sugere tags e qualificacao
- Flag `crm_tutorial_seen` em `localStorage` para nao repetir (com botao para reabrir)
- Trigger automatico na primeira visita ao CRM

### Arquivos
| Arquivo | Acao |
|---------|------|
| `src/components/crm/CrmTutorial.tsx` | CRIAR — tutorial multi-step com recomendacoes |
| `src/pages/cliente/ClienteCRM.tsx` | Integrar tutorial na primeira visita |

---

## C. Automacoes Mais Dinamicas

### Situacao Atual
Automacoes funcionam mas sao estaticas — o usuario cria regras manualmente sem orientacao. A UI e funcional mas nao explica o impacto.

### Alteracoes
- Adicionar secao "Automacoes Recomendadas" no topo de `CrmAutomations.tsx`
  - Baseadas no `sales_plans.answers` (segmento, ticket, ciclo de venda)
  - Cada recomendacao tem botao "Ativar" que pre-preenche a automacao
  - Exemplos: "Follow-up 24h para leads de Ads", "Notificar quando lead quente parado 3 dias"
- Adicionar descricao visual ao criar/editar automacao:
  - Preview em linguagem natural: "Quando um lead e criado via Ads → Criar tarefa de follow-up em 1 dia"
  - Animacao de fluxo simples (trigger → acao) com icones
- Adicionar contadores de execucao por automacao (quantas vezes disparou)

### Arquivos
| Arquivo | Acao |
|---------|------|
| `src/components/crm/CrmAutomations.tsx` | Recomendacoes + preview visual + contadores |

---

## D. Chat Espelhando WhatsApp

### Situacao Atual
O chat ja tem visual WhatsApp (bubbles verdes, header escuro, date separators). Porem falta:
- Organizacao por responsavel/atribuido
- Filtro por lead vinculado mais visivel
- Status de digitando/online
- Reacoes ou resposta rapida
- Busca dentro de mensagens

### Alteracoes

**1. Sidebar de contatos melhorada**
- Adicionar filtro por responsavel (quem esta atendendo)
- Secao "Meus contatos" vs "Todos" baseado no usuario logado
- Preview de ultima mensagem ja existe — melhorar com indicador de "digitando..."
- Adicionar busca de mensagens (busca dentro do historico, nao so pelo nome)

**2. Area de conversa aprimorada**
- Adicionar campo de resposta rapida (templates salvos)
- Adicionar botao de emoji picker basico
- Melhorar header: foto maior, status online/offline, info do lead em destaque
- Adicionar area de informacoes do lead no painel lateral direito (mini-CRM sidebar)
- Responder mensagem especifica (quote/reply)

**3. Organizacao**
- Separar contatos por: "Leads", "Grupos", "Site", "Sem vinculo"
- Mostrar responsavel atribuido em cada contato na lista
- Permitir transferir conversa para outro membro da equipe

### Arquivos
| Arquivo | Acao |
|---------|------|
| `src/pages/cliente/ClienteChat.tsx` | Layout com painel lateral de info do lead |
| `src/components/cliente/ChatContactList.tsx` | Filtro por responsavel, secao Meus/Todos, busca em mensagens |
| `src/components/cliente/ChatConversation.tsx` | Reply, emoji, templates rapidos, painel lead |
| `src/components/cliente/ChatContactItem.tsx` | Mostrar responsavel, melhorar visual |
| `src/components/cliente/ChatLeadPanel.tsx` | CRIAR — painel lateral com info do lead (mini-CRM) |
| `src/components/cliente/ChatQuickReplies.tsx` | CRIAR — templates de resposta rapida |

---

## Resumo de Arquivos

| Arquivo | Acao |
|---------|------|
| `src/pages/cliente/ClienteCRM.tsx` | Valores por etapa + sumario + tutorial trigger |
| `src/components/crm/CrmTutorial.tsx` | CRIAR — tutorial pop-up multi-step |
| `src/components/crm/CrmAutomations.tsx` | Recomendacoes + preview visual |
| `src/pages/cliente/ClienteChat.tsx` | Layout 3 colunas com painel lead |
| `src/components/cliente/ChatContactList.tsx` | Filtros avancados + secoes |
| `src/components/cliente/ChatConversation.tsx` | Reply + emoji + templates |
| `src/components/cliente/ChatContactItem.tsx` | Visual melhorado |
| `src/components/cliente/ChatLeadPanel.tsx` | CRIAR — painel lateral mini-CRM |
| `src/components/cliente/ChatQuickReplies.tsx` | CRIAR — templates rapidos |

Nenhuma migracao de banco necessaria — todos os dados ja existem nas tabelas atuais.

