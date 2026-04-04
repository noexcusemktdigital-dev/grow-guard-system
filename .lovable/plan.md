

## Plano — Reestruturação completa do formulário e resultados do Diagnóstico Estratégico

### Visão geral

Reestruturar os blocos de perguntas do diagnóstico, ajustar obrigatoriedade condicional, adicionar novos blocos (Público-Alvo/Persona, Concorrência, Problemas/Histórico), remover blocos desnecessários (Termômetro de Maturidade manual, Financeiro), adicionar formatação numérica pt-BR, tooltips de ajuda em todas as perguntas, opção de áudio/gravação no campo de descrição do negócio, e ajustar a edge function para calcular o score automaticamente a partir das respostas (sem autoavaliação manual). Também separar a entrega final em dois blocos: Diagnóstico (análise + score de marketing e comercial) e Planejamento Estratégico (5 etapas + projeção).

---

### Parte 1 — Novos tipos e campo tooltip

**Arquivo:** `src/pages/franqueado/FranqueadoEstrategiaData.ts`

Adicionar ao `DiagField`:
- `optional?: boolean` — campo não obrigatório
- `tooltip?: string` — texto de ajuda exibido ao clicar no ícone "?"
- `type: "audio-text"` — novo tipo para campo com gravação/upload de áudio + textarea
- `type: "competitor-list"` — novo tipo para adicionar 3-5 concorrentes com nome, site, redes sociais
- `type: "currency"` — input com máscara pt-BR (pontos e vírgulas)

---

### Parte 2 — Reestruturação dos 7 blocos de perguntas

**Arquivo:** `src/pages/franqueado/FranqueadoEstrategia.tsx` (linhas 78-184)

Substituir os 8 blocos atuais por 7 blocos:

**Bloco 1 — Contexto do Negócio:**
- Nome da empresa (obrigatório)
- Segmento/nicho (obrigatório)
- Tempo de mercado (obrigatório)
- Serviços e produtos oferecidos (obrigatório, textarea)
- Localização / Unidades (texto, opcional)
- Ticket médio (obrigatório, tipo currency)
- Faturamento mensal (opcional, tipo currency)
- Meta de faturamento (opcional, tipo currency)
- Meta de novos clientes/mês (obrigatório)
- Metas alternativas / objetivos (textarea, opcional)
- "Fale sobre o seu negócio e tente me vender seus serviços" (tipo audio-text — textarea grande + botão gravar áudio + botão upload áudio para transcrição)

**Bloco 2 — Público-Alvo e Persona (NOVO):**
- Quem é o cliente ideal? (textarea)
- Faixa etária predominante (select)
- Gênero predominante (select)
- Renda/poder aquisitivo (select)
- Onde o público está? Canais digitais (checkbox-group)
- Principal dor/necessidade do público (textarea)
- Como o público encontra a empresa hoje? (checkbox-group)
- O que mais influencia a decisão de compra? (textarea)

**Bloco 3 — Concorrência (NOVO):**
- Tipo `competitor-list`: adicionar 3-5 concorrentes
  - Cada concorrente: Nome (obrigatório), Site (opcional), Instagram (opcional), Diferencial percebido (opcional)
- Principal diferencial da empresa sobre concorrentes (textarea)

**Bloco 4 — Histórico e Problemas (NOVO):**
- Principais problemas no marketing hoje (textarea)
- O que já tentou fazer no marketing? O que deu certo/errado? (textarea)
- Principais problemas no comercial/vendas (textarea)
- O que já tentou fazer no comercial? O que deu certo/errado? (textarea)

**Bloco 5 — Conteúdo e Linha Editorial:**
- Produz conteúdo para redes sociais? (select: Sim com frequência / Sim mas irregular / Não)
- Se produz: Em quais redes sociais publica? (checkbox-group, condicional)
- Se produz: Frequência (select, condicional)
- Se produz: Segue funil de conteúdo topo/meio/fundo? (select, condicional)
- Se produz: Quais formatos? (checkbox-group, condicional)
- Se produz: Sabe o que funciona melhor? O que dá mais resultado? (textarea, condicional)
- Redes sociais da empresa (URLs — texto livre ou campos separados, sempre visível)

Todos os campos condicionais: se "Não" produz conteúdo, nenhum é obrigatório.

**Bloco 6 — Tráfego e Distribuição:**
- Investe em tráfego pago? (select: Sim / Não / Já investiu mas parou)
- Se Sim: Quanto investe por mês? (currency, condicional)
- Se Sim: Em quais plataformas? (checkbox-group, condicional)
- Se Sim: Sabe quais indicadores tem hoje? (select: Sim / Não / Parcialmente, condicional)
- Se Sim e sabe indicadores: CPL, leads/mês, canal que mais converte (condicionais)
- Se Sim: Quais objetivos já testou? O que funcionou e o que não? (textarea, condicional)
- Se Não/Parou: Campos de indicadores opcionais

**Bloco 7 — Web e Conversão + Sales e Fechamento + Validação (unificado para reduzir etapas):**

