

## Diagnóstico

Analisei o fluxo completo de geração em `supabase/functions/generate-social-image/index.ts` e identifiquei os dois problemas:

### Problema 1: Logo some no fundo
O Stage 3 (composição da logo, linhas 1136-1199) diz ao modelo para colocar a logo "directly without adding any background behind it **unless the area is too busy**", mas não menciona nada sobre **contraste de cor**. Uma logo preta em fundo escuro fica invisível.

### Problema 2: Excesso de texto
O prompt atual não limita a quantidade de texto renderizado. Headline + subheadline + supporting text + bullet points + CTA + brand name podem resultar em arte poluída e ilegível.

---

## Plano de Correção

### 1. Logo com proteção de contraste (Stage 3)

No prompt do Stage 3 (composição da logo), adicionar instruções de contraste inteligente:

- Analisar a cor dominante da área onde a logo será colocada
- Se a logo for escura e o fundo for escuro: adicionar um **halo/glow branco sutil** ou uma **pill/badge de fundo claro semitransparente** atrás da logo
- Se a logo for clara e o fundo for claro: adicionar sombra ou backdrop escuro
- Garantir que a logo tenha **sempre legibilidade total** independente do fundo

### 2. Controle de quantidade de texto

No `buildFinalPrompt` e `buildFallbackPrompt`, adicionar regras de hierarquia textual:

- **Máximo 3 blocos de texto visíveis**: headline (obrigatório), subheadline (se houver), CTA (se houver)
- Supporting text e bullet points devem ser **condensados** — máximo 2 linhas de suporte
- Regra explícita: "If more than 40 words of text are provided, prioritize headline and CTA. Summarize or omit supporting text to keep the design clean and scannable"
- Adicionar instrução: "TEXT DENSITY RULE: The image must remain at least 50% visual/graphic. Text should never dominate the canvas"

### 3. Validação no frontend (ArtWizard)

No Step 6 (texto/briefing) do wizard, adicionar um **contador de caracteres** com aviso visual quando o texto combinado (headline + sub + supporting + bullets + CTA) ultrapassar ~150 caracteres, orientando o usuário a simplificar.

---

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/generate-social-image/index.ts` | Prompt do Stage 3 com regras de contraste; regras de densidade textual nos prompts |
| `src/components/cliente/social/ArtWizardSteps.tsx` | Contador/aviso de excesso de texto no step de revisão |

