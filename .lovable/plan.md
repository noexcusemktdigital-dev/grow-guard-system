

## Plano: Motor de Motion Graphics Profissional (Nivel Agencia)

Reescrever o motor de motion graphics atual para entregar videos com qualidade de agencia, incluindo elementos graficos animados, logo animada, contadores numericos, transicoes cinematicas, e musica de fundo.

---

### Visao Geral

O motor atual so faz Ken Burns + typewriter + crossfade. Precisa ser reescrito para suportar um sistema de **camadas animadas por cena** (layers), onde cada cena pode ter:

```text
Camada 5: Logo animada (intro/outro)
Camada 4: Texto animado (slide-up, scale, bounce, typewriter)
Camada 3: Elementos graficos (formas, linhas, particulas, icones)
Camada 2: Overlay de cor/gradiente da marca
Camada 1: Imagem de fundo com Ken Burns
```

---

### Mudancas

#### 1. Reescrever `src/lib/motionGraphicsEngine.ts`

**Novo sistema de camadas animadas:**

- **BackgroundLayer**: Imagem IA com Ken Burns (ja existe, manter)
- **BrandOverlayLayer**: Gradiente com cores da paleta da identidade visual sobre a imagem
- **GraphicElementsLayer**: Formas geometricas animadas (circulos, retangulos, linhas) que se movem, crescem e pulsam usando as cores da marca
- **TextAnimationLayer**: Multiplos estilos de animacao de texto:
  - `slideUp` — texto sobe de baixo para a posicao final
  - `scaleIn` — texto cresce do centro
  - `fadeIn` — fade classico
  - `typewriter` — letra por letra (ja existe)
  - `kinetic` — palavras individuais aparecem em sequencia com bounce
- **CounterLayer**: Numeros que contam de 0 ate o valor final (ex: "30% OFF", "500+ clientes")
- **LogoLayer**: Carrega o logo da identidade visual e anima:
  - Intro: logo surge com scale + fade nos primeiros 1.5s
  - Outro: logo aparece na ultima cena com posicao central
- **ParticleLayer**: Particulas flutuantes sutis (circulos pequenos, brilhos) para dar vida ao fundo

**Transicoes entre cenas (alem do crossfade):**
- `dissolve` — crossfade atual
- `slideLeft` — cena atual desliza para esquerda
- `zoomIn` — zoom dramatico para a proxima cena
- `wipe` — cortina horizontal

**Novo tipo SceneConfig para controle por cena:**
```typescript
interface SceneConfig {
  img: HTMLImageElement;
  text: SceneText;
  textAnimation: 'slideUp' | 'scaleIn' | 'fadeIn' | 'typewriter' | 'kinetic';
  transition: 'dissolve' | 'slideLeft' | 'zoomIn' | 'wipe';
  graphicElements: GraphicElement[];
  showLogo: boolean;
  showCounter?: { value: number; suffix: string };
  brandOverlayOpacity: number;
}
```

**Configuracao expandida:**
- `logoUrl?: string` — URL do logo da identidade visual
- `brandColors?: string[]` — cores da paleta para elementos graficos
- `textAnimation?: string` — estilo padrao de animacao de texto
- `transitionStyle?: string` — estilo padrao de transicao
- `showParticles?: boolean` — ativar particulas decorativas

#### 2. Atualizar `supabase/functions/generate-social-video-frames/index.ts`

Adicionar ao retorno metadados de cena mais ricos para o motor:

```json
{
  "frameUrls": ["..."],
  "sceneTexts": [
    { "main": "Texto 1", "sub": "Subtexto" }
  ],
  "sceneConfigs": [
    {
      "textAnimation": "slideUp",
      "transition": "dissolve",
      "showLogo": true,
      "counterValue": null,
      "graphicStyle": "geometric"
    }
  ]
}
```

A IA (no prompt do edge function) vai decidir o melhor estilo de animacao para cada cena com base no video_style selecionado. Mapeamento padrao:

| Video Style | Text Anim | Transitions | Particulas | Elementos |
|---|---|---|---|---|
| slideshow | fadeIn | dissolve | sim | linhas sutis |
| kinetic | kinetic | slideLeft | nao | formas bold |
| revelacao | scaleIn | zoomIn | sim | circulos glow |
| countdown | slideUp | wipe | nao | contadores |

#### 3. Criar edge function `supabase/functions/generate-video-music/index.ts`

Gerar musica de fundo usando **ElevenLabs Music API**:
- Recebe: `mood` (energetico, calmo, corporativo, dramatico), `duration_seconds`, `video_style`
- Gera trilha MP3 via ElevenLabs
- Upload para Storage
- Retorna URL publica

Requer configuracao do secret `ELEVENLABS_API_KEY`.

#### 4. Mesclar audio + video no motor

Usar `AudioContext` + `MediaStreamDestination` para combinar:
- Stream do Canvas (video)
- Stream do AudioContext (musica carregada)
- MediaRecorder grava ambos juntos

```text
Canvas.captureStream() ──┐
                         ├──> MediaRecorder ──> WebM com audio
AudioContext.stream ─────┘
```

#### 5. Atualizar `src/pages/cliente/ClienteRedesSociais.tsx`

- Passar `logoUrl` e `brandColors` da identidade visual para o motor
- Passar `sceneConfigs` retornados pelo edge function
- Chamar `generate-video-music` antes de renderizar para obter a trilha
- Feedback de progresso mais detalhado: "Gerando musica...", "Animando cena 2/5...", etc.

#### 6. Atualizar UI do wizard de video

Adicionar opcao para o usuario escolher o "mood" da musica:
- Energetico / Animado
- Calmo / Corporativo  
- Dramatico / Impactante
- Sem musica

---

### Detalhes Tecnicos do Motor de Animacao

**Elementos Graficos Animados (Canvas 2D):**

Cada cena tera 3-6 elementos decorativos gerados proceduralmente:
- Circulos que pulsam (scale oscilante via seno)
- Linhas diagonais que deslizam
- Retangulos arredondados com as cores da marca que aparecem/desaparecem
- Posicoes e tamanhos randomizados mas consistentes por cena

**Logo Animada:**
- Carregada como Image do `visualIdentity.logo_url`
- Cena 1: scale de 0.3 para 1.0 com fade (1.5s), posicionada no topo
- Ultima cena: logo centralizada com glow usando shadowBlur
- Demais cenas: logo pequena no canto superior direito (marca d'agua)

**Contadores Numericos:**
- Interpola de 0 ate o valor final durante os primeiros 2s da cena
- Renderizado com fonte grande e cor primaria da marca
- Sufixo aparece com fade apos contador completar (ex: "500" -> "500+ clientes")

**Particulas:**
- 20-40 particulas por cena
- Circulos de 2-6px com opacidade 0.1-0.4
- Movimento sutil para cima (velocidade 0.2-0.8 px/frame)
- Cores baseadas na paleta da marca

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `src/lib/motionGraphicsEngine.ts` | Reescrever — motor completo com camadas, elementos animados, logo, contadores, particulas |
| `supabase/functions/generate-social-video-frames/index.ts` | Editar — retornar sceneConfigs com metadados de animacao |
| `supabase/functions/generate-video-music/index.ts` | Criar — geracao de musica via ElevenLabs |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Editar — integrar novo motor, musica, e opcoes de mood |

### Pre-requisito

Sera necessario configurar o secret `ELEVENLABS_API_KEY` para a geracao de musica de fundo. A funcionalidade de musica sera opcional — os videos funcionam sem audio caso a key nao esteja configurada.