Sub-seção Web:
- Possui e-commerce, site ou landing page? (select: Sim / Não)
- Se Sim: URL do site (texto, condicional)
- Se Sim: campos de taxa de conversão, testes A/B, prova social (condicionais)
- Se Não: Sites de concorrentes para análise (texto, opcional)

Sub-seção Sales:
- Possui processo comercial? (select: Sim / Parcial / Não)
- Se Sim/Parcial: Descreva como funciona o processo comercial hoje (textarea, condicional)
- Time comercial, CRM, script, funil, follow-up (condicionais/opcionais conforme resposta)

Sub-seção Validação:
- Acompanha métricas de marketing e vendas? (select: Sim / Parcial / Não)
- Se Sim/Parcial: Quais indicadores de marketing acompanha? (checkbox-group)
- Se Sim/Parcial: Quais indicadores comerciais acompanha? (checkbox-group)
- Se atingir sua meta de clientes, consegue atender ou precisará reestruturar o comercial? (select)

**Removidos:** Bloco "Termômetro de Maturidade" (score será calculado automaticamente pela IA) e bloco "Financeiro e Projeções" (dados já capturados no bloco 1).

---

### Parte 3 — Formatação numérica pt-BR e campo currency

**Arquivo:** `src/pages/franqueado/FranqueadoEstrategiaDiagnosticForm.tsx`

- Novo tipo `currency`: Input com máscara que formata automaticamente com pontos de milhar e vírgula decimal (ex: "50.000,00"). Ao digitar, aplica `toLocaleString("pt-BR")`.
- Novo tipo `audio-text`: Textarea grande (6 linhas) + dois botões: "Gravar Áudio" (usa `MediaRecorder` do navegador) e "Enviar Áudio" (upload). O áudio gravado/enviado é transcrito via edge function `extract-strategy-answers` ou similar, e o texto transcrito preenche a textarea.
- Tooltip de ajuda: Em cada label, adicionar ícone `HelpCircle` clicável que abre um popover/tooltip com explicação didática e objetiva sobre o campo. Os textos de tooltip virão do campo `tooltip` do `DiagField`.
- Campo `competitor-list`: UI dinâmica para adicionar/remover concorrentes (mín 1, máx 5), cada um com campos nome, site, Instagram, diferencial.
- Campos opcionais (`optional: true`): não bloquear avanço se vazios no `canAdvance`.

---

### Parte 4 — Edge function: Score automático (marketing + comercial)

**Arquivo:** `supabase/functions/generate-strategy/index.ts`

Atualizar os schemas e prompts para:
- **Calcular automaticamente** o score de marketing (0-100) e score comercial (0-100) a partir das respostas, sem depender de autoavaliação
- Adicionar ao GPS_DIAGNOSIS_SCHEMA:
  - `score_marketing` e `score_comercial` (separados, além do `score_geral`)
  - `persona` — persona criada a partir das respostas do bloco 2
  - `analise_concorrencia` — análise dos concorrentes informados
- Atualizar prompts para considerar os novos campos (público-alvo, concorrência, histórico de problemas)
- Na metodologia ECE: corrigir para "Estrutura, Coleta de dados e Escala" (não "Infraestrutura")

---

### Parte 5 — Resultados: dois blocos separados + persona + concorrência

**Arquivo:** `src/pages/franqueado/FranqueadoEstrategiaResultViews.tsx`

Ajustar `NewStrategyResultView` para:
- Exibir **Score de Marketing** e **Score Comercial** separados (além do geral)
- Adicionar seção **Persona** (perfil do cliente ideal gerado pela IA)
- Adicionar seção **Análise de Concorrência** 
- Separar visualmente em dois grandes blocos:
  1. **Diagnóstico** — Resumo, Scores, Radar, Persona, Concorrência, Problemas, Gargalos ECE
  2. **Planejamento Estratégico** — 5 etapas com ações, projeção, entregáveis

---

### Parte 6 — Atualizar tipos no hook

**Arquivo:** `src/hooks/useFranqueadoStrategies.ts`

Adicionar a `StrategyResult`:
- `score_marketing?: number`
- `score_comercial?: number`
- `persona?: { descricao, faixa_etaria, canais, dor_principal, decisao_compra }`
- `analise_concorrencia?: { concorrentes: Array<{ nome, pontos_fortes, pontos_fracos, oportunidades }>, diferencial_empresa }`

---

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/franqueado/FranqueadoEstrategiaData.ts` | Novos tipos (optional, tooltip, audio-text, currency, competitor-list) |
| `src/pages/franqueado/FranqueadoEstrategia.tsx` | 7 blocos reestruturados, remover Termômetro e Financeiro |
| `src/pages/franqueado/FranqueadoEstrategiaDiagnosticForm.tsx` | Currency mask, tooltips, audio-text, competitor-list, optional fields |
| `supabase/functions/generate-strategy/index.ts` | Score automático marketing/comercial, persona, concorrência, ECE corrigido |
| `src/pages/franqueado/FranqueadoEstrategiaResultViews.tsx` | Dois blocos (Diagnóstico + Planejamento), persona, concorrência, scores separados |
| `src/hooks/useFranqueadoStrategies.ts` | Novos campos na interface StrategyResult |

