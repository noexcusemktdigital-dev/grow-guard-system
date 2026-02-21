

# Area do Cliente Final (SaaS NOEXCUSE) -- Terceiro Nivel

## Resumo

Criar toda a area do Cliente Final como terceiro nivel do ecossistema, seguindo os mesmos padroes visuais (dark premium, sidebar colapsavel, PageHeader, KpiCards, transicoes suaves) mas com identidade propria de SaaS operacional. O cliente nao ve nada de franquia ou rede -- apenas suas ferramentas de trabalho.

---

## Estrutura de Navegacao (Sidebar)

Conforme o print de referencia, 3 secoes:

**PRINCIPAL**
- Inicio (Dashboard)
- Checklist do Dia
- Notificacoes
- Gamificacao

**VENDAS**
- Plano de Vendas
- Chat
- CRM
- Agentes de IA
- Scripts e Playbooks
- Disparos
- Relatorios

**MARKETING**
- Plano de Marketing
- Campanhas
- Conteudos
- Redes Sociais
- Sites
- Trafego Pago

---

## Arquivos a Criar

### Infraestrutura (3 arquivos)

```
src/components/ClienteLayout.tsx        -- Layout wrapper (igual FranqueadoLayout)
src/components/ClienteSidebar.tsx        -- Sidebar com secoes Principal/Vendas/Marketing
src/data/clienteData.ts                  -- Dados mock e helpers do cliente
```

### Paginas Principal (4 arquivos)

```
src/pages/cliente/ClienteInicio.tsx       -- Dashboard com metricas resumidas
src/pages/cliente/ClienteChecklist.tsx    -- Checklist do dia com marcacao animada
src/pages/cliente/ClienteNotificacoes.tsx -- Central de alertas filtravei
src/pages/cliente/ClienteGamificacao.tsx  -- Pontos, niveis, medalhas, ranking
```

### Paginas Vendas (7 arquivos)

```
src/pages/cliente/ClientePlanoVendas.tsx   -- Documento estrategico editavel
src/pages/cliente/ClienteChat.tsx          -- Chat interno da equipe
src/pages/cliente/ClienteCRM.tsx           -- Funil simples (5 colunas)
src/pages/cliente/ClienteAgentesIA.tsx     -- IA por categoria (Vendas/Marketing/Gestao)
src/pages/cliente/ClienteScripts.tsx       -- Biblioteca de scripts e playbooks
src/pages/cliente/ClienteDisparos.tsx      -- Ferramenta de envio (email/mensagem)
src/pages/cliente/ClienteRelatorios.tsx    -- Relatorios com graficos dinamicos
```

### Paginas Marketing (6 arquivos)

```
src/pages/cliente/ClientePlanoMarketing.tsx -- Estrategia mensal
src/pages/cliente/ClienteCampanhas.tsx      -- Gerenciamento de campanhas
src/pages/cliente/ClienteConteudos.tsx      -- Planejamento editorial/calendario
src/pages/cliente/ClienteRedesSociais.tsx   -- Dashboard redes (futuro)
src/pages/cliente/ClienteSites.tsx          -- Gestao de landing pages
src/pages/cliente/ClienteTrafegoPago.tsx    -- Painel de trafego simplificado
```

**Total: 20 novos arquivos**

---

## Detalhamento por Pagina

### 1. Inicio (Dashboard)

Cards grandes com:
- Receita estimada do mes
- Leads do mes
- Taxa de conversao
- Meta vs Realizado

Secoes:
- Campanhas ativas (cards resumidos)
- Tarefas pendentes (lista com badges)
- Alertas coloridos (contratos, metas, leads)
- Graficos simples (AreaChart de receita, BarChart de leads)

### 2. Checklist do Dia

