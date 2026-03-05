

# Plano: Wizard de Vídeo com mesma qualidade do fluxo de Artes

## Problema

O wizard de vídeo atual tem 6 steps simples sem briefing com IA, sem referências obrigatórias, sem plataforma de publicação, sem estilo visual e sem revisão completa. Precisa seguir a mesma lógica do wizard de artes: IA preenche campos, referências ancoram identidade, e o prompt gerado segue a estrutura dos 5 exemplos fornecidos.

## Mudanças

### 1. Novo edge function: `generate-video-briefing`

Gemini Flash recebe briefing de texto livre (ou content_data) e retorna campos estruturados para vídeo via tool calling:

```json
{
  "plataforma": "instagram_reels",
  "formato_video": "9:16",
  "duracao": "8s",
  "descricao_cena": "...",
  "acao_cena": "...",
  "mensagem_video": "...",
  "estilo_visual": "...",
  "suggested_cta": "..."
}
```

**Arquivo:** `supabase/functions/generate-video-briefing/index.ts`

### 2. Refatorar wizard de vídeo para 8 steps

Seguindo os 9 blocos definidos pelo usuário:

| Step | Bloco | Conteúdo |
|------|-------|----------|
| 1 | Briefing | Textarea livre + botão "Preencher com IA" + seletor de conteúdo (igual ao de artes) |
| 2 | Plataforma | Instagram Reels, TikTok, YouTube Shorts, Feed Instagram, YouTube (define formato automaticamente) |
| 3 | Formato + Duração | 9:16 / 1:1 / 16:9 + 5s / 8s (formato auto-selecionado pela plataforma, editável) |
| 4 | Referências visuais | Upload de referências (recomendado, min 3 para melhor resultado) + banco de imagens da identidade |
| 5 | Cena + Ação | Descrição do cenário + o que acontece (pré-preenchido pela IA) |
| 6 | Mensagem + CTA | Frase principal + CTA (pré-preenchido pela IA) |
| 7 | Estilo visual | Seleção de estilo (corporativo moderno, premium minimalista, etc.) + identidade visual automática |
| 8 | Revisão | Resumo completo de todos os campos + thumbnails das referências |

**Arquivo:** `src/pages/cliente/ClienteRedesSociais.tsx` — refatorar `renderVideoStep()`, atualizar `totalVideoSteps` para 8, adicionar novos states (plataforma, estiloVisual, acaoCena)

### 3. Refatorar `generate-social-video-frames` para usar prompt estruturado

O prompt atual é genérico. Precisa seguir a estrutura exata dos 5 exemplos:

```
Create a {duracao}-second {formato} social media video ({aspect_ratio}).

Scene: {descricao_cena}

Action: {acao_cena}

Environment: {ambiente extraído da cena}

Style: {estilo_visual}

Text overlay:
"{mensagem_video}"

Final message:
"{cta}"
```

Receber campos adicionais: `plataforma`, `estilo_visual`, `acao_cena`. Construir o prompt por frame seguindo essa estrutura.

**Arquivo:** `supabase/functions/generate-social-video-frames/index.ts`

### 4. Hook: adicionar `useGenerateVideoBriefing`

Nova mutation que chama `generate-video-briefing`.

**Arquivo:** `src/hooks/useClientePosts.ts`

### 5. Ajustes no `handleGenerate` e `useGeneratePost`

Passar os novos campos (plataforma, estilo_visual, acao_cena) ao edge function de vídeo.

**Arquivo:** `src/hooks/useClientePosts.ts` + `src/pages/cliente/ClienteRedesSociais.tsx`

## Constantes novas no wizard

```typescript
const VIDEO_PLATFORMS = [
  { value: "instagram_reels", label: "Instagram Reels", format: "story" },
  { value: "tiktok", label: "TikTok", format: "story" },
  { value: "youtube_shorts", label: "YouTube Shorts", format: "story" },
  { value: "instagram_feed", label: "Feed Instagram", format: "feed" },
  { value: "youtube", label: "YouTube", format: "banner" },
];

const VIDEO_STYLES = [
  { value: "corporativo_moderno", label: "Corporativo moderno" },
  { value: "premium_minimalista", label: "Premium minimalista" },
  { value: "publicidade_sofisticada", label: "Publicidade sofisticada" },
  { value: "social_media", label: "Estilo social media" },
  { value: "inspiracional", label: "Inspiracional" },
];
```

## Arquivos modificados/criados

| Arquivo | Ação |
|---|---|
| `supabase/functions/generate-video-briefing/index.ts` | Criar — IA extrai campos de vídeo do briefing |
| `supabase/functions/generate-social-video-frames/index.ts` | Refatorar — prompt estruturado igual aos exemplos |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Refatorar — wizard vídeo 8 steps com briefing IA |
| `src/hooks/useClientePosts.ts` | Adicionar mutation + campos novos no payload |
| `supabase/config.toml` | Adicionar entry para generate-video-briefing |

