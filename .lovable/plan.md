
# Modulo Principal Franqueado -- Design Identico a Matriz

## Resumo

Redesenhar os 4 modulos do bloco Principal do franqueado (Dashboard, Agenda, Comunicados, Suporte) para seguir exatamente o mesmo padrao visual da matriz, mas com dados filtrados exclusivamente pela unidade logada.

---

## 1. Dashboard do Franqueado

### Estado atual
O dashboard ja existe com KPIs, metas, ranking, comunicados recentes, eventos e chamados. Porem falta:
- Secao "Hoje eu preciso de..." no estilo da matriz (cards de prioridade com urgencia 1/2/3)
- Resumo financeiro detalhado (projecao, repasse estimado, contratos ativos)
- Alertas de unidade (contratos a vencer, propostas sem retorno, diagnosticos pendentes)
- Componentes reutilizaveis da home da matriz (HomeHojePreciso, HomeAlertas, HomeMensagemDia, HomeAgenda, HomeComunicados)

### O que sera feito
- Reescrever `FranqueadoDashboard.tsx` usando a mesma estrutura composicional de `Home.tsx` (matriz)
- Criar componentes de alertas da unidade reutilizando o padrao `HomeAlertas` e `HomeHojePreciso`
- Adicionar secao de Resumo Financeiro com cards: Receita do Mes, Projecao, Repasse Estimado, Contratos Ativos
- Adicionar secao Comercial: Leads Ativos, Propostas em Aberto, Vendas do Mes, Meta do Mes
- Manter secoes existentes: Comunicados Recentes, Proximos Eventos, Chamados Abertos
- Adicionar alertas dinamicos: contratos vencendo, propostas sem retorno, diagnosticos pendentes
- Layout: PageHeader + HojePreciso + MensagemDia/Comunicados (grid 2col) + KPIs financeiros + Comercial + Agenda/Alertas

---

## 2. Agenda do Franqueado

### Estado atual
Cards simples em grid com filtro de visibilidade. Nao tem calendario, navegacao temporal, nem sidebar.

### O que sera feito
- Redesenhar `FranqueadoAgenda.tsx` para usar o mesmo layout da `Agenda.tsx` da matriz:
  - Header com navegacao (anterior/hoje/proximo) e seletor de visao (Mes/Semana/Dia/Lista)
  - Sidebar com mini-calendario e filtros de visibilidade (Pessoal/Unidade/Rede)
  - Reutilizar componentes `AgendaCalendar`, `AgendaListView`, `AgendaSidebar`
- Adaptar dados: converter `FranqueadoEvento` para o formato `AgendaEvent` usado pelos componentes da matriz
- Criar funcao `getFranqueadoAgendaEvents()` em `franqueadoData.ts` que retorna eventos no formato `AgendaEvent`
- Criar calendarios mock para o franqueado (Pessoal, Unidade, Rede) no formato `AgendaCalendar`
- Manter badge "Somente leitura" para eventos da rede
- Permitir criacao de eventos pessoais e da unidade (formulario `AgendaEventForm`)
- Layout full-height identico a matriz: header fixo + sidebar + area principal

---

## 3. Comunicados do Franqueado

### Estado atual
Lista funcional com filtros e detalhe. Ja esta bem implementado mas com layout diferente da matriz.

### O que sera feito
- Alinhar o header com o padrao da matriz: icone + titulo + badge "Unidade" + subtitulo
- Adicionar indicador visual de comunicados criticos (destaque vermelho com icone pulsante)
- Manter logica existente: filtros por prioridade e status, detalhe com "Li e concordo"
- Adicionar exibicao inteligente: comunicados marcados como "Importante" aparecem com destaque visual diferenciado no topo da lista
- O franqueado continua sem poder criar/editar comunicados (somente leitura + confirmar leitura)
- Layout final muito similar ao atual, com ajustes cosmeticos no header

---

## 4. Suporte do Franqueado

