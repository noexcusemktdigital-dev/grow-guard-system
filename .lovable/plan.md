

# Modulo Atendimento -- Sistema de Chamados + Chat Interno

## Resumo

Criar o modulo "Atendimento" dentro da secao Rede do sidebar. Sistema completo de chamados para suporte ao franqueado com Kanban e Lista, pagina de detalhe com chat estilo WhatsApp, SLA automatico por prioridade, categorias editaveis e historico completo.

---

## Arquivos

```text
CRIAR:
src/data/atendimentoData.ts                        -- tipos, categorias, mock data, helpers
src/pages/Atendimento.tsx                          -- pagina principal (kanban/lista/detalhe/config)
src/components/atendimento/AtendimentoKanban.tsx    -- visualizacao Kanban por status
src/components/atendimento/AtendimentoList.tsx      -- visualizacao Lista (tabela)
src/components/atendimento/AtendimentoDetail.tsx    -- detalhe do chamado com chat
src/components/atendimento/AtendimentoConfig.tsx    -- configuracoes (categorias, SLA)

MODIFICAR:
src/components/FranqueadoraSidebar.tsx  -- remover disabled do item "Atendimento"
src/App.tsx                            -- adicionar rota /franqueadora/atendimento
```

---

## 1. Dados (`src/data/atendimentoData.ts`)

### Tipos

```text
TicketStatus = "Aberto" | "Em analise" | "Em atendimento" | "Aguardando franqueado" | "Resolvido" | "Encerrado" | "Reaberto"

TicketPriority = "Baixa" | "Normal" | "Alta" | "Urgente"

TicketCategory = "Financeiro" | "Juridico" | "Clientes" | "Marketing" | "Comercial" | "Sistema" | "Academy" | "Onboarding" | "Geral"

SUBCATEGORIES (mapa categoria -> subcategorias[]):
  Financeiro: Duvida de repasse, DRE, Cobranca, Sistema mensalidade, Nota fiscal
  Juridico: Contrato, COF, Minuta, Clausulas, Documentacao
  Clientes: Problemas com cliente, Cancelamento, Renovacao, Cobranca cliente, Escopo
  Marketing: Material de campanha, Criativo, Estrategia, Meta Ads, Google Ads
  Comercial: Proposta, Calculadora, Estrategia de venda, Objecao
  Sistema: Erro no sistema, Acesso, Permissao, Bug, Integracao
  Academy: Prova, Certificado, Modulo bloqueado
  Onboarding: Etapa, Reuniao, Implantacao
  Geral: Duvida, Sugestao, Reclamacao

SLA_DEADLINES (em horas):
  Urgente: 4
  Alta: 8
  Normal: 24
  Baixa: 48

Ticket:
  id, numero (ex: "#001"), unidadeId, unidadeNome,
  categoria, subcategoria, prioridade, status,
  responsavelId, responsavelNome,
  descricao, anexos (string[]),
  slaDeadline (ISO datetime),
  avaliacao? (1-5),
  criadoEm, atualizadoEm

TicketMessage:
  id, chamadoId, autorTipo ("franqueado" | "suporte"),
  autorNome, mensagem, anexo?,
  criadoEm
```

### Mock Data

- 8-10 chamados distribuidos entre unidades existentes (mockUnidades u1-u7)
- Variedade de categorias, prioridades e status
- 2 chamados com SLA estourado (para alertas)
- 1 chamado "Resolvido" com avaliacao
- 1 chamado "Encerrado"
- 10-15 mensagens mock distribuidas entre 3-4 chamados (alternando franqueado/suporte)
- Responsaveis internos: "Davi", "Lucas", "Amanda"

### Helpers

- `getTicketsByStatus(status)` -- filtra chamados
- `getMessagesForTicket(ticketId)` -- mensagens do chamado
- `isSlaBreached(ticket)` -- verifica se SLA estourou
- `getSlaRemaining(ticket)` -- tempo restante em horas/minutos
- `getAtendimentoAlerts(tickets)` -- chamados com SLA estourado, sem resposta, etc.
- `TICKET_STATUSES` -- array ordenado de status para Kanban
- `CATEGORIES` -- array de categorias
- `SUBCATEGORIES_MAP` -- mapa categoria -> subcategorias

---

## 2. Pagina Principal (`src/pages/Atendimento.tsx`)

### Navegacao via state (mesmo padrao do CRM)

- State `view`: "kanban" | "list" | "detail" | "config"
- State `selectedTicketId`: null ou id

### Header

- Titulo "Atendimento" com icone MessageSquare
- Badge "Franqueadora"
- Subtitulo: "Central de suporte e chamados da rede"

### Barra de Controles

- Toggle visualizacao: Kanban | Lista
- Botao "Configuracoes" (abre config)
- Botao "+ Novo Chamado" (Dialog)

### Filtros

- Status (Select)
- Unidade (Select com mockUnidades)
- Categoria (Select)
- Prioridade (Select)
- Responsavel (Select)
- Busca por numero/descricao (Input)

### Alertas no topo

- Chamados com SLA estourado (vermelho)
- Chamados abertos sem resposta (laranja)
- Chamados aguardando franqueado ha 48h+ (amarelo)
- Total de chamados abertos (azul)

### Dialog Novo Chamado

