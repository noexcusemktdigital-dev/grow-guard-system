
# Editor de Video -- Timeline estilo CapCut + Legendas Automaticas

## Resumo

Reformular o editor de video para ter uma **timeline visual** no estilo CapCut (simplificada), com sistema de **corte e juncao** intuitivo e **legendas geradas automaticamente** via IA (transcricao do audio do video).

---

## O que muda

### 1. Timeline Visual estilo CapCut (embaixo do player)

Substituir a timeline atual (barra simples) por uma timeline horizontal rica:

```text
+---------------------------------------------------------------+
|  [Player de Video com overlays]                               |
+---------------------------------------------------------------+
|  Toolbar: [Cortar] [Desfazer] [Deletar segmento]             |
+---------------------------------------------------------------+
|  Timeline (scroll horizontal):                                |
|  +--------+  +--------+  +--------+                          |
|  | Seg 1  |  | Seg 2  |  | Seg 3  |   <-- thumbnails         |
|  | 0:00   |  | 0:15   |  | 0:28   |                          |
|  +--------+  +--------+  +--------+                          |
|                                                               |
|  [Legendas] ====[Texto 1]=====  ==[Texto 2]==                |
|  [Musica]   ====================================              |
|  [Inserts]       =====[Logo]====                              |
|                                                               |
|  Playhead (linha vermelha vertical que acompanha o tempo)     |
+---------------------------------------------------------------+
```

**Tracks da timeline:**
- **Track de Video** (principal): mostra segmentos como blocos com thumbnails geradas via canvas. Clicando no bloco, seleciona o segmento. Playhead vermelho se move conforme o video toca.
- **Track de Legendas**: blocos coloridos representando cada legenda com texto visivel.
- **Track de Musica**: barra unica representando o audio de fundo (se houver).
- **Track de Inserts**: blocos para cada insert de imagem.

**Interacoes:**
- Clicar na timeline para posicionar o playhead
- Scroll horizontal para navegar pela duracao
- Zoom in/out da timeline (slider ou +/-)

### 2. Cortes: ferramenta de dividir e remover

O sistema de cortes funciona assim:
1. Posicione o playhead onde quer cortar
2. Clique em "Cortar" (icone tesoura) -- divide o segmento em dois
3. Selecione o segmento indesejado e clique "Deletar" (ou tecla Delete)
4. O video resultante sera a juncao dos segmentos restantes

**Mudancas no hook `useVideoEditor`:**
- Adicionar `selectedSegmentId` para rastrear segmento selecionado
- `splitAtCurrentTime()` divide o segmento onde esta o playhead
- `deleteSegment(id)` remove o segmento selecionado
- O player pula segmentos deletados durante a reproducao (ao chegar no fim de um segmento, vai para o inicio do proximo)

### 3. Legendas Automaticas via IA

Em vez de adicionar legendas manualmente, o usuario clica **"Gerar Legendas"** e o sistema:

1. Extrai o audio do video (via FFmpeg.wasm no browser -- converte para WAV/MP3)
2. Envia o audio para uma edge function que usa o modelo Gemini para transcrever
3. Recebe o texto com timestamps (formato SRT/segmentado)
4. Popula automaticamente a lista de legendas com timing correto

**Edge function `transcribe-video-audio`:**
- Recebe o audio em base64 ou como upload
- Usa Gemini 2.5 Flash (suporta audio) via LOVABLE_API_KEY
- Retorna array de `{ text, startTime, endTime }`

**Painel de legendas apos geracao:**
- Lista editavel (o usuario pode corrigir texto, ajustar timing, mudar estilo)
- Botao "Gerar Legendas" com loading state
- Opcao de limpar todas e regerar

---

## Arquivos

### Novos

