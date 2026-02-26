

## Plano Atualizado: Briefing Conversacional com Agentes Especialistas

Incluir a **Estrategia de Marketing** e o **Plano de Vendas** no formato conversacional, alem dos modulos ja planejados (Conteudos, Artes, Sites, Trafego). Toda a logica de scoring, insights, projecoes e plano de acao permanece 100% intacta.

---

### Modulos Cobertos (Total: 6)

| Modulo | Agente | Qtd Perguntas |
|---|---|---|
| Estrategia de Marketing | **Sofia** — Consultora de Marketing | ~30 (9 secoes) |
| Plano de Vendas | **Rafael** — Consultor Comercial | ~25 (8 secoes) |
| Conteudos | **Luna** — Estrategista de Conteudo | ~8 |
| Artes / Redes Sociais | **Theo** — Diretor de Arte | ~8 |
| Sites | **Alex** — Arquiteto Web | ~22 |
| Campanhas / Trafego | **Dani** — Estrategista de Trafego | ~3 |

---

### Arquitetura

```text
ChatBriefing.tsx (componente generico)
   |
   +-- briefingAgents.ts (define agentes + roteiros)
   |     +-- SOFIA_STEPS (marketing) — mapeia strategySections[]
   |     +-- RAFAEL_STEPS (vendas) — mapeia salesSections[]
   |     +-- LUNA_STEPS (conteudos)
   |     +-- THEO_STEPS (artes)
   |     +-- ALEX_STEPS (sites)
   |     +-- DANI_STEPS (trafego)
   |
   +-- Cada pagina usa <ChatBriefing> dentro do mesmo fluxo
```

---

### Mudancas

#### 1. Criar `src/components/cliente/ChatBriefing.tsx`

Componente generico reutilizavel para todos os 6 modulos.

**Funcionalidades:**
- Header com avatar (emoji/iniciais), nome e cargo do agente
- Historico de mensagens (bolhas agente a esquerda, usuario a direita)
- Animacao "digitando..." (3 pontos, 400ms delay) antes de cada mensagem do agente
- Scroll automatico para ultima mensagem
- Barra de progresso (step X de Y) no topo
- Botao "Voltar" para desfazer ultima resposta
- Suporte a inputs: `choice`, `multi-choice`, `text`, `textarea`, `info` (mensagem sem input)
- Transicoes entre secoes com mensagem do agente: "Otimo! Agora vamos falar sobre [proxima secao]..."
- Opcao `skipIf` para pular perguntas condicionais (ex: URL do site so aparece se tem site)
- Ao finalizar: chama `onComplete(answers)` com o mesmo formato Record<string, string | string[] | number>

**Visual:**
- Bolhas agente: fundo `muted`, borda suave, avatar colorido com iniciais
- Bolhas usuario: fundo `primary/10`, alinhadas a direita
- Input fixado na parte inferior do container
- Para `choice`: mesmos botoes estilizados atuais (grid 2-3 colunas) dentro da area de input
- Para `multi-choice`: mesmos checkboxes estilizados
- Para `text`/`textarea`: campo de input com botao enviar
- HelpTooltip preservado em cada pergunta (aparece como icone na bolha do agente)

#### 2. Criar `src/components/cliente/briefingAgents.ts`

**Agentes:**
```typescript
const AGENTS = {
  sofia: { name: "Sofia", role: "Consultora de Marketing", avatar: "S", color: "#8b5cf6" },
  rafael: { name: "Rafael", role: "Consultor Comercial", avatar: "R", color: "#0ea5e9" },
  luna: { name: "Luna", role: "Estrategista de Conteúdo", avatar: "L", color: "#f59e0b" },
  theo: { name: "Theo", role: "Diretor de Arte", avatar: "T", color: "#ec4899" },
  alex: { name: "Alex", role: "Arquiteto Web", avatar: "A", color: "#10b981" },
  dani: { name: "Dani", role: "Estrategista de Tráfego", avatar: "D", color: "#f97316" },
};
```

**Roteiro Sofia (Marketing) — mapeamento exato:**
- Cada pergunta das 9 `strategySections` vira um `BriefingStep`
- O `id` do step = `id` da question original (ex: `segmento`, `tempo_mercado`, etc.)
- O `agentMessage` e uma versao conversacional da question original
- O `inputType` mapeia: `choice` -> `select`, `multi-choice` -> `multi-select`, `text` -> `text`/`textarea`
- Entre secoes, insere um step `info` com transicao: "Perfeito! Agora me conta sobre [titulo proxima secao]..."
- `condition` da question original vira `skipIf` invertido
- `helpText` preservado como tooltip na bolha
- `optional` preservado

Exemplo de mapeamento (Sofia):
```typescript
// Original: { id: "segmento", question: "Qual é o segmento da sua empresa?", type: "choice", options: [...] }
// Conversacional:
{ id: "segmento", agentMessage: "Pra começar, me conta: qual o segmento da sua empresa?",
  inputType: "select", options: [...mesmas options...], helpText: "O segmento define..." }
```

