

# Diagnóstico: Ferramenta de Conteúdos — O que falta para gerar um prompt de qualidade

## Estado Atual

O wizard atual coleta **8 campos** antes de gerar:
1. Quantidade de conteúdos
2. Distribuição de formatos (carrossel, post, vídeo, story, artigo)
3. Objetivos (educar, autoridade, engajamento, leads, vender)
4. Tema livre (opcional)
5. Plataforma (Instagram, LinkedIn, TikTok, YouTube)
6. Tom de comunicação (educativo, institucional, direto, provocativo)
7. Público-alvo (texto livre)
8. Revisão

**Problemas identificados:**

| Problema | Impacto |
|---|---|
| Estratégia é passada como JSON bruto — a extração no prompt usa chaves genéricas (`step_0`, `step_3`) | IA recebe dados incompletos ou vazios |
| Só o campo "público" é pré-preenchido pela estratégia | Tom, pilares, persona, diferenciais, dores — nada é aproveitado |
| Faltam informações essenciais: nome da marca, diferencial, dores do público, proposta de valor, estilo de linguagem | Prompt genérico → conteúdo genérico |
| Tom de voz tem só 4 opções fixas, ignorando o tom definido na estratégia | Inconsistência entre estratégia e conteúdo |
| Não há campo de "referências" ou "o que evitar" | IA não sabe os limites da marca |

## O que é necessário para um bom prompt de conteúdo

Para gerar conteúdo realmente estratégico, a IA precisa de **3 camadas de informação**:

### Camada 1 — Da Estratégia (auto-preenchida, sem perguntar de novo)
- Nome da empresa e segmento
- Produto/serviço principal
- ICP: persona, dores, desejos, objeções, gatilhos de compra
- Proposta de valor e diferenciais
- Tom de comunicação (principal + personalidade + palavras usar/evitar)
- Pilares de conteúdo e calendário editorial
- Funil de aquisição (topo/meio/fundo)

### Camada 2 — Do Briefing de Conteúdo (perguntas específicas para ESTE lote)
- Quantidade e distribuição de formatos
- Plataforma de publicação
- Objetivo principal deste lote (pode diferir da estratégia geral)
- Tema/assunto direcionador (opcional — senão usa pilares)
- Momento do funil que quer focar (topo, meio ou fundo)
- Contexto atual: promoção, lançamento, data comemorativa, sazonalidade?
- Referência de estilo: quer algo mais leve ou mais técnico neste lote?

### Camada 3 — Regras de formatação (fixas no prompt, não pergunta ao usuário)
- Estrutura obrigatória por formato (slides do carrossel, hook do vídeo, etc.)
- Regras de distribuição de objetivos (40/30/20/10)
- Obrigatoriedade de legenda completa, hashtags, headlines, embasamento

## Plano de Implementação

### 1. Reestruturar o Wizard (`ClienteConteudos.tsx`)

Quando **há estratégia ativa**, o wizard fica mais curto porque muitos dados já existem:

**Com estratégia (5 passos):**
1. Quantidade + Formatos (unificado)
2. Objetivo + Momento do funil
3. Tema/Contexto (com sugestões dos pilares da estratégia)
4. Contexto especial (lançamento, promoção, data comemorativa — ou "nenhum")
5. Revisão (mostrando dados da estratégia que serão usados)

**Sem estratégia (8 passos — como hoje, mas melhorado):**
1. Quantidade + Formatos
2. Objetivos
3. Sobre o negócio (nome, produto, diferencial)
4. Público-alvo (persona, dores, desejos)
5. Tom de comunicação (expandido com mais opções)
6. Plataforma
7. Tema/Contexto
8. Revisão

### 2. Melhorar o Prompt no Edge Function (`generate-content/index.ts`)

Usar `useStrategyData` de forma estruturada para injetar contexto rico:

- ICP completo com dores, desejos, objeções e gatilhos
- Proposta de valor e diferenciais
- Tom com palavras para usar e evitar
- Pilares de conteúdo como base temática
- Contexto de funil para alinhar profundidade do conteúdo

### 3. Pré-preencher campos inteligentemente

Quando a estratégia existe:
- Tom → vem do `tom_comunicacao.tom_principal`
- Público → vem do `icp.descricao`
- Tema → sugere os `pilares` como opções clicáveis
- Plataforma → sugere o `canal_prioritario` da estratégia

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/pages/cliente/ClienteConteudos.tsx` | Wizard adaptativo (curto com estratégia, completo sem), pré-preenchimento, sugestões de pilares |
| `supabase/functions/generate-content/index.ts` | Prompt reestruturado com extração completa dos dados da estratégia |
| `src/hooks/useClienteContentV2.ts` | Payload expandido para incluir novos campos do briefing |