Lista de tarefas operacionais com:
- Checkbox animado (scale + checkmark)
- Origem (automatico do plano ou manual)
- Badge de tipo (Comercial/Marketing/Gestao)
- Barra de progresso geral no topo
- Botao "Adicionar tarefa"
- Tarefas sugeridas: Ligar para leads, Postar conteudo, Ajustar campanha, Responder mensagens

### 3. Notificacoes

Central de alertas com:
- Filtro por tipo (Leads/Chat/Campanhas/Metas)
- Lista cronologica com icones coloridos
- Marcacao de lido/nao lido
- Badge de contagem no topo

### 4. Gamificacao

Sistema de pontos:
- Pontuacao total com animacao
- Nivel atual com barra de progresso
- Medalhas conquistadas (grid de badges)
- Ranking interno da empresa (tabela)
- Criterios: Tarefas concluidas, Leads atendidos, Postagens, Metas atingidas

### 5. Plano de Vendas

Documento editavel com:
- Meta mensal (editavel)
- Ticket medio
- Projecao automatica (leads necessarios = meta / ticket / conversao)
- Taxa de conversao
- KPIs calculados em tempo real
- Botao "Salvar alteracoes"

### 6. Chat

Chat interno simples:
- Lista de conversas (sidebar esquerda)
- Area de mensagens (direita)
- Input com envio
- Mensagens com avatar, nome, timestamp
- Badge "Em breve: Chat com leads"

### 7. CRM

Funil Kanban com 5 colunas:
- Novo Lead | Contato | Proposta | Fechado | Perdido
- Cards arrastaveies com nome, telefone, valor, temperatura
- Detalhe do lead com historico, tarefas, observacoes, responsavel
- Botao "Novo Lead"

### 8. Agentes de IA

3 categorias em tabs:
- Vendas (gerar mensagens, responder objecoes)
- Marketing (criar copy, legendas, headlines)
- Gestao (criar estrategias, planos)

Cada agente: input de prompt + area de resultado + botao copiar
Placeholder para integracao futura com Lovable AI

### 9. Scripts e Playbooks

Biblioteca organizada em tabs:
- Scripts de Vendas
- Roteiros de Ligacao
- Modelos de Proposta
- Estrategias

Cada item: titulo, descricao, conteudo expandivel, botao editar/copiar
Cliente pode criar novos scripts

### 10. Disparos

Interface de envio:
- Tipo: Email / Mensagem / Campanha interna
- Destinatarios (selecao de contatos do CRM)
- Assunto / Conteudo
- Agendar ou enviar agora
- Badge "Em breve: WhatsApp API"
- Historico de disparos

### 11. Relatorios

Dashboard analitico com:
- Filtro de periodo (7d/30d/90d)
- Graficos: Vendas por periodo, Conversao, Receita acumulada, Performance equipe
- Tabela resumo exportavel
- Recharts (AreaChart, BarChart, PieChart)

### 12. Plano de Marketing

Documento estrategico:
- Canais ativos (checkboxes)
- Frequencia de postagem por canal
- Objetivo do mes
- Orcamento alocado
- Editavel e salvavel

### 13. Campanhas

Gerenciamento em tabela/cards:
- Nome, Objetivo, Status (Ativa/Pausada/Finalizada), Orcamento, Resultado
- Filtros por status
- Criar nova campanha (dialog)
- Detalhe com metricas

### 14. Conteudos

Planejamento editorial:
- Calendario visual (grade semanal)
- Cards de postagem: titulo, rede, status (Rascunho/Agendado/Publicado), arquivo
- Criar novo conteudo
- Filtro por rede social

### 15. Redes Sociais

Dashboard placeholder para integracao futura:
- Cards para Instagram, Facebook, LinkedIn
- Metricas mock (seguidores, engajamento, alcance)
- Badge "Integracao em breve"

### 16. Sites

Gestao de landing pages:
- Lista de sites/paginas
- Status (Ativo/Inativo)
- Leads gerados
- Taxa de conversao
- Criar nova pagina (placeholder)

### 17. Trafego Pago