### Estado atual
Lista simples de chamados com chat basico. Falta:
- Alertas de SLA no topo (como a matriz)
- Filtros por status/categoria/prioridade
- Chat estilo WhatsApp mais rico (com badges Suporte/Franqueado, timestamps, anexos)
- Categorias expandidas (Financeiro, Juridico, Comercial, Marketing, Treinamentos, Sistema, Duvidas gerais)
- Campo de descricao e prioridade no formulario de criacao
- Status expandidos: Aberto, Em analise, Respondido, Resolvido

### O que sera feito
- Redesenhar `FranqueadoSuporte.tsx` seguindo o padrao visual do `Atendimento.tsx` da matriz
- Adicionar cards de alerta no topo: Chamados Abertos, Em Analise, Respondidos, Resolvidos
- Adicionar filtros por status e categoria (Select inline)
- Expandir categorias para: Financeiro, Juridico, Comercial, Marketing, Treinamentos, Sistema, Duvidas gerais
- Expandir status para: Aberto, Em analise, Respondido, Resolvido
- Adicionar campo de prioridade (Baixa/Normal/Alta/Urgente) e descricao no formulario de criacao
- Chat redesenhado: layout split (info a esquerda, chat a direita) como `AtendimentoDetail`
- Badge "Suporte"/"Franqueado" nas mensagens, timestamps formatados, botao de anexo
- Manter regra: franqueado ve apenas seus chamados, sem visibilidade de outras unidades

---

## Secao Tecnica

### Arquivos modificados

```
src/pages/franqueado/FranqueadoDashboard.tsx  -- reescrever com composicao igual a Home.tsx
src/pages/franqueado/FranqueadoAgenda.tsx      -- redesenhar com calendario completo
src/pages/franqueado/FranqueadoComunicados.tsx -- ajustes cosmeticos no header e destaques
src/pages/franqueado/FranqueadoSuporte.tsx     -- redesenhar com layout split, alertas e filtros
src/data/franqueadoData.ts                     -- adicionar helpers para agenda e alertas da unidade
```

### Novos helpers em franqueadoData.ts

```
getFranqueadoAlertasUnidade() -- gera alertas da unidade (contratos vencendo, propostas sem retorno, diagnosticos pendentes)
getFranqueadoPrioridadesUnidade() -- top 3 prioridades para "Hoje eu preciso de..."
getFranqueadoAgendaEvents() -- converte FranqueadoEvento para formato AgendaEvent
getFranqueadoCalendars() -- mock de calendarios (Pessoal, Unidade, Rede)
```

### Dashboard -- Estrutura de componentes

Reutilizar componentes existentes da home da matriz adaptados para dados da unidade:
- `HomeHojePreciso` com prioridades da unidade
- `HomeMensagemDia` com mensagem do dia
- KpiCards para financeiro (Receita, Projecao, Repasse, Contratos)
- KpiCards para comercial (Leads, Propostas, Vendas, Meta)
- Cards de comunicados e agenda (inline, sem componentes externos)
- `HomeAlertas` com alertas da unidade

### Agenda -- Reutilizacao de componentes

Reutilizar diretamente:
- `AgendaCalendar` (mes/semana/dia)
- `AgendaListView`
- `AgendaSidebar` (mini-calendario + filtros)
- `AgendaEventForm` (criar/editar evento)
- `AgendaEventDetail` (detalhe do evento)

Adaptacao necessaria: criar funcao que mapeia `FranqueadoEvento[]` para `AgendaEvent[]` com calendarIds correspondentes.

### Suporte -- Estrutura redesenhada

```
Vista lista:
  - 4 cards de alerta (Abertos | Em analise | Respondidos | Resolvidos)
  - Filtros inline (status + categoria + busca)
  - Lista de chamados com badges de status/prioridade

Vista detalhe:
  - Grid 2/3: info do chamado (esquerda) + chat (direita)
  - Info: numero, categoria, status, prioridade, data abertura, descricao
  - Chat: ScrollArea com mensagens bubble, badges Suporte/Franqueado, timestamps
  - Input com botao de anexo e enviar
```

### Ordem de implementacao

1. Atualizar `franqueadoData.ts` com novos helpers
2. Redesenhar `FranqueadoDashboard.tsx`
3. Redesenhar `FranqueadoAgenda.tsx`
4. Ajustar `FranqueadoComunicados.tsx`
5. Redesenhar `FranqueadoSuporte.tsx`
