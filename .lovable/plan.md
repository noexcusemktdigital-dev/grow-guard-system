

## Corrigir Logo SVG + Restringir Conteúdo ao Aprovado

### Problema 1: Logo SVG fica branca
A função `urlToBase64` converte SVG para PNG via IA com instrução "render on a solid white background". Se a logo for branca/clara, fica invisível. Além disso, o modelo pode falhar na conversão.

**Solução** em `generate-social-image/index.ts`:
- Mudar a instrução de conversão SVG de "solid white background" para **"transparent background"** — usar `data:image/png` com canal alpha
- Como fallback, se a conversão falhar, tentar usar o SVG diretamente como base64 (`data:image/svg+xml;base64,...`) no Stage 3
- No Stage 3 (composição da logo), reforçar: "The logo has a transparent background. Place it directly without adding any background behind it unless the area is too busy for legibility."

### Problema 2: IA adiciona textos e imagens extras
O prompt atual não restringe o conteúdo. A IA inventa textos adicionais e gera imagens mesmo quando fotos foram anexadas.

**Solução** em `generate-social-image/index.ts`:
- Adicionar regra no prompt final: **"MANDATORY: Render ONLY the text elements provided below. Do NOT add, invent, or include ANY additional text, words, phrases, taglines, watermarks, or labels beyond what is explicitly listed."**
- Quando `photo_images` estão presentes, adicionar: **"MANDATORY: Use ONLY the attached photos as visual/photographic elements. Do NOT generate, add, or include ANY additional photographs, people, objects, or illustrated elements beyond the provided photos."**
- Quando `photo_images` NÃO estão presentes, manter comportamento atual (IA gera imagens livremente)
- No `buildFinalPrompt`, adicionar essas restrições como regras finais obrigatórias
- No `buildFallbackPrompt`, mesma coisa

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/generate-social-image/index.ts` | Fix SVG conversion (transparent bg), restringir textos/imagens ao aprovado |

