

# Correções: Logo SVG, Fotos na Arte e Mockups de Diagramação

## Problemas Identificados

1. **Logo SVG não funciona**: A função `urlToBase64` no backend filtra SVGs (retorna `null`). O Stage 3 (composição da logo) falha silenciosamente — a arte sai sem logo ou com uma logo inventada pela IA.
2. **Sem opção de anexar fotos**: O wizard só tem "Referências visuais" (para estilo) — não há campo para fotos reais que devem aparecer NA arte.
3. **Mockups muito abstratos**: Os SVGs do `LayoutPicker` são formas geométricas minimalistas, difíceis de interpretar.

---

## Correção 1: Suporte a Logo SVG

**Problema técnico**: `urlToBase64()` no edge function descarta SVGs na linha 23. Quando a logo é SVG, o Stage 3 não recebe nada.

**Solução**: Converter SVG para PNG via renderização antes de enviar ao modelo de IA.

**`supabase/functions/generate-social-image/index.ts`**:
- Na função `urlToBase64`, quando o MIME type é `svg`, usar o modelo de IA para converter o SVG em PNG (renderizar o SVG como imagem raster)
- Alternativa mais simples: no Stage 3, se a logo é SVG, fazer uma chamada específica pedindo ao modelo para "renderizar este SVG como PNG limpo" antes da composição
- Adicionar log de warning claro quando a logo é ignorada

**`src/components/cliente/social/RefUploader.tsx`**:
- No upload de logo (`handleLogoUpload`), detectar se o arquivo é SVG
- Se for SVG, mostrar um aviso ao usuário: "Logo em SVG detectada. Recomendamos enviar em PNG para melhor resultado"
- Opcionalmente, converter SVG → PNG no frontend usando Canvas API antes do upload

## Correção 2: Campo de Fotos Separado

**Problema**: O usuário quer incluir fotos específicas NA arte (ex: foto de produto, foto de pessoa), mas só existe campo de "referências" que são usadas para extrair estilo visual.

**Solução**: Adicionar um campo "Fotos para a arte" no Step 4 do wizard.

**`src/components/cliente/social/ArtWizard.tsx`**:
- Adicionar estado `photoUrls` (fotos que devem aparecer na arte)
- No Step 4, criar seção separada: "📷 Fotos para incluir na arte" com uploader dedicado
- Texto explicativo: "Essas fotos serão usadas diretamente na composição da arte"
- Passar `photoUrls` no payload de geração

**`src/components/cliente/social/RefUploader.tsx`**:
- Extrair lógica de upload em componente reutilizável ou adicionar prop `mode` ("reference" | "photo")
- Modo "photo" tem label e descrição diferentes

**`supabase/functions/generate-social-image/index.ts`**:
- Receber `photo_images` no body
- Converter para base64 e incluir no prompt de geração como "PHOTOS TO INCLUDE IN THE DESIGN" (separado das referências de estilo)
- Instruir o modelo: "These photos must appear IN the final design as visual elements"

**`src/hooks/useClientePosts.ts`**:
- Adicionar `photo_image_urls` ao payload do `useGeneratePost`

## Correção 3: Mockups Mais Realistas

**Problema**: Os SVGs do `LayoutPicker` são retângulos e círculos abstratos — difícil entender a diagramação.

**Solução**: Redesenhar cada mockup SVG com mais detalhes visuais realistas.

**`src/components/cliente/social/LayoutPicker.tsx`**:
- Redesenhar todos os 9 mockups `LayoutMockupSvg` com:
  - Representação mais clara de texto (linhas de diferentes tamanhos representando headline, sub, body)
  - Ícones reconhecíveis (silhueta de foto, logo placeholder, botão CTA com bordas arredondadas)
  - Separação visual clara entre zonas (texto vs imagem vs overlay)
  - Uso de cores mais contrastantes para diferenciar áreas
  - Labels minúsculos dentro do SVG ("FOTO", "TEXTO", "CTA", "LOGO") para orientar
  - Proporção mais fiel ao resultado real
- Aumentar o tamanho do viewBox para mais detalhes
- Adicionar mini-labels de texto nos SVGs (ex: "HEADLINE" em miniatura)

---

## Tabela de Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/generate-social-image/index.ts` | SVG→PNG para logos, receber `photo_images` |
| `src/components/cliente/social/RefUploader.tsx` | Aviso SVG, modo "photo" |
| `src/components/cliente/social/ArtWizard.tsx` | Campo "Fotos para arte", passar photos no payload |
| `src/components/cliente/social/LayoutPicker.tsx` | Redesenhar 9 mockups mais realistas |
| `src/hooks/useClientePosts.ts` | Adicionar `photo_image_urls` ao payload |

## Ordem de Execução

1. Mockups realistas no LayoutPicker (visual imediato)
2. Suporte a SVG no backend (logo)
3. Aviso de SVG no frontend
4. Campo de fotos separado no wizard
5. Integração de fotos no edge function

