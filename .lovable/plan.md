
# Home -- Dashboard Principal (Hub Inteligente)

## Resumo

Criar a Home como dashboard principal que funciona como hub inteligente ao logar. Inclui: Saudacao + Acoes Rapidas, Mensagem do Dia (programavel), Comunicados ativos com destaque, Agenda (proximos eventos), Bloco Comercial (metas/ranking para franqueado, leads/chamados/unidades para franqueadora), Alertas/Acoes obrigatorias com widget "Hoje eu preciso de..." (3 prioridades do dia), e Atalhos rapidos. Personalizado por perfil (Franqueadora / Franqueado / Cliente final).

---

## Arquivos

```text
CRIAR:
src/data/homeData.ts                                -- tipos, mensagens do dia mock, helpers de alertas
src/pages/Home.tsx                                  -- pagina principal do dashboard
src/components/home/HomeMensagemDia.tsx              -- card mensagem do dia
src/components/home/HomeComunicados.tsx              -- card comunicados ativos (top 3)
src/components/home/HomeAgenda.tsx                   -- card proximos eventos
src/components/home/HomeComercial.tsx                -- bloco comercial (muda por perfil)
src/components/home/HomeAlertas.tsx                  -- alertas e acoes obrigatorias
src/components/home/HomeHojePreciso.tsx              -- widget "Hoje eu preciso de..." (3 prioridades)
src/components/home/HomeAtalhos.tsx                  -- grid de atalhos rapidos
src/components/home/HomeMensagemAdmin.tsx            -- CRUD de mensagens do dia (admin franqueadora)

MODIFICAR:
src/components/FranqueadoraSidebar.tsx  -- ativar Dashboard (remover disabled)
src/App.tsx                            -- adicionar rota /franqueadora/dashboard, mudar redirect padrao
src/pages/Index.tsx                    -- mudar redirect padrao para /franqueadora/dashboard
```

---

## 1. Dados (homeData.ts)

### Tipos

```text
MensagemCategoria = "Mentalidade" | "Vendas" | "Gestao" | "Marketing" | "Lideranca"
MensagemStatus = "Ativo" | "Programado" | "Arquivado"

MensagemDoDia:
  id, texto, categoria (MensagemCategoria),
  autor, publico (PublicoAlvo[]),
  dataPublicacao, status (MensagemStatus),
  criadoEm

AlertaHome:
  id, tipo (string -- "chamado" | "prova" | "onboarding" | "contrato" | "fechamento" | "comunicado"),
  titulo, descricao,
  prioridade ("alta" | "media" | "baixa"),
  link (rota do modulo),
  moduloOrigem (string),
  criadoEm

PrioridadeDoDia:
  id, titulo, descricao,
  tipo (igual AlertaHome.tipo),
  link, urgencia (1 | 2 | 3)
```

### Mock Data

- 10-12 mensagens do dia variadas (distribuidas por categoria)
- 1 mensagem ativa para hoje, 2-3 programadas, restante arquivadas
- Mensagem padrao da semana como fallback

### Helpers

- `getMensagemHoje(publico)` -- retorna mensagem ativa do dia ou fallback
- `getAlertasFranqueadora()` -- agrega alertas de todos os modulos:
  - Chamados abertos (de atendimentoData)
  - Contratos vencendo (de contratosData)
  - Provas pendentes (de academyData -- placeholder)
  - Reunioes onboarding pendentes (de onboardingData)
  - Comunicados criticos nao confirmados (de comunicadosData)
- `getAlertasFranqueado()` -- versao filtrada para franqueado
- `getPrioridadesDoDia(alertas)` -- seleciona top 3 alertas mais urgentes e retorna como PrioridadeDoDia
- `getSaudacao()` -- retorna "Bom dia" / "Boa tarde" / "Boa noite" baseado na hora
- `getQuickActions(perfil)` -- retorna acoes rapidas por perfil

---

## 2. Pagina Principal (Home.tsx)

### Layout (grid responsivo)

```text
+--------------------------------------------------+
| Header: Saudacao + Acoes rapidas                 |
+--------------------------------------------------+
| Hoje eu preciso de... (widget 3 prioridades)     |
+--------------------------------------------------+
| Mensagem do Dia      | Comunicados (top 3)        |
| (card grande)        | (card)                     |
+--------------------------------------------------+
| Agenda (proximos)    | Comercial (metas/leads)    |
| (card)               | (card)                     |
+--------------------------------------------------+
| Alertas / Acoes obrigatorias (lista completa)    |
+--------------------------------------------------+
| Atalhos rapidos (grid icones)                    |
+--------------------------------------------------+
```

### Header

- Saudacao: "Bom dia, Davi" (getSaudacao + nome do usuario)
- Subtitulo: "Franqueadora | Sexta, 21 de Fevereiro"
- Botao "Acoes rapidas" (dropdown):
  - Novo chamado -> /franqueadora/atendimento
  - Criar evento -> /franqueadora/agenda (abre form)
  - Novo comunicado -> /franqueadora/comunicados
  - Abrir CRM Expansao -> /franqueadora/crm

---

## 3. Widget "Hoje eu preciso de..." (HomeHojePreciso.tsx)

Card em destaque no topo (abaixo do header):
- Titulo: "Hoje eu preciso de..."
- 3 cards lado a lado, cada um com:
  - Numero (1, 2, 3)
  - Icone do tipo
  - Titulo curto
  - Descricao breve
  - Botao "Resolver" (navega para o modulo)
- Logica: pega os 3 alertas mais urgentes do dia
- Se nao houver alertas: mostra "Tudo em dia! Nenhuma acao pendente."
- Visual: fundo com gradiente sutil, badges de urgencia

---

