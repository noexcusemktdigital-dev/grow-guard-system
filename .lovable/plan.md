

# Editor de Video -- Novo Modulo no Menu Marketing

## Resumo

Adicionar "Editor de Video" como um item proprio na secao **Marketing** da sidebar do cliente, com rota dedicada `/cliente/editor-video`. O editor permite upload de video gravado e oferece ferramentas de corte, legendas, inserts de imagem e musica de fundo, tudo processado no navegador via FFmpeg.wasm.

---

## Posicionamento na Sidebar

A secao Marketing ficara assim:

```text
MARKETING
  Estrategia
  Conteudos
  Redes Sociais
  Editor de Video   <-- NOVO (icone: Film ou Clapperboard)
  Sites
  Trafego Pago
```

---

## Nova Rota e Pagina

| Item | Valor |
|------|-------|
| Rota | `/cliente/editor-video` |
| Pagina | `src/pages/cliente/ClienteEditorVideo.tsx` |
| Icone sidebar | `Film` (Lucide) |

### Pagina Principal (`ClienteEditorVideo.tsx`)

Tela com dois estados:

**Estado 1 -- Sem video carregado:**
- Area de drag-and-drop grande e centralizada para upload de video
- Aceita MP4, MOV, WebM (max 500MB)
- Texto: "Arraste seu video aqui ou clique para selecionar"
- Card lateral com dica: "Grave seguindo o roteiro gerado em Conteudos e edite aqui"

**Estado 2 -- Video carregado (Editor ativo):**
- Layout fullscreen dividido em 3 areas (preview, timeline, painel de edicao)

---

## Componentes do Editor

### Layout do Editor

```text
+--------------------------------------------------+
|  [Player de Video]          |  [Painel Lateral]   |
|  Preview com controles      |  Tabs:              |
|  play/pause/seek            |  Cortes | Legendas  |
|                             |  Inserts | Musica   |
+--------------------------------------------------+
|  [Timeline Visual]                                |
|  Barra com handles de corte e segmentos           |
+--------------------------------------------------+
|  [Cancelar]                    [Exportar Video]   |
+--------------------------------------------------+
```

### 1. Player de Video (`VideoPlayer.tsx`)
- Player HTML5 nativo com controles de play/pause/seek
- Overlay de legendas e inserts em tempo real (CSS, sem FFmpeg ate exportar)
- Indicador de tempo atual sincronizado com timeline

### 2. Timeline de Cortes (`VideoTimeline.tsx`)
- Barra visual da duracao total
- Handles arrastáveis para definir inicio/fim de cada segmento
- Botao "Adicionar Corte" no ponto atual
- Lista de segmentos reordenaveis
- Botao para remover segmento

### 3. Painel de Legendas (`SubtitlePanel.tsx`)
- Lista de legendas com: texto, tempo inicio, tempo fim, posicao (topo/centro/baixo)
- 3 estilos pre-definidos: Classico (branco+sombra), Destaque (fundo colorido), Minimalista
- Botao "Adicionar Legenda" no tempo atual do player

### 4. Painel de Inserts (`InsertPanel.tsx`)
- Upload de imagem (logo, selo, watermark)
- Posicao: canto superior, inferior, centro, tela cheia
- Tempo de inicio e fim
- Slider de opacidade

### 5. Painel de Musica (`MusicPanel.tsx`)
- Upload de audio (MP3, WAV, max 20MB)
- Slider de volume (0-100%)
- Opcao: manter audio original + musica, ou substituir audio
- Trim automatico do audio para caber no video

### 6. Exportacao (`VideoExporter.tsx`)
- Barra de progresso durante processamento
- Cadeia de filtros FFmpeg: cortes (concat), legendas (drawtext), inserts (overlay), audio (amix)
- Saida: MP4 H.264 1080p
- Download automatico + opcao de salvar no storage

---

## Detalhes Tecnicos

### Nova Dependencia

- `@ffmpeg/ffmpeg` e `@ffmpeg/util` para processamento client-side via WebAssembly

### Arquivos Novos

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/cliente/ClienteEditorVideo.tsx` | Pagina principal com upload e estado do editor |
| `src/components/video/VideoEditor.tsx` | Container principal do editor (layout 3 areas) |
| `src/components/video/VideoPlayer.tsx` | Player HTML5 com overlays CSS |
| `src/components/video/VideoTimeline.tsx` | Timeline visual com handles de corte |
| `src/components/video/SubtitlePanel.tsx` | CRUD de legendas com estilos |
| `src/components/video/InsertPanel.tsx` | CRUD de inserts de imagem |
| `src/components/video/MusicPanel.tsx` | Upload e mix de audio |
| `src/components/video/VideoExporter.tsx` | Logica de exportacao FFmpeg |
| `src/hooks/useVideoEditor.ts` | Hook central de estado (cuts, subtitles, inserts, music, videoFile) |

### Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/ClienteSidebar.tsx` | Adicionar item "Editor de Video" com icone `Film` na secao `marketingSection` |
| `src/App.tsx` | Adicionar rota `/cliente/editor-video` com lazy import da pagina |

### Cota por Plano

O editor de video em si nao tem limite de uso (o cliente edita quantas vezes quiser). O limite ja existe nos conteudos gerados e artes. O editor e uma ferramenta, nao um gerador.

### Storage (bucket para videos editados)

Criar bucket `edited-videos` para salvar opcionalmente os videos finalizados, com RLS para que apenas o dono possa fazer upload/leitura.

### Limitacoes e Avisos

- Banner de compatibilidade: funciona melhor em Chrome/Edge (SharedArrayBuffer)
- Safari tem suporte limitado
- Videos > 500MB podem causar problemas de memoria
- Primeira carga do FFmpeg.wasm: ~30MB (cached depois)
- Processamento pode levar 1-5 minutos dependendo do tamanho

