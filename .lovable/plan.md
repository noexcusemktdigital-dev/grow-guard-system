

# Modulo Onboarding -- Implantacao e Acompanhamento de Franquias

## Resumo

Criar o modulo "Onboarding" dentro da secao Rede do sidebar. O modulo gerencia a implantacao estruturada das franquias apos a venda, com checklist de fases, reunioes CS, indicadores iniciais (0-90 dias) e plano de acao. Sem CRM, sem contratos, sem treinamentos gravados -- foco exclusivo na jornada da unidade pos-venda.

---

## Arquivos

```text
CRIAR:
src/data/onboardingData.ts                        -- tipos, interfaces, mock data, helpers
src/pages/Onboarding.tsx                           -- pagina principal (lista + detalhe)
src/components/onboarding/OnboardingList.tsx        -- tela geral com tabela/cards de unidades
src/components/onboarding/OnboardingEtapas.tsx      -- aba 1: checklist de implantacao (4 fases)
src/components/onboarding/OnboardingReunioes.tsx    -- aba 2: timeline de reunioes CS
src/components/onboarding/OnboardingIndicadores.tsx -- aba 3: indicadores iniciais (90 dias)
src/components/onboarding/OnboardingPlanoAcao.tsx   -- aba 4: tarefas estrategicas

MODIFICAR:
src/components/FranqueadoraSidebar.tsx  -- remover disabled do item "Onboarding"
src/App.tsx                            -- adicionar rota /franqueadora/onboarding
```

---

## 1. Dados (`src/data/onboardingData.ts`)

### Tipos

```text
OnboardingStatus = "Nao iniciado" | "Em implantacao" | "Em acompanhamento" | "Implantado com sucesso" | "Em risco" | "Encerrado"

OnboardingPhase = "Pre-Implantacao" | "Estruturacao" | "Primeiros Movimentos" | "Consolidacao"

ChecklistItem:
  id, phase (OnboardingPhase), descricao, concluido (bool), data?, responsavel?, observacao?

OnboardingUnit:
  id, unidadeId, unidadeNome, responsavelCS, dataInicio, status (OnboardingStatus),
  checklist (ChecklistItem[])

MeetingType = "Kickoff" | "Estrategica" | "Comercial" | "Performance" | "Revisao mensal"
MeetingStatus = "Agendada" | "Realizada" | "Cancelada"

OnboardingMeeting:
  id, onboardingId, tipo (MeetingType), data, status (MeetingStatus),
  resumo, proximosPassos, anexo?

OnboardingIndicators:
  onboardingId, clientesAtivos, receita, propostasEnviadas, metaAtingidaPct, leadsGerados

OnboardingTask:
  id, onboardingId, tarefa, responsavel, prazo, status ("Aberta" | "Concluida" | "Atrasada"), observacao?
```

### Checklist Padrao por Fase

**Fase 1 -- Pre-Implantacao:**
- Assinatura contrato
- Pagamento taxa
- Acesso sistema liberado
- Acesso Academy liberado

**Fase 2 -- Estruturacao:**
- Configuracao comercial
- Definicao de metas
- Treinamento inicial
- Apresentacao dos produtos

**Fase 3 -- Primeiros Movimentos:**
- Primeiro lead gerado
- Primeira proposta enviada
- Primeiro contrato fechado
- Primeira campanha ativa

**Fase 4 -- Consolidacao (30-60 dias):**
- Pipeline organizado
- Metas ativas
- Primeira DRE analisada
- Ajustes estrategicos

### Mock Data

- 4-5 onboardings vinculados a unidades existentes (usar unidadeId do mockUnidades)
  - 1x "Em implantacao" (50-60% concluido)
  - 1x "Em acompanhamento" (80% concluido)
  - 1x "Implantado com sucesso" (100%)
  - 1x "Em risco" (30%, sem atividade recente)
  - 1x "Nao iniciado" (0%)
- Responsaveis CS: "Davi", "Lucas", "Amanda"
- 3-4 reunioes mock (Kickoff, Estrategica, etc.)
- Indicadores mock para unidades ativas
- 4-5 tarefas mock (incluindo atrasadas para alertas)

### Helpers

- `getOnboardingProgress(checklist)` -- calcula % concluido
- `getOnboardingAlerts(onboardings, tasks)` -- retorna alertas:
  - Sem atividade ha 7 dias
  - Kickoff nao realizado
  - 60 dias sem cliente fechado
  - Menos de 70% concluido apos prazo
- `DEFAULT_CHECKLIST` -- array padrao de checklist para novas implantacoes

---

## 2. Pagina Principal (`src/pages/Onboarding.tsx`)

### Navegacao via state

- State `selectedOnboardingId`: null (lista) ou id (detalhe)

### Header

- Titulo "Onboarding" com icone Rocket
- Badge "Franqueadora"
- Subtitulo: "Implantacao e acompanhamento das franquias da rede"
- Botao "Voltar" quando em detalhe

### Detalhe da Unidade

Quando selecionada, exibir:
- Header: nome da unidade, data de inicio, responsavel CS, status (badge), barra de progresso (%)
- 4 abas (Tabs shadcn): Etapas, Reunioes, Indicadores, Plano de Acao

---

## 3. Tela Geral (`src/components/onboarding/OnboardingList.tsx`)

