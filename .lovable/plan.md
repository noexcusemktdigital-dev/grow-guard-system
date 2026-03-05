

# Comparação e Gaps Identificados

## O resultado é excelente — e nosso sistema QUASE chega lá

Comparando o prompt de referência P2Y com o que nosso edge function gera, o fluxo estruturado (Scene → Environment → Design layout → Color palette → Text → Mood) **já está implementado corretamente**. Mas há **2 gaps** que impedem atingir o mesmo nível:

### Gap 1: Referência genérica vs. referência específica

**Prompt de exemplo (funciona bem):**
```
Replicate the brand design system including:
- black and white base layout
- lime green highlight color
- rounded card shapes
- circular icon elements
- modern financial consulting layout
- clean sans-serif typography
- marketing educational style
```

**Nosso sistema (genérico):**
```
Replicate the brand design system including: color palette, layout structure, 
card shapes, icon elements, typography style, and overall design language.
```

A instrução de referência é estática e genérica. Deveria listar os **elementos específicos da marca** extraídos da identidade visual ou gerados pelo chain-of-thought.

**Correção:** Adicionar um campo `brand_design_elements` ao tool call do chain-of-thought (Flash). O Flash já recebe a identidade visual — basta pedir que ele retorne uma lista de 5-8 elementos de design específicos da marca (ex: "dark background with lime green accents, rounded card shapes, circular icons"). Essa lista substitui os termos genéricos na instrução de referência.

### Gap 2: Falta "Supporting text" e "Bullet points" no wizard

O prompt P2Y inclui:
```
Supporting text: Parcelar pode ser estratégia ou armadilha. Tudo depende de três fatores.
Bullet points: Tempo / Renda / Objetivo
```

Nosso wizard tem apenas: Headline, Subheadline, CTA. Faltam campos para **texto de apoio** e **bullet points** que enriquecem o layout.

**Correção:** Adicionar 2 campos opcionais no bloco 3 (Texto da arte): `supportingText` e `bulletPoints`. Passar ao edge function na seção "Text in Portuguese".

## Plano de Implementação

### 1. Edge Function — Chain-of-thought retorna `brand_design_elements` (`generate-social-image/index.ts`)

- Adicionar `brand_design_elements` ao `StructuredPromptResult` interface (tipo `string`, lista de elementos)
- Adicionar ao tool call schema do Flash: `"brand_design_elements": { type: "string", description: "List 5-8 specific brand design elements from the references/identity: color scheme, layout shapes, icon style, typography, overall aesthetic. Format as comma-separated list." }`
- Na montagem do `referenceInstruction`, usar `optimized.brand_design_elements` para substituir a lista genérica

### 2. Edge Function — Seção Text expandida (`generate-social-image/index.ts`)

- Receber `supporting_text` e `bullet_points` do payload
- Adicionar à seção "Text in Portuguese":
  - `Supporting text: ...`
  - `Bullet points: ...`

### 3. UI — Campos extras no bloco de texto (`ClienteRedesSociais.tsx`)

- Bloco 3 (Texto da arte): adicionar `supportingText` (textarea, opcional) e `bulletPoints` (input, opcional, placeholder "Ex: Tempo, Renda, Objetivo")

### 4. Hook — Payload expandido (`useClientePosts.ts`)

- Passar `supporting_text` e `bullet_points` no payload do `useGeneratePost`

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/generate-social-image/index.ts` | `brand_design_elements` no chain-of-thought + referência dinâmica + text section expandida |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Campos `supportingText` e `bulletPoints` no bloco 3 |
| `src/hooks/useClientePosts.ts` | Payload com `supporting_text` e `bullet_points` |

## Resultado Esperado

Com inputs equivalentes ao exemplo P2Y, o sistema gerará:

```
Use the attached images ONLY as brand style references for the visual identity.
Replicate the brand design system including:
black and white base layout, lime green highlight color, rounded card shapes,
circular icon elements, modern financial consulting layout, clean sans-serif typography.
IMPORTANT: Do NOT recreate the same people, same scene or same composition.
Create a NEW scene that follows the same brand design language.

Scene:
A Brazilian couple sitting together at home planning finances on a laptop...

Environment:
Modern living room with natural daylight coming through a window...

Design layout:
Top portion: lifestyle photo with the couple reviewing financial documents.
Bottom portion: dark rounded card layout with text and lime green highlights.
Include three circular icon elements representing: time, income and financial goal.

Color palette:
black, white and lime green accents consistent with the brand references.

Format:
Portrait 4:5 (1080×1350px) social media post.

Text in Portuguese:
Headline: O problema não é parcelar.
Highlight headline: É parcelar sem planejamento!
Supporting text: Parcelar pode ser estratégia ou armadilha. Tudo depende de três fatores.
Bullet points: Tempo, Renda, Objetivo
Brand: P2Y crédito e investimento

Mood:
accessible financial education, trust, planning and smart decisions.

Ultra realistic photography with modern marketing layout.
```

Esse prompt é **equivalente ao que gerou o resultado excelente** que você mostrou.