**Roteiro Rafael (Vendas) — mesmo mapeamento:**
- 8 `salesSections` com ~25 questions viram steps
- Mensagens de transicao entre secoes
- Intro: "Oi! Sou o Rafael, seu consultor comercial. Vou analisar sua operacao de vendas..."

**Roteiros Luna, Theo, Alex, Dani:**
- Conforme plano anterior ja aprovado (conteudos, artes, sites, trafego)

#### 3. Atualizar `src/pages/cliente/ClientePlanoMarketing.tsx`

**O que muda:**
- A secao de diagnostico (wizard step-by-step) e substituida pelo `<ChatBriefing>` com agente Sofia
- O `ChatBriefing` aparece no lugar do card de wizard quando `!completed`
- O `onComplete(answers)` recebe as mesmas chaves (segmento, tempo_mercado, etc.)
- Chama `computeScores(answers)` normalmente
- Salva via `saveStrategy.mutate(...)` identico
- Todo o dashboard pos-diagnostico (termometro, radar, insights, projecoes, plano de acao, cards de produto) permanece IDENTICO

**O que NAO muda:**
- `computeScores()` — nenhuma alteracao
- `getNivel()` — nenhuma alteracao
- `generateInsights()` — nenhuma alteracao
- `getLeadsProjection()` — nenhuma alteracao
- `getRevenueProjection()` — nenhuma alteracao
- `generateActionPlan()` — nenhuma alteracao
- `products[]` — nenhuma alteracao
- Dashboard renderizado apos `completed = true` — nenhuma alteracao
- `useActiveStrategy`, `useStrategyHistory`, `useSaveStrategy` — nenhuma alteracao

#### 4. Atualizar `src/pages/cliente/ClientePlanoVendas.tsx`

**O que muda:**
- A secao de diagnostico e substituida pelo `<ChatBriefing>` com agente Rafael
- O `onComplete(answers)` salva no localStorage identico ao atual
- Sets `completed = true` e dispara scoring

**O que NAO muda:**
- `computeScores()` — identico
- `getNivel()` — identico
- `generateInsights()` — identico
- `getLeadsProjection()`, `getRevenueProjection()`, `generateActionPlan()` — identicos
- Aba de Metas (goals, charts, CRUD) — ZERO alteracao
- Welcome popup — adaptado para ser a intro do Rafael
- Historico de diagnosticos — identico

#### 5. Atualizar `ClienteConteudos.tsx` — ChatBriefing com Luna

Conforme plano anterior. O wizard dentro do Dialog vira chat.

#### 6. Atualizar `ClienteRedesSociais.tsx` — ChatBriefing com Theo

Conforme plano anterior. O briefing de artes vira chat.

#### 7. Atualizar `ClienteSites.tsx` — ChatBriefing com Alex

Conforme plano anterior. Os 3 steps do wizard viram chat.

#### 8. Atualizar `ClienteTrafegoPago.tsx` — Mini-chat com Dani

Conforme plano anterior.

---

### Garantias de Integridade

1. **Mesmo `answers` Record** — As chaves dos answers sao IDENTICAS as atuais (`segmento`, `tempo_mercado`, `faturamento`, etc.). O ChatBriefing apenas muda a forma de coletar, nao o formato dos dados.

2. **Mesma logica de scoring** — `computeScores()` recebe o mesmo objeto `Answers` e retorna o mesmo resultado. Zero alteracao.

3. **Mesmos prompts** — Nenhum edge function e alterado. Os dados coletados alimentam os mesmos payloads.

4. **Mesma persistencia** — Marketing salva via `useSaveStrategy`, Vendas via localStorage, Conteudos/Artes/Sites via seus hooks existentes.

5. **Mesma UI pos-diagnostico** — Termometro, radar, insights, projecoes, plano de acao, cards — tudo renderizado identico apos `completed = true`.

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `src/components/cliente/ChatBriefing.tsx` | Criar — componente generico de chat conversacional |
| `src/components/cliente/briefingAgents.ts` | Criar — 6 agentes + roteiros completos de perguntas |
| `src/pages/cliente/ClientePlanoMarketing.tsx` | Editar — substituir wizard por ChatBriefing (Sofia) |
| `src/pages/cliente/ClientePlanoVendas.tsx` | Editar — substituir wizard por ChatBriefing (Rafael) |
| `src/pages/cliente/ClienteConteudos.tsx` | Editar — substituir wizard por ChatBriefing (Luna) |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Editar — substituir briefing por ChatBriefing (Theo) |
| `src/pages/cliente/ClienteSites.tsx` | Editar — substituir wizard por ChatBriefing (Alex) |
| `src/pages/cliente/ClienteTrafegoPago.tsx` | Editar — adicionar mini-chat com Dani |