Formulario:
- Unidade (Select)
- Categoria (Select) -- ao selecionar, popula subcategorias
- Subcategoria (Select dinamico)
- Prioridade (Select: Baixa/Normal/Alta/Urgente)
- Descricao (Textarea)
- Responsavel (Select, opcional)
- Calcula slaDeadline automaticamente com base na prioridade
- Numero auto-incrementado (#001, #002...)

---

## 3. Kanban (`src/components/atendimento/AtendimentoKanban.tsx`)

### Colunas

6 colunas (status): Aberto, Em analise, Em atendimento, Aguardando franqueado, Resolvido, Encerrado

### Header da Coluna

- Nome do status
- Contagem
- Cor: Aberto=azul, Em analise=amarelo, Em atendimento=roxo, Aguardando=laranja, Resolvido=verde, Encerrado=cinza

### Cards

- Numero do chamado (#001)
- Unidade (nome)
- Categoria (badge)
- Prioridade (badge colorido: Baixa=cinza, Normal=azul, Alta=laranja, Urgente=vermelho)
- Responsavel
- Ultima interacao (data relativa)
- SLA: tempo restante ou tag "SLA Estourado" (vermelho, pulse)

### Acoes

- Clicar abre detalhe
- Botao "Mover >" com Select para mudar status

---

## 4. Lista (`src/components/atendimento/AtendimentoList.tsx`)

### Tabela

Colunas:
- Numero
- Unidade
- Categoria
- Prioridade (badge)
- Responsavel
- Status (badge)
- SLA (tempo restante ou "Estourado")
- Ultima atualizacao
- Acoes: Abrir

---

## 5. Detalhe do Chamado (`src/components/atendimento/AtendimentoDetail.tsx`)

### Layout em 2 colunas (grid ou flex)

#### Lado Esquerdo -- Informacoes

Card com:
- Numero do chamado (grande)
- Unidade
- Categoria / Subcategoria
- Prioridade (badge)
- Responsavel (editavel via Select)
- Status (editavel via Select)
- Data de abertura
- SLA: countdown ou "Estourado" (badge)
- Descricao completa
- Anexos (lista)
- Botoes: Resolver, Encerrar, Reabrir (conforme status)
- Se status "Encerrado": exibir avaliacao (1-5 estrelas, se existir) ou botao "Avaliar"

#### Lado Direito -- Chat Interno

Visual estilo WhatsApp:
- Area de mensagens scrollavel (ScrollArea)
- Mensagens alinhadas: suporte=esquerda (fundo cinza), franqueado=direita (fundo primario)
- Cada mensagem: autorNome, texto, timestamp, anexo (se houver)
- Identificacao visual: badge "Suporte" ou "Franqueado" em cada mensagem
- Input de mensagem na parte inferior:
  - Textarea (autosize)
  - Botao enviar
  - Botao anexo (placeholder)
- Ao enviar: adiciona mensagem como "suporte", atualiza atualizadoEm do chamado

### Fluxo de Resolucao

- Botao "Resolver": muda status para "Resolvido", toast
- Botao "Encerrar": muda para "Encerrado", dialog perguntando avaliacao (1-5 estrelas, opcional)
- Botao "Reabrir": muda para "Reaberto" (so aparece se Resolvido/Encerrado)

---

## 6. Configuracoes (`src/components/atendimento/AtendimentoConfig.tsx`)

### Categorias e Subcategorias

Lista editavel de categorias com suas subcategorias (placeholder visual -- permite ver e simular edicao)

### SLA por Prioridade

Tabela editavel:
- Urgente: 4h
- Alta: 8h
- Normal: 24h
- Baixa: 48h
(Campos editaveis com Input number)

### Responsaveis

Lista de responsaveis disponiveis

### Regras de Automacao (placeholder)

- Atribuicao automatica por categoria (Select categoria -> responsavel)
- Notificacao ao abrir chamado (toggle)

---

## 7. Design

### Cores

- Prioridade: Baixa=slate, Normal=blue, Alta=amber, Urgente=red
- Status: Aberto=blue, Em analise=yellow, Em atendimento=purple, Aguardando=orange, Resolvido=green, Encerrado=gray, Reaberto=blue
- SLA estourado: vermelho com animacao pulse
- Chat suporte: bg-muted (esquerda)
- Chat franqueado: bg-primary/10 (direita)

### Efeitos

- Chat com scroll automatico para ultima mensagem
- SLA com countdown visual (ex: "2h 30min restantes")
- Alertas com pulse se critico
- Cards Kanban com hover elevacao

---

## 8. Sidebar e Rotas

### FranqueadoraSidebar.tsx

Na secao `redeSection`, remover `disabled: true` do item "Atendimento":
```text
{ label: "Atendimento", icon: MessageSquare, path: "/franqueadora/atendimento" }
```

### App.tsx

Importar e adicionar rota:
```text
import Atendimento from "./pages/Atendimento";
<Route path="atendimento" element={<Atendimento />} />
```

---

## 9. Ordem de Implementacao

1. `atendimentoData.ts` -- tipos, categorias/subcategorias, SLA, mock chamados (8-10), mensagens (10-15), helpers
2. `AtendimentoKanban.tsx` -- Kanban por status com cards e SLA visual
3. `AtendimentoList.tsx` -- tabela operacional
4. `AtendimentoDetail.tsx` -- detalhe split com info + chat WhatsApp
5. `AtendimentoConfig.tsx` -- configuracoes admin
6. `Atendimento.tsx` -- pagina hub com header, filtros, alertas, views
7. `FranqueadoraSidebar.tsx` + `App.tsx` -- ativar menu e rota

