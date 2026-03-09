

## Plano: Upgrade do Pipeline de Geração de Imagem (Prompt Quality)

### Problema Identificado

Comparando o prompt de referência (ChatGPT) com o que nosso CoT gera, há 5 gaps principais:

1. **Referências não alimentam o CoT** — O Stage 1 (Chain-of-Thought) não recebe as imagens de referência. Ele gera o prompt "às cegas" sobre a identidade visual. Só o Stage 2 (geração) recebe as refs, mas sem instruções estruturadas sobre o que extrair delas.

2. **Instrução de referência genérica** — O bloco `referenceInstruction` atual diz "study and replicate" mas não lista elementos concretos como "rounded card shapes, circular icon elements, lime green highlights" que o prompt de referência especifica.

3. **Falta hierarquia completa de texto** — O prompt de referência inclui: Headline, Highlight headline, Supporting text, Bullet points, Brand. Nosso CoT junta tudo num único `text_overlay_instructions` sem essa granularidade.

4. **Falta separação de zonas do layout** — O prompt de referência diz "Top portion: lifestyle photo... Bottom portion: dark rounded card layout". Nosso CoT não tem essa especificidade de zonas.

5. **Falta instrução explícita de "novo cenário"** — O prompt de referência tem duas instruções separadas: "Do NOT recreate same scene" E "Create a NEW scene that follows the same brand design language".

### Mudanças

**Arquivo: `supabase/functions/generate-social-image/index.ts`**

1. **Enviar referências ao CoT (Stage 1)** — Converter refs em base64 e enviar como multimodal input para o Gemini Flash no CoT, com instrução: "Analyze these brand reference images and extract: color system, layout patterns, card shapes, icon styles, typography, photographic style". O CoT então produz `brand_design_elements` baseado na análise real das imagens, não em suposição.

2. **Expandir `StructuredPromptResult`** com novos campos:
   - `reference_style_replication`: lista de 6-10 elementos visuais extraídos das referências (ex: "black and white base layout, lime green highlight color, rounded card shapes")
   - `text_hierarchy`: objeto estruturado com headline, highlight_headline, supporting_text, bullet_points, cta, brand — cada um com posição, tamanho e cor
   - `layout_zones`: descrição de zonas (ex: "Top 60%: photo zone. Bottom 40%: dark card with text")

3. **Reestruturar `referenceInstruction`** para seguir o formato do prompt de referência:
   ```
   Use the attached images ONLY as brand style references.
   Replicate the brand design system including:
   - {element 1 from CoT analysis}
   - {element 2}
   ...
   IMPORTANT: Do NOT recreate the same people, scene or composition.
   Create a NEW scene that follows the same brand design language.
   ```

4. **Reestruturar `buildFinalPrompt`** para seguir a hierarquia do prompt de referência:
   ```
   Reference instruction (with analyzed elements)
   Scene
   Environment
   Design layout (with zone descriptions)
   Color palette
   Format
   Text in Portuguese (with full hierarchy)
   Brand
   Mood
   Style closing line
   ```

5. **Passar `supporting_text` e `bullet_points`** para o CoT (atualmente não são passados no contexto).

### Resultado Esperado

O prompt gerado pelo nosso pipeline ficará estruturalmente equivalente ao prompt de referência do ChatGPT, com a vantagem de ser gerado automaticamente a partir das respostas do wizard + análise multimodal das referências.