## 4. Mensagem do Dia (HomeMensagemDia.tsx)

Card grande com:
- Icone de aspas / citacao
- Texto da mensagem (fonte maior, italico)
- Badge da categoria (Mentalidade, Vendas, etc.)
- Autor
- Botao "Ver historico" (abre mini-modal com lista de mensagens anteriores)
- Se admin: botao "Gerenciar mensagens" (abre HomeMensagemAdmin)

---

## 5. Comunicados (HomeComunicados.tsx)

Card com:
- Titulo "Comunicados Ativos"
- Top 3 comunicados mais relevantes (ordenados por prioridade)
- Cada item: titulo, badge prioridade, badge tipo, data
- Se critico: destaque vermelho + icone pulse
- Botao "Ver todos" -> /franqueadora/comunicados
- Dados: importa de comunicadosData, filtra status "Ativo" com mostrarDashboard true

---

## 6. Agenda (HomeAgenda.tsx)

Card com:
- Titulo "Proximos Compromissos"
- Lista dos proximos 5 eventos (hoje + proximos dias)
- Cada item: horario, titulo, badge do calendario (cor), tipo
- Eventos de hoje em destaque
- Botao "Ver agenda completa" -> /franqueadora/agenda
- Dados: importa de agendaData, usa getEventsForDate e proximos dias

---

## 7. Bloco Comercial (HomeComercial.tsx)

### Para Franqueadora (perfil atual)

Card com:
- Faturamento rede do mes (de mockData getMonthSummary)
- Top 3 unidades no ranking (de metasRankingData)
- Leads novos CRM Expansao (count de crmData com status "Novo Lead")
- Chamados em aberto (count de atendimentoData com status != "Resolvido" e != "Encerrado")

### Para Franqueado (futuro -- placeholder)

- Meta do mes (barra de progresso)
- Posicao no ranking
- Campanha ativa
- Proximas tarefas comerciais

---

## 8. Alertas (HomeAlertas.tsx)

Card "Acoes Pendentes" com lista checklist:
- Chamados aguardando resposta (de atendimentoData)
- Provas pendentes na Academy (placeholder)
- Reunioes onboarding pendentes (de onboardingData)
- Contratos vencendo em 30 dias (de contratosData)
- Comunicados criticos nao confirmados
- Cada item: icone, titulo, descricao, modulo de origem, botao "Resolver" (navega)
- Ordenados por urgencia
- Badge com count total no titulo

---

## 9. Atalhos Rapidos (HomeAtalhos.tsx)

Grid 4x2 de cards/icones:
- Marketing -> /franqueadora/marketing
- Treinamentos -> /franqueadora/treinamentos
- Metas & Ranking -> /franqueadora/metas
- Atendimento -> /franqueadora/atendimento
- Agenda -> /franqueadora/agenda
- Contratos -> /franqueadora/contratos
- Financeiro -> /franqueadora/financeiro
- Unidades -> /franqueadora/unidades

Cada card: icone + label, hover effect, navegacao via useNavigate

---

## 10. Gerenciamento Mensagem do Dia (HomeMensagemAdmin.tsx)

Dialog/Sheet com:
- Lista de mensagens cadastradas (tabela simples)
- Botao "Nova Mensagem"
- Form: texto, categoria (Select), publico (checkboxes), data publicacao (Input date), status
- Editar/Arquivar mensagens existentes
- Regra: 1 mensagem ativa por dia por publico

---

## 11. Sidebar e Rotas

### FranqueadoraSidebar.tsx

Remover `disabled: true` do item "Dashboard":
```text
{ label: "Dashboard", icon: LayoutDashboard, path: "/franqueadora/dashboard" }
```

### App.tsx

- Adicionar rota: `<Route path="dashboard" element={<Home />} />`
- Mudar redirects de `/franqueadora/financeiro` para `/franqueadora/dashboard`
- Import Home

### Index.tsx

- Mudar navigate fallback de `/franqueadora/financeiro` para `/franqueadora/dashboard`

---

## 12. Design

- Saudacao: texto grande, peso bold, com hora do dia
- Widget "Hoje eu preciso de...": fundo com gradiente sutil (primary/5), borda primary/20, cards com numeracao destaque
- Mensagem do dia: fundo com aspas decorativas, fonte serif ou italico
- Comunicados criticos: borda vermelha com pulse
- Alertas: formato checklist com icones por modulo
- Atalhos: grid uniforme com hover scale
- Cores dos badges seguem padrao existente do projeto
- Layout responsivo: em mobile, blocos empilham em coluna unica

---

## 13. Ordem de Implementacao

1. `homeData.ts` -- tipos, mensagens mock (10-12), helpers (getSaudacao, getMensagemHoje, getAlertasFranqueadora, getPrioridadesDoDia, getQuickActions)
2. `HomeHojePreciso.tsx` -- widget "Hoje eu preciso de..." com 3 prioridades
3. `HomeMensagemDia.tsx` -- card mensagem do dia com historico
4. `HomeComunicados.tsx` -- card comunicados ativos (top 3)
5. `HomeAgenda.tsx` -- card proximos eventos (5)
6. `HomeComercial.tsx` -- bloco comercial (franqueadora: faturamento, ranking, leads, chamados)
7. `HomeAlertas.tsx` -- lista de acoes pendentes com checklist
8. `HomeAtalhos.tsx` -- grid de atalhos rapidos
9. `HomeMensagemAdmin.tsx` -- CRUD mensagens do dia (dialog)
10. `Home.tsx` -- pagina hub com layout grid, header com saudacao e acoes rapidas
11. `FranqueadoraSidebar.tsx` + `App.tsx` + `Index.tsx` -- ativar rota e redirect
