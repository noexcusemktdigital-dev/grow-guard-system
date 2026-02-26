

## Plano: Motion Graphics com Canvas + MediaRecorder (sem API externa)

Substituir o pipeline atual de FFmpeg.wasm (slideshow de imagens estaticas) por um motor de motion graphics no browser usando **Canvas 2D + MediaRecorder API**, que gera videos MP4 reais com:

- **Ken Burns effect** (zoom/pan cinematico) nos frames IA
- **Texto animado** (fade-in, typewriter, slide-up) sincronizado com cada cena
- **Transicoes suaves** (dissolve, slide, blur) entre frames
- **Overlays dinamicos** (CTA, hashtags, logo) com animacao

---

### Arquitetura

```text
[Frames IA (generate-social-video-frames)]
           |
           v
[MotionGraphicsEngine (Canvas 2D)]
  - Carrega frames como imagens
  - Aplica Ken Burns (zoom 1.0->1.15, pan suave)
  - Renderiza texto animado por cena (typewriter/fade)
  - Transicao dissolve entre cenas
  - CTA final animado
           |
           v
[MediaRecorder API -> WebM Blob]
           |
           v
[Upload para Storage -> URL publica]
```

---

### Mudancas

**1. Novo arquivo: `src/lib/motionGraphicsEngine.ts`**

Motor de rendering principal:
- Classe `MotionGraphicsEngine` que recebe frames, textos por cena e config
- Loop de rendering a 30fps usando `requestAnimationFrame`
- Ken Burns: cada frame faz zoom gradual de 1.0x para 1.15x e pan sutil
- Texto: renderiza com efeito typewriter (letra por letra) ou fade-in no Canvas
- Transicoes: crossfade alpha entre frames consecutivos (0.5s)
- Grava o canvas via `canvas.captureStream()` + `MediaRecorder`
- Retorna `Blob` (video/webm) ao finalizar
- Callback `onProgress` para feedback visual

Parametros configuráveis:
- `frameDurationMs`: duracao de cada cena (default 3000ms)
- `transitionDurationMs`: duracao da transicao (default 500ms)
- `fps`: frames por segundo (default 30)
- `textStyle`: fonte, cor, posicao do texto
- `kenBurnsIntensity`: intensidade do zoom (default 0.15)
- `outputWidth/Height`: 1080x1920 (vertical)

**2. Atualizar: `supabase/functions/generate-social-video-frames/index.ts`**

Melhorias no prompt de cada frame:
- Adicionar instrucao para gerar frames com variacao sutil de angulo/composicao (para Ken Burns ficar mais dinamico)
- Incluir `reference_images` no contexto visual
- Retornar tambem os textos de overlay por cena (titulo curto, CTA) para o motor de motion graphics

Novo campo no retorno:
```json
{
  "frameUrls": ["..."],
  "sceneTexts": [
    { "main": "Texto principal cena 1", "sub": "Subtexto" },
    { "main": "Texto principal cena 2", "sub": "CTA final" }
  ]
}
```

**3. Atualizar: `src/pages/cliente/ClienteRedesSociais.tsx`**

Na funcao `handleGenerate`, substituir a chamada ao `generateVideoFromFrames` (FFmpeg) pelo novo `MotionGraphicsEngine`:
- Importar `renderMotionGraphics` do novo modulo
- Passar os frames IA + textos das cenas + identidade visual
- Upload do blob resultante para Storage
- Manter preview do video no card da arte

**4. Remover dependencia FFmpeg (opcional)**

O arquivo `src/lib/videoGenerator.ts` pode ser mantido como fallback ou removido. As dependencias `@ffmpeg/ffmpeg` e `@ffmpeg/util` podem ser removidas do package.json para reduzir o bundle (~25MB de WASM).

---

### Detalhes do Motor de Rendering

**Ken Burns Effect:**
```text
Frame 1: zoom 1.00 -> 1.15, pan left->center (3s)
Transicao: dissolve 0.5s
Frame 2: zoom 1.15 -> 1.00, pan center->right (3s)
Transicao: dissolve 0.5s
Frame 3: zoom 1.00 -> 1.10, pan right->center (3s)
...
```

**Texto Animado (por cena):**
```text
t=0.0s: Texto aparece letra por letra (typewriter, 50ms/char)
t=1.5s: Texto completo, pausa
t=2.5s: Texto fade-out (0.3s)
t=3.0s: Transicao para proxima cena
```

**Gravacao:**
- `canvas.captureStream(30)` captura o stream do canvas
- `MediaRecorder` com `mimeType: 'video/webm;codecs=vp9'`
- Ao final, junta os chunks em um Blob
- Upload direto para Storage

---

### Resumo de Arquivos

| Arquivo | Acao |
|---------|------|
| `src/lib/motionGraphicsEngine.ts` | Criar — motor de motion graphics com Canvas + MediaRecorder |
| `supabase/functions/generate-social-video-frames/index.ts` | Editar — retornar textos de cena junto com frames |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Editar — usar novo motor no lugar do FFmpeg |
| `src/lib/videoGenerator.ts` | Remover — substituido pelo novo motor |