| Arquivo | Descricao |
|---------|-----------|
| `src/components/video/EditorTimeline.tsx` | Timeline visual multi-track com playhead, zoom, scroll horizontal |
| `src/components/video/TimelineTrack.tsx` | Componente generico de track (video, legendas, musica, inserts) |
| `src/components/video/TimelineToolbar.tsx` | Barra de ferramentas (Cortar, Deletar, Desfazer, Zoom) |
| `supabase/functions/transcribe-video-audio/index.ts` | Edge function para transcricao via Gemini |

### Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useVideoEditor.ts` | Adicionar `selectedSegmentId`, `splitAtCurrentTime`, `deleteSelectedSegment`, logica de playback que pula segmentos removidos, funcao `generateSubtitles` |
| `src/components/video/VideoEditor.tsx` | Substituir layout: player em cima, timeline embaixo (full width), painel lateral com tabs (Legendas, Inserts, Musica). Remover tab "Cortes" (agora e via toolbar da timeline) |
| `src/components/video/VideoTimeline.tsx` | Sera substituido pelo novo `EditorTimeline.tsx` |
| `src/components/video/SubtitlePanel.tsx` | Adicionar botao "Gerar Legendas Automaticas" com estado de loading, manter edicao manual como fallback |
| `src/components/video/VideoPlayer.tsx` | Adicionar logica para pular segmentos deletados durante reproducao |

### Removidos

| Arquivo | Motivo |
|---------|--------|
| `src/components/video/VideoTimeline.tsx` | Substituido por `EditorTimeline.tsx` |

---

## Detalhes Tecnicos

### EditorTimeline -- Layout

- Container com `overflow-x: auto` para scroll horizontal
- Largura total calculada: `duration * pixelsPerSecond` (ex: 60s * 20px = 1200px)
- Zoom controlado por slider que altera `pixelsPerSecond` (10-80px)
- Playhead: div absoluto posicionado em `currentTime * pixelsPerSecond`, linha vermelha vertical full-height
- Clique na timeline: calcula tempo a partir da posicao X do click

### Thumbnails dos segmentos

- Geradas via `<canvas>` + `video.currentTime` seek
- 1 thumbnail por segmento (no centro temporal do segmento)
- Armazenadas em state como data URLs
- Geradas de forma lazy apos o video carregar

### Playback inteligente (pular segmentos removidos)

No `onTimeUpdate` do player:
- Verificar se o currentTime esta dentro de algum segmento ativo
- Se nao esta (caiu em um "buraco" entre segmentos), pular para o inicio do proximo segmento
- Se chegou ao fim do ultimo segmento, pausar

### Transcricao de audio (Edge Function)

```text
POST /transcribe-video-audio
Body: { audioBase64: string, mimeType: "audio/wav" }
Response: { subtitles: [{ text, startTime, endTime }] }
```

- Usa Gemini 2.5 Flash que aceita input de audio
- Prompt solicita transcricao com timestamps em formato estruturado
- Limite de audio: ~10 min (para caber no contexto do modelo)

### Extracao de audio no browser

Usando FFmpeg.wasm ja instalado:
1. Carregar video no filesystem virtual
2. Comando: `ffmpeg -i input.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 output.wav`
3. Ler o WAV resultante como base64
4. Enviar para a edge function

---

## Layout final do editor

```text
+--------------------------------------------------+
|  [<- Voltar]  Editor de Video        [Exportar]   |
+--------------------------------------------------+
|                                  |                |
|  [Player de Video]               |  [Painel]      |
|  Preview com overlays            |  Tabs:         |
|  de legendas e inserts           |  Legendas      |
|                                  |  Inserts       |
|                                  |  Musica        |
+----------------------------------+                |
|  [Toolbar: Cortar | Del | Zoom]  |                |
+----------------------------------+----------------+
|  [Timeline multi-track full width]                |
|  Video:    [===Seg1===][===Seg2===][===Seg3===]   |
|  Legendas: [==Txt1==]    [==Txt2==]               |
|  Musica:   [================================]     |
|  Inserts:       [==Logo==]                        |
+--------------------------------------------------+
```