### Alertas no topo

Cards com contagem de alertas (mesmo padrao do CRM):
- Unidades sem atividade ha 7+ dias
- Kickoff nao realizado
- Unidades em risco
- Media de progresso da rede

### Filtros

- Status (Select)
- Responsavel CS (Select)
- Periodo (Input date range simplificado)

### Tabela

Colunas:
- Unidade
- Data inicio
- Responsavel CS
- Etapa atual (fase com mais itens pendentes)
- % concluido (Progress bar)
- Status (badge colorido)
- Acoes: Abrir

Cores do status:
- Nao iniciado = cinza
- Em implantacao = azul
- Em acompanhamento = amarelo
- Implantado com sucesso = verde
- Em risco = vermelho
- Encerrado = cinza escuro

### Botao "Iniciar Onboarding"

Dialog para selecionar unidade (das existentes no mockUnidades que ainda nao tem onboarding), definir responsavel CS e data de inicio. Cria com checklist padrao e status "Em implantacao".

---

## 4. Aba 1 -- Etapas da Implantacao (`OnboardingEtapas.tsx`)

### Layout

4 fases em secoes colapsaveis (Collapsible):
- Header da fase: nome, progresso da fase (ex: 3/4), badge se 100%
- Dentro de cada fase, lista de itens de checklist

### Cada item do checklist

- Checkbox (concluido/nao)
- Descricao
- Data de conclusao (se concluido)
- Responsavel (editavel, Input ou Select)
- Observacao (Input, opcional)
- Ao marcar checkbox: preenche data automaticamente com hoje

### Calculo automatico

- Progress bar geral no header atualiza em tempo real
- % = itens concluidos / total de itens

---

## 5. Aba 2 -- Reunioes e Acompanhamentos (`OnboardingReunioes.tsx`)

### Timeline vertical

Lista cronologica com linha conectora vertical (igual atividades do CRM):
- Icone por tipo de reuniao
- Data
- Status (badge: Agendada=azul, Realizada=verde, Cancelada=vermelho)
- Resumo (texto)
- Proximos passos
- Anexo (nome, se houver)

### Botao "+ Agendar Reuniao"

Dialog com:
- Tipo (Select: Kickoff, Estrategica, Comercial, Performance, Revisao mensal)
- Data
- Status (default: Agendada)
- Resumo (Textarea)
- Proximos passos (Input)

---

## 6. Aba 3 -- Indicadores Iniciais (`OnboardingIndicadores.tsx`)

### Cards KPI (padrao do projeto)

5 cards:
- Clientes ativos (numero)
- Receita acumulada (R$)
- Propostas enviadas (numero)
- Meta atingida (% com Progress bar)
- Leads gerados (numero)

### Nota informativa

"Dados referentes aos primeiros 90 dias da unidade. Valores simulados -- integracao automatica em desenvolvimento."

Dados vem do mock `OnboardingIndicators`.

---

## 7. Aba 4 -- Plano de Acao (`OnboardingPlanoAcao.tsx`)

### Tabela de tarefas

Colunas:
- Tarefa (descricao)
- Responsavel (Franqueado ou CS)
- Prazo (data)
- Status (badge: Aberta=azul, Concluida=verde, Atrasada=vermelho)
- Observacao
- Acoes: Concluir (checkbox), Editar, Excluir

### Botao "+ Nova Tarefa"

Dialog com: Tarefa, Responsavel (Select), Prazo (Input date), Observacao.

### Destaque visual

Tarefas atrasadas (prazo < hoje e nao concluida) com fundo vermelho claro e badge "Atrasada".

---

## 8. Sidebar e Rotas

### FranqueadoraSidebar.tsx

Na secao `redeSection`, remover `disabled: true` do item "Onboarding":

```text
{ label: "Onboarding", icon: Rocket, path: "/franqueadora/onboarding" }
```

### App.tsx

Importar e adicionar rota:

```text
import Onboarding from "./pages/Onboarding";
...
<Route path="onboarding" element={<Onboarding />} />
```

---

## 9. Design

- Seguir padrao visual existente (cards, badges, tabelas, dialogs)
- Progress bars usando componente Progress do shadcn
- Status com badges coloridos (mesmo padrao de Unidades e CRM)
- Timeline de reunioes com linha vertical conectora e icones por tipo
- Fases do checklist em Collapsible com chevron
- Alertas no topo com icone + pulse se critico
- Transicao fade-in entre lista e detalhe

---

## 10. Ordem de Implementacao

1. `onboardingData.ts` -- tipos, checklist padrao, mock data (5 onboardings), reunioes, indicadores, tarefas, helpers
2. `OnboardingList.tsx` -- tela geral com tabela, filtros, alertas, dialog "Iniciar Onboarding"
3. `OnboardingEtapas.tsx` -- checklist colapsavel com 4 fases e progresso automatico
4. `OnboardingReunioes.tsx` -- timeline de reunioes com CRUD
5. `OnboardingIndicadores.tsx` -- cards KPI dos 90 dias
6. `OnboardingPlanoAcao.tsx` -- tarefas estrategicas com CRUD
7. `Onboarding.tsx` -- pagina hub com lista/detalhe + abas
8. `FranqueadoraSidebar.tsx` + `App.tsx` -- ativar menu e rota

