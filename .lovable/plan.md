

# Logo Real na Arte + Multi-Layout + Extração de Logo das Referências

## Problema raiz

O modelo de geração de imagem (Gemini 3 Pro Image Preview) recebe a logo como imagem de referência no Stage 2, mas **tenta recriar/redesenhar a logo em vez de usá-la fielmente**. Isso acontece porque:

1. A logo é enviada como uma `image_url` junto com o prompt de texto, mas o modelo de geração de imagem **não faz composição literal** — ele interpreta a imagem como referência visual e gera algo "inspirado" nela
2. Não existe um mecanismo de **extração de logo das referências** como fallback
3. O LayoutPicker só aceita seleção única (1 layout)

## Solução em 3 frentes

### Frente 1: Logo fiel na arte gerada

O modelo de imagem generativa não consegue "colar" uma logo pixel-perfect. A solução é uma **abordagem de 2 passos**:

1. **Stage 2 (geração)**: Gerar a arte normalmente mas instruir o modelo a **reservar espaço** para a logo (deixar um espaço vazio/limpo no canto onde a logo será sobreposta)
2. **Stage 3 (composição — NOVO)**: Usar o modelo **image editing** (`google/gemini-3.1-flash-image-preview`) para **sobrepor a logo real** na arte gerada. O prompt de edição será: "Place this exact logo image in the [top-left/top-right] corner of this design. Do not modify, redraw or stylize the logo — use it exactly as provided."

Isso garante que a logo real do cliente aparece na arte final.

**Arquivos**: `supabase/functions/generate-social-image/index.ts`

### Frente 2: Extração automática de logo das referências

Quando o cliente **não envia logo separadamente**, usar o modelo de IA para **detectar e extrair a logo** das imagens de referência:

1. Adicionar uma função `extractLogoFromReferences()` na edge function
2. Enviar as referências ao modelo com o prompt: "Identify and extract the brand logo from these reference images. Return a description of the logo (shape, colors, text) so it can be reproduced accurately."
3. Na UI (RefUploader): Adicionar botão **"Extrair logo das referências"** que chama uma nova função ou usa a lógica inline
4. Se a extração encontrar logo, preencher automaticamente o campo `logoUrl` com a melhor versão encontrada

Como o modelo não pode "recortar" uma logo, a abordagem alternativa é:
- Usar `google/gemini-3.1-flash-image-preview` com uma referência que contém a logo + prompt "Extract only the logo/brand mark from this image, place it on a transparent/white background, remove everything else"
- Salvar o resultado no storage e usar como `logoUrl`

**Arquivos**: 
- `supabase/functions/generate-social-image/index.ts` (nova função `extractLogoFromReferences`)
- `src/components/cliente/social/RefUploader.tsx` (botão "Extrair logo")

### Frente 3: Multi-layout (selecionar até 2 diagramações)

Permitir que o cliente escolha **1 ou 2 layouts**. Quando 2 são selecionados, o sistema gera **variações separadas** (uma arte por layout).

1. **LayoutPicker**: Mudar de seleção única para multi-select (máx 2)
2. **ArtWizard**: `layoutType: string` → `layoutTypes: string[]`
3. **Geração**: Se 2 layouts selecionados, multiplicar a quantidade de peças por 2 (uma variação por layout). Cada variação usa as mesmas refs/logo/briefing mas com layout diferente.
4. **Custo**: Informar claramente que 2 layouts = 2x o custo em créditos

**Arquivos**:
- `src/components/cliente/social/LayoutPicker.tsx` (multi-select, máx 2)
- `src/components/cliente/social/ArtWizard.tsx` (layoutTypes array, lógica de geração)
- `src/components/cliente/social/constants.ts` (sem mudanças)
- `src/pages/cliente/ClienteRedesSociais.tsx` (adaptar payload)
- `src/hooks/useClientePosts.ts` (adaptar tipo)

## Detalhes técnicos

### Stage 3 — Composição de logo (nova etapa na edge function)

```text
Arte gerada (Stage 2) + Logo original → Edit Image API → Arte final com logo real
```

O prompt de edição:
```
"Place this brand logo in the [position] corner of the design image. 
The logo must appear exactly as provided — same colors, same shape, same proportions. 
Do NOT redraw, stylize or modify the logo in any way. 
Scale it to approximately 8-12% of the image width. 
Maintain the design composition around the logo area."
```

Modelo: `google/gemini-3.1-flash-image-preview` (rápido, boa qualidade de edição)

### Extração de logo — Prompt

```
"Look at this reference image. Extract ONLY the brand logo/logotype from it. 
Place the extracted logo on a clean white background. 
Remove all other elements — keep only the logo mark and/or brand text. 
Maintain original colors and proportions of the logo."
```

### Multi-layout na UI

O LayoutPicker mostrará um badge "Máx. 2" e permitirá toggle de seleção. Ao selecionar 2, o step de review mostrará "2 variações serão geradas" com o custo atualizado.

### Upload de logo — Formatos aceitos

O `accept="image/*"` já aceita JPEG, PNG, WebP, GIF. O filtro SVG está na edge function (urlToBase64). Não há restrição de formato no frontend — qualquer formato raster funciona.

## Ordem de implementação

1. Edge function: Stage 3 de composição de logo (resolve o problema principal)
2. Edge function: Extração de logo das referências (fallback)
3. Frontend: RefUploader com botão de extração + aceitar qualquer formato
4. Frontend: LayoutPicker multi-select (máx 2)
5. Frontend: ArtWizard adaptado para array de layouts + variações
6. Testes end-to-end

