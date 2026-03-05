

# Análise: Nosso Sistema vs. Prompts de Referência

## Diagnóstico — 3 Problemas Críticos Encontrados

Após revisar o edge function `generate-social-image/index.ts` e comparar com os prompts de exemplo que geraram ótimos resultados, identifiquei **3 gaps críticos** que impedem o sistema de gerar prompts nesse nível:

### Problema 1: O sistema PROÍBE texto na imagem — mas os exemplos INCLUEM texto

O prompt atual tem uma regra absoluta:
```
ABSOLUTE RULES (NEVER VIOLATE):
- ZERO text, letters, numbers, words, logos, or watermarks in the image
```

E o chain-of-thought (Flash) também diz:
```
- NEVER include any text, letters, words, logos, or watermarks in the image description
```

Mas os prompts de exemplo que funcionam bem **incluem texto na imagem** (headline, subheadline, CTA, bullet points, nome da marca). O NanoBanana **consegue** renderizar texto. O sistema está bloqueando isso.

### Problema 2: As referências são mal instruídas

Atualmente, as referências são enviadas com apenas esta instrução genérica:
```
"Study the provided reference images and match their visual style, color treatment, composition approach, and overall aesthetic."
```

Nos prompts de exemplo, a instrução é muito mais precisa:
```
"Use the attached images ONLY as brand style references for the visual identity.
Replicate the brand design system including: [lista específica de elementos]
IMPORTANT: Do NOT recreate the same people, same scene or same composition from the references.
Create a NEW scene that follows the same brand design language."
```

### Problema 3: O prompt final não tem a estrutura dos exemplos

Os prompts de exemplo são organizados em seções claras: Scene, Environment, Design layout, Color palette, Text in Portuguese, Mood. O sistema atual gera um blob genérico via chain-of-thought que perde essa estrutura.

## Plano de Correção

### 1. Remover a proibição de texto e incluir texto na imagem (`generate-social-image/index.ts`)

- Remover as regras "ZERO text" do prompt final E do system prompt do chain-of-thought
- Adicionar uma seção `TEXT IN PORTUGUESE` no prompt final com headline, subheadline, CTA e marca
- Instruir a IA a renderizar o texto dentro da imagem como parte do design layout

### 2. Reformular a instrução de referências (`generate-social-image/index.ts`)

Substituir a instrução genérica por:
```
Use the attached images ONLY as brand style references for the visual identity.
Replicate the brand design system including: color palette, layout structure, 
card shapes, icon elements, typography style, and overall design language.
IMPORTANT: Do NOT recreate the same people, same scene or same composition.
Create a NEW scene that follows the same brand design language.
```

### 3. Reestruturar o chain-of-thought para gerar prompts no formato dos exemplos (`generate-social-image/index.ts`)

Atualizar o system prompt do `analyzeAndOptimizePrompt` para gerar o prompt no formato estruturado:
- **Scene**: descrição da cena com personagens e ações
- **Environment**: detalhes do ambiente e iluminação
- **Design layout**: estrutura visual (top photo / bottom card, etc.)
- **Color palette**: cores específicas da marca
- **Text in Portuguese**: headline, subheadline, CTA, bullet points, marca
- **Mood**: palavras-chave de atmosfera
- **Style closing**: "Ultra realistic photography with modern marketing layout"

O tool call do Flash passará a retornar esses campos separados em vez de um blob único.

### 4. Adicionar campo "Nome da marca" no wizard (`ClienteRedesSociais.tsx`)

Os exemplos incluem o nome da marca (ex: "P2Y crédito e investimento", "Saura"). Adicionar um campo opcional no bloco de identidade visual para o nome da marca que será incluído no prompt.

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/generate-social-image/index.ts` | Remover proibição de texto, reestruturar prompt em seções (Scene/Environment/Layout/Text/Mood), reformular instrução de referências |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Adicionar campo "Nome da marca" no bloco de identidade visual |

## Exemplo de Prompt que o Sistema Passará a Gerar

Com os inputs: headline "Escalar não é sorte", subheadline "É processo", CTA "Conheça o método", cena "Empresário analisando dashboard", cores "preto e verde limão", referências anexas:

```
Use the attached images ONLY as brand style references.
Replicate the brand design system including: color palette, layout structure,
card shapes, icon elements, typography style, and design language.
Do NOT recreate the same scene from the references. Create a NEW scene.

Scene:
A Brazilian businessman analyzing a sales dashboard on a modern laptop,
looking confident and focused on the growth metrics displayed on screen.

Environment:
Modern minimalist office with natural daylight, clean desk setup,
professional corporate atmosphere.

Design layout:
Top portion: lifestyle photography of the businessman.
Bottom portion: dark rounded card layout with text and lime green highlights.

Color palette:
Black, white and lime green accents consistent with the brand references.

Format:
Portrait 4:5 (1080×1350px) social media post.

Text in Portuguese:
Headline: Escalar não é sorte
Highlight headline: É processo
CTA: Conheça o método

Mood:
Professional growth, business strategy, confidence, modern entrepreneurship.

Ultra realistic photography with modern marketing layout.
```

Esse formato é equivalente aos prompts de exemplo que geraram ótimos resultados.

