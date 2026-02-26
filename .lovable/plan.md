

## Referências Visuais para Geração de Artes com IA

### Problema
Atualmente o cliente preenche campos de texto para descrever o que deseja, mas a IA não tem contexto visual real. Permitir envio de imagens de referência (uploads e URLs) dá à IA a capacidade de "ver" o estilo desejado e gerar prompts muito mais precisos.

---

### Arquitetura da Solução

```text
Cliente envia referencias (imagens + URLs)
           |
           v
  generate-social-concepts (multimodal)
  → IA analisa as referencias visuais
  → Gera prompts ultra-detalhados baseados no estilo visto
           |
           v
  generate-social-image (usa os prompts enriquecidos)
  → Arte final gerada com contexto visual real
```

A chave é usar o modelo multimodal (Gemini) que aceita imagens como input na etapa de geração de conceitos. A IA vê as referências e extrai estilo, composição, paleta e mood para criar prompts melhores.

---

### 1. UI — Campo de Referências Visuais no Briefing

**Arquivo**: `src/pages/cliente/ClienteRedesSociais.tsx`

Adicionar no wizard de briefing (etapa "briefing"), antes do botão de gerar:

- **Seção "Referências Visuais"** com:
  - Upload de até 5 imagens (drag & drop ou botão) para o bucket `social-arts`
  - Input de URL para colar links de imagens de referência (Instagram, Pinterest, sites)
  - Preview em miniatura das imagens adicionadas com botão de remover
  - HelpTooltip explicando: "Envie exemplos de artes que você gosta. A IA analisa o estilo, cores e composição para criar algo similar."

- **Estado novo**:
  - `bReferenceImages: { url: string; isUpload: boolean }[]` — lista de URLs (uploads e links externos)
  - `uploadingRef: boolean` — estado de loading do upload

- **Upload**: Envia para `social-arts/references/{orgId}/{timestamp}-{filename}` e obtém URL pública

- **Passagem para a edge function**: As URLs são enviadas no body como `reference_images: string[]`

---

### 2. Edge Function — Conceitos com Análise Multimodal

**Arquivo**: `supabase/functions/generate-social-concepts/index.ts`

Alterações:
- Receber `reference_images: string[]` no body
- Montar a mensagem do usuário como array multimodal (content parts):
  ```text
  [
    { type: "text", text: "Briefing do cliente: ..." },
    { type: "image_url", image_url: { url: "https://..." } },
    { type: "image_url", image_url: { url: "https://..." } },
    { type: "text", text: "Analise as imagens acima como referências visuais..." }
  ]
  ```
- Adicionar instrução no system prompt:
  ```text
  REFERENCE IMAGES: The user has provided visual references.
  Analyze them carefully:
  - Extract the dominant color palette
  - Identify the composition style (grid, centered, asymmetric)
  - Note the lighting approach (soft, dramatic, flat)
  - Observe textures, materials, and visual elements
  - Understand the overall mood and aesthetic
  
  Your generated visual_prompt_feed and visual_prompt_story MUST
  replicate the style, mood, and quality seen in these references
  while adapting to the brand identity and briefing.
  ```
- Trocar o modelo para `google/gemini-2.5-flash` (suporta multimodal com imagens e é eficiente)

---

### 3. Edge Function — Geração de Imagem com Referência

**Arquivo**: `supabase/functions/generate-social-image/index.ts`

Alterações:
- Receber `reference_images: string[]` opcional no body
- Se houver referências, montar a mensagem como multimodal:
  ```text
  messages: [{
    role: "user",
    content: [
      { type: "text", text: fullPrompt },
      { type: "image_url", image_url: { url: ref1 } },
      { type: "image_url", image_url: { url: ref2 } },
      { type: "text", text: "Use these reference images as style guide..." }
    ]
  }]
  ```
- Adicionar no prompt: "Study the provided reference images and match their visual style, color treatment, composition approach, and overall aesthetic quality."
- Limitar a no máximo 3 referências para não estourar context

---

### 4. Identidade Visual — Campo de Banco de Imagens

**Arquivo**: `src/pages/cliente/ClienteRedesSociais.tsx`

Na aba "Identidade Visual", o campo `image_bank_urls` já existe na tabela mas não está sendo usado na UI. Adicionar:
- Seção "Banco de Imagens" com upload múltiplo
- Essas imagens ficam salvas permanentemente e podem ser usadas como referências padrão em toda geração
- Na geração, se o cliente não enviar referências específicas, usar as imagens do banco como fallback

---

### Resumo de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/cliente/ClienteRedesSociais.tsx` | Editar | Campo de upload/URL de referências no briefing + banco de imagens na identidade visual |
| `supabase/functions/generate-social-concepts/index.ts` | Editar | Receber e analisar imagens de referência via multimodal |
| `supabase/functions/generate-social-image/index.ts` | Editar | Usar referências como style guide na geração |

### Detalhes Técnicos

- **Modelo multimodal**: `google/gemini-2.5-flash` para conceitos (aceita imagens, rápido e eficiente)
- **Modelo de imagem**: Mantém `google/gemini-3-pro-image-preview` para geração final
- **Storage**: Bucket `social-arts` (já existe, público) — path `references/{orgId}/`
- **Limite**: Máximo 5 referências no briefing, máximo 3 enviadas para geração de imagem
- **Formato multimodal**: Array de content parts com `type: "image_url"` conforme spec da API Lovable AI Gateway

