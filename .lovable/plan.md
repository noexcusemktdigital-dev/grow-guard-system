

## Plano: Motor de Motion Graphics Profissional (Sem Audio)

Reescrever o motor de motion graphics para qualidade de agencia, focando 100% na qualidade visual. Audio sera implementado em fase futura.

---

### Arquitetura de Camadas (por cena)

```text
Camada 5: Logo animada (intro/outro/watermark)
Camada 4: Texto animado (slideUp, scaleIn, kinetic, typewriter, fadeIn)
Camada 3: Elementos graficos (formas, linhas, particulas)
Camada 2: Overlay de cor/gradiente da marca
Camada 1: Imagem de fundo com Ken Burns
```

---

### Mudancas

#### 1. Reescrever `src/lib/motionGraphicsEngine.ts`

Substituir o motor atual (Ken Burns + typewriter + crossfade) por um sistema completo de camadas:

**Tipos novos:**
- `SceneConfig` — controle por cena (textAnimation, transition, graphicElements, showLogo, counter, brandOverlay)
- `GraphicElement` — forma geometrica animada (tipo, posicao, cor, animacao)
- `MotionGraphicsConfig` expandido com `logoUrl`, `brandColors`, `transitionStyle`, `showParticles`

**Camada 1 - Background (Ken Burns):** Manter o existente, melhorar com mais padroes de pan/zoom (8 variacoes em vez de 4).

**Camada 2 - Brand Overlay:** Gradiente sutil usando cores da marca sobre a imagem. Opacidade configuravel por cena (0.1-0.4). Anima de transparente para a opacidade alvo nos primeiros 0.5s.

**Camada 3 - Elementos Graficos:**
- Circulos que pulsam (scale oscilante via `Math.sin`)
- Linhas diagonais que deslizam pela tela
- Retangulos arredondados com cores da marca que aparecem com fade
- 3-6 elementos por cena, posicoes/tamanhos procedurais baseados no indice da cena
- Gerados automaticamente conforme o `graphicStyle`: `geometric`, `organic`, `minimal`

**Camada 4 - Texto Animado (5 estilos):**
- `typewriter` — letra por letra (existente, manter)
- `slideUp` — texto sobe 80px com ease-out + fade
- `scaleIn` — texto cresce de 0.3x para 1.0x com fade
- `fadeIn` — fade classico (existente, manter)
- `kinetic` — cada palavra aparece individualmente com bounce sequencial (100ms entre palavras)

**Camada 5 - Logo:**
- Carrega imagem do `logoUrl` (da identidade visual)
- Cena 1: scale de 0.3 para 1.0 + fade-in (1.5s), posicao topo-centro
- Ultima cena: logo centralizada com glow (shadowBlur animado)
- Cenas intermediarias: logo pequena (60px) no canto superior direito como watermark (opacidade 0.4)

**Particulas (opcional):**
- 20-30 particulas por cena
- Circulos de 2-6px, opacidade 0.1-0.3
- Flutuam para cima a 0.3-0.8px/frame
- Cores da paleta da marca

**Transicoes entre cenas (4 tipos):**
- `dissolve` — crossfade alpha (existente)
- `slideLeft` — cena atual desliza para esquerda, proxima entra da direita
- `zoomIn` — zoom rapido de 1.0x para 2.0x na cena atual enquanto proxima faz fade-in
- `wipe` — cortina horizontal da esquerda para direita

**Contadores numericos:**
- Interpola de 0 ate valor final durante 2s
- Fonte grande + cor primaria da marca
- Sufixo aparece com fade apos contador completar

#### 2. Atualizar `supabase/functions/generate-social-video-frames/index.ts`

Adicionar campo `sceneConfigs` ao retorno com metadados de animacao por cena:

```json
{
  "frameUrls": ["..."],
  "sceneTexts": [{ "main": "...", "sub": "..." }],
  "sceneConfigs": [
    {
      "textAnimation": "slideUp",
      "transition": "dissolve",
      "showLogo": true,
      "graphicStyle": "geometric",
      "brandOverlayOpacity": 0.2
    }
  ]
}
```

Mapeamento automatico por `video_style`:

| Video Style | Text Anim | Transitions | Particulas | Elementos | Overlay |
|---|---|---|---|---|---|
| slideshow | fadeIn | dissolve | sim | linhas sutis | 0.15 |
| kinetic | kinetic | slideLeft | nao | formas bold | 0.25 |
| revelacao | scaleIn | zoomIn | sim | circulos glow | 0.2 |
| countdown | slideUp | wipe | nao | contadores | 0.3 |

#### 3. Atualizar `src/pages/cliente/ClienteRedesSociais.tsx`

Na chamada ao `renderMotionGraphics` (linhas 754-763):
- Passar `logoUrl` do `visualIdentity.logo_url`
- Passar `brandColors` do `visualIdentity.palette.map(c => c.hex)`
- Passar `sceneConfigs` retornados pelo edge function
- Usar `transitionStyle` e `textAnimation` do sceneConfig

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `src/lib/motionGraphicsEngine.ts` | Reescrever — motor completo com 5 camadas, 4 transicoes, 5 estilos de texto, particulas, logo, contadores |
| `supabase/functions/generate-social-video-frames/index.ts` | Editar — retornar sceneConfigs com metadados de animacao por cena |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Editar — passar logo, cores e sceneConfigs ao motor |

