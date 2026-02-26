

## Geração de Vídeos Reais para Redes Sociais (Reels 9:16)

### Conceito

Gerar vídeos curtos reais (MP4) no formato Reels (9:16, 1080x1920) a partir de keyframes gerados por IA. O fluxo:

1. A IA gera o roteiro com timecodes (já implementado)
2. A IA gera 4-6 imagens-chave (keyframes) representando cada cena do roteiro
3. O ffmpeg.wasm (já instalado no projeto) monta essas imagens em um vídeo MP4 com transições suaves (fade/crossfade)
4. O vídeo final é salvo no bucket `social-arts` e disponibilizado para download

```text
Roteiro IA → Keyframes (4-6 imagens 9:16) → ffmpeg.wasm → MP4 Reels
```

---

### 1. Nova Edge Function: `generate-social-video-frames`

**Arquivo**: `supabase/functions/generate-social-video-frames/index.ts`

- Recebe: `video_description` (frame-by-frame), `visual_prompt_thumbnail`, identidade visual, referências
- Gera 4-6 imagens sequenciais em formato 9:16 (1080x1920) usando `google/gemini-3-pro-image-preview`
- Cada imagem representa uma cena do roteiro (ex: cena 1 = gancho, cena 2 = contexto, etc.)
- Faz upload de cada frame para `social-arts/videos/{orgId}/{artId}/frame-{n}.png`
- Retorna array de URLs dos frames
- Custo: 100 creditos por frame (400-600 total por video)

---

### 2. Montagem do Vídeo no Cliente com ffmpeg.wasm

**Arquivo**: `src/lib/videoGenerator.ts` (novo)

- Função `generateVideoFromFrames(frameUrls: string[], options)`:
  - Carrega o ffmpeg.wasm
  - Baixa cada frame e escreve no filesystem virtual do ffmpeg
  - Monta o vídeo com duração de 2-3s por frame, transição fade entre cenas
  - Exporta como MP4 em 9:16 (1080x1920)
  - Retorna Blob do vídeo
- Parâmetros configuráveis: duração por frame, tipo de transição, FPS

---

### 3. Alterações na UI

**Arquivo**: `src/pages/cliente/ClienteRedesSociais.tsx`

Alterações no fluxo de geração (quando `bIncluirVideo = true`):

- Após gerar conceitos e artes estáticas, adicionar etapa: "Gerando vídeo..."
- Chamar `generate-social-video-frames` para gerar os keyframes
- Chamar `generateVideoFromFrames()` no cliente para montar o MP4
- Upload do MP4 final para `social-arts/videos/{orgId}/{artId}/reel.mp4`
- Salvar `videoUrl` no objeto da arte

Na aba "Vídeo" do editor:
- Player de vídeo HTML5 com o Reel gerado (em vez de só mostrar o roteiro)
- Botão "Baixar Vídeo (MP4)" para download direto
- Manter roteiro, storyboard e sugestão de áudio abaixo do player
- Indicador de progresso durante a geração ("Gerando frame 2/5...")

---

### 4. Tipo atualizado

No tipo `SocialArt`:
- Adicionar `videoUrl?: string | null` — URL do vídeo MP4 gerado
- Adicionar `videoFrameUrls?: string[]` — URLs dos keyframes individuais

---

### Resumo de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/generate-social-video-frames/index.ts` | Criar | Edge function para gerar keyframes sequenciais |
| `src/lib/videoGenerator.ts` | Criar | Utilitário ffmpeg.wasm para montar MP4 a partir de frames |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Editar | Integrar geração de vídeo no fluxo + player na aba Vídeo |

### Ordem de Implementação

1. Edge function `generate-social-video-frames`
2. Utilitário `videoGenerator.ts` com ffmpeg.wasm
3. Integração na UI: fluxo de geração + player de vídeo