Painel simplificado:
- KPIs: Investimento, CPC, CPL, Leads, Conversao
- Grafico de investimento vs leads (LineChart)
- Tabela de campanhas ativas
- Filtro por periodo e plataforma

---

## Secao Tecnica

### Routing (App.tsx)

Adicionar terceiro bloco de rotas dentro do Index Route:

```
<Route path="cliente" element={<ClienteLayout />}>
  <Route index element={<Navigate to="/cliente/inicio" replace />} />
  <Route path="inicio" element={<ClienteInicio />} />
  <Route path="checklist" element={<ClienteChecklist />} />
  <Route path="notificacoes" element={<ClienteNotificacoes />} />
  <Route path="gamificacao" element={<ClienteGamificacao />} />
  <Route path="plano-vendas" element={<ClientePlanoVendas />} />
  <Route path="chat" element={<ClienteChat />} />
  <Route path="crm" element={<ClienteCRM />} />
  <Route path="agentes-ia" element={<ClienteAgentesIA />} />
  <Route path="scripts" element={<ClienteScripts />} />
  <Route path="disparos" element={<ClienteDisparos />} />
  <Route path="relatorios" element={<ClienteRelatorios />} />
  <Route path="plano-marketing" element={<ClientePlanoMarketing />} />
  <Route path="campanhas" element={<ClienteCampanhas />} />
  <Route path="conteudos" element={<ClienteConteudos />} />
  <Route path="redes-sociais" element={<ClienteRedesSociais />} />
  <Route path="sites" element={<ClienteSites />} />
  <Route path="trafego-pago" element={<ClienteTrafegoPago />} />
</Route>
```

### Index.tsx -- TopSwitch

Atualizar o handleLevelChange para navegar para `/cliente/inicio` quando "CLIENTE FINAL" for selecionado. Atualizar o useEffect para sincronizar o nivel quando a URL comecar com `/cliente`.

### ClienteSidebar.tsx

Mesmo padrao do FranqueadoSidebar:
- Colapsavel
- 3 secoes: PRINCIPAL, VENDAS, MARKETING
- Icones em vermelho/primary
- Pill indicator ativo
- Label "SaaS NoExcuse" no header
- Usuario logado no footer

### ClienteLayout.tsx

Identico ao FranqueadoLayout: sidebar + main com Outlet e animacao slide-up.

### clienteData.ts

Dados mock para:
- Dashboard KPIs (receita, leads, conversao, metas)
- Checklist items (com tipo e origem)
- Notificacoes (com tipo e timestamp)
- Gamificacao (pontos, niveis, medalhas, ranking)
- CRM leads (funil simplificado de 5 estagios)
- Campanhas, conteudos, disparos
- Plano de vendas e marketing

### Ordem de Implementacao

Devido ao volume (20 arquivos), sera implementado em 3 blocos:

**Bloco 1 -- Infraestrutura + Principal**
1. `clienteData.ts` (dados mock)
2. `ClienteSidebar.tsx` + `ClienteLayout.tsx`
3. `App.tsx` + `Index.tsx` (routing e TopSwitch)
4. `ClienteInicio.tsx` (dashboard)
5. `ClienteChecklist.tsx`
6. `ClienteNotificacoes.tsx`
7. `ClienteGamificacao.tsx`

**Bloco 2 -- Vendas**
8. `ClientePlanoVendas.tsx`
9. `ClienteChat.tsx`
10. `ClienteCRM.tsx`
11. `ClienteAgentesIA.tsx`
12. `ClienteScripts.tsx`
13. `ClienteDisparos.tsx`
14. `ClienteRelatorios.tsx`

**Bloco 3 -- Marketing**
15. `ClientePlanoMarketing.tsx`
16. `ClienteCampanhas.tsx`
17. `ClienteConteudos.tsx`
18. `ClienteRedesSociais.tsx`
19. `ClienteSites.tsx`
20. `ClienteTrafegoPago.tsx`

