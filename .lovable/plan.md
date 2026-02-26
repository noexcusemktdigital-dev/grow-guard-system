
## Plano: Motor de Templates Canvas para Artes de Post

Criar um sistema hibrido onde a IA gera a imagem de fundo e um motor Canvas renderiza por cima elementos de design grafico (tipografia, molduras, formas geometricas, logo) para atingir qualidade de template profissional.

---

### Problema Atual

O sistema atual gera imagens via IA com a regra "ZERO texto na imagem". As referencias do usuario mostram templates estilo Canva com:
- Tipografia estilizada e hierarquica (titulo grande, subtitulo, CTA)
- Molduras e frames geometricos ao redor das fotos
- Formas decorativas (faixas diagonais, circulos, retangulos)
- Logo e marca d'agua posicionados estrategicamente
- Layout estruturado com grid e alinhamento preciso

A IA sozinha nao consegue produzir esse nivel de controle tipografico e geometrico. Precisa de renderizacao programatica.

---

### Arquitetura Hibrida

```text
1. IA gera imagem de fundo (foto/cena) ──> URL da imagem
2. IA gera layout JSON (posicoes dos elementos) ──> Template config
3. Canvas no browser compoe tudo:
   - Desenha imagem de fundo (com crop/mask)
   - Renderiza formas geometricas (faixas, frames, circulos)
   - Renderiza textos com tipografia controlada
   - Aplica logo da marca
   - Exporta como PNG 1080x1080 ou 1080x1920
```

---

### Mudancas

#### 1. Criar `src/lib/canvasTemplateEngine.ts`

Motor de renderizacao Canvas que compoe templates profissionais:

**Tipos principais:**
```typescript
interface TemplateConfig {
  width: number;          // 1080 feed, 1080 story
  height: number;         // 1080 feed, 1920 story
  background: BackgroundConfig;
  elements: TemplateElement[];
  brandColors: string[];
  logoUrl?: string;
}

interface BackgroundConfig {
  type: 'image' | 'solid' | 'gradient';
  imageUrl?: string;
  imageFit: 'cover' | 'contain' | 'fill';
  imageMask?: 'full' | 'left-half' | 'right-half' | 'center-circle' | 'frame-inset';
  overlay?: { color: string; opacity: number };
}

type TemplateElement =
  | TextElement
  | ShapeElement
  | ImageElement;

interface TextElement {
  type: 'text';
  content: string;
  x: number; y: number; width: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | 'black';
  color: string;
  align: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: 'uppercase' | 'none';
  shadow?: { blur: number; color: string; offsetX: number; offsetY: number };
}

interface ShapeElement {
  type: 'shape';
  shape: 'rect' | 'circle' | 'line' | 'diagonal-stripe' | 'frame';
  x: number; y: number; width: number; height: number;
  color: string;
  opacity: number;
  rotation?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

interface ImageElement {
  type: 'image';
  src: string;    // logo URL ou outra imagem
  x: number; y: number; width: number; height: number;
  opacity?: number;
  borderRadius?: number;
}
```

**Funcao principal:**
```typescript
async function renderTemplate(config: TemplateConfig): Promise<Blob>
```

Fluxo:
1. Cria canvas offscreen no tamanho especificado
2. Carrega imagem de fundo e aplica mask/crop
3. Aplica overlay de cor se configurado
4. Itera sobre `elements` em ordem e renderiza cada um:
   - `shape`: usa `ctx.fillRect`, `ctx.arc`, linhas diagonais com `ctx.rotate`
   - `text`: usa `ctx.fillText` com fontes Google carregadas via FontFace API
   - `image`: desenha imagem (logo) na posicao especificada
5. Exporta canvas como PNG blob

**Fontes:**
- Carrega fontes Google (Montserrat, Poppins, Playfair Display, Space Grotesk, Inter) via FontFace API antes de renderizar
- Fallback para sans-serif se a fonte nao carregar

#### 2. Criar edge function `supabase/functions/generate-template-layout/index.ts`

Nova edge function que usa a IA para gerar o JSON de layout do template:

**Input:**
```json
{
  "titulo": "PROMOÇÃO DE VERÃO",
  "subtitulo": "Até 50% OFF",
  "cta": "Compre agora",
  "format": "feed",
  "estilo": "bold",
  "identidade_visual": { "paleta": [...], "fontes": [...] },
  "art_style": "foto_texto",
  "background_image_url": "https://..."
}
```

**O que a IA faz:**
- Recebe o titulo, subtitulo, CTA, estilo e identidade visual
- Gera um `TemplateConfig` JSON com posicoes exatas de cada elemento
- Decide o layout (texto a esquerda + foto a direita, texto sobre imagem com overlay, etc.)
- Aplica cores da paleta da marca nos elementos
- Escolhe fontes e tamanhos adequados ao estilo

**Output:** JSON com a `TemplateConfig` completa pronta para o Canvas renderizar.

**Prompt da IA incluira:**
- Exemplos de layouts profissionais para cada estilo (minimalista, bold, corporativo, elegante, criativo)
- Regras de tipografia (hierarquia de tamanhos, espacamento)
- Regras de composicao (regra dos tercos, ponto focal, respiro visual)
- Paleta de cores da marca para aplicar

#### 3. Atualizar `supabase/functions/generate-social-image/index.ts`

Adicionar novo modo de geracao `template`:

- Quando `art_style` for um dos estilos de template (foto_texto, composicao, mockup, quote):
  1. Gerar imagem de fundo via IA (sem texto, como ja faz)
  2. Fazer upload da imagem de fundo
  3. Retornar a URL junto com um flag `needs_template: true`

- A composicao final sera feita no frontend pelo Canvas engine

#### 4. Atualizar `src/pages/cliente/ClienteRedesSociais.tsx`

Novo fluxo de geracao para posts com template:

1. Usuario preenche briefing (titulo, subtitulo, CTA, estilo)
2. Sistema gera imagem de fundo via `generate-social-image` (apenas a foto)
3. Sistema chama `generate-template-layout` com o titulo, estilo e URL da foto
4. Canvas engine renderiza o template completo no browser
5. Resultado e exibido para aprovacao
6. Upload do PNG final para storage

**Nova UI:**
- Preview do template em tempo real no Canvas
- Opcao de ajustar texto antes de finalizar (editar titulo/subtitulo inline)
- Selector de "Template Style" com previews visuais:
  - **Minimalista**: Muito espaco negativo, texto discreto, moldura fina
  - **Bold**: Faixas diagonais coloridas, texto grande, alto contraste
  - **Corporativo**: Grid limpo, cores neutras, tipografia serifada
  - **Elegante**: Fundo escuro, detalhes dourados/metalicos, moldura decorativa
  - **Criativo**: Formas organicas, cores vibrantes, layout assimetrico

#### 5. Templates pre-definidos (fallback)

Criar 10-15 layouts pre-definidos como fallback caso a IA nao gere um layout valido:

```typescript
const PRESET_TEMPLATES: Record<string, Partial<TemplateConfig>> = {
  "bold-diagonal": {
    elements: [
      { type: 'shape', shape: 'diagonal-stripe', ... },
      { type: 'text', content: '{{titulo}}', fontSize: 72, fontWeight: 'black', ... },
      { type: 'text', content: '{{subtitulo}}', fontSize: 36, ... },
    ]
  },
  "minimal-frame": { ... },
  "corporate-split": { ... },
  // etc.
};
```

Os placeholders `{{titulo}}`, `{{subtitulo}}`, `{{cta}}` sao substituidos pelo conteudo real antes de renderizar.

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `src/lib/canvasTemplateEngine.ts` | Criar — motor Canvas para renderizar templates com texto, formas e logo |
| `supabase/functions/generate-template-layout/index.ts` | Criar — IA gera layout JSON do template |
| `supabase/functions/generate-social-image/index.ts` | Editar — adicionar modo template (retornar flag needs_template) |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Editar — integrar fluxo hibrido (foto IA + template Canvas) |

---

### Resultado Esperado

Com essa abordagem hibrida:
- **Fotos de fundo**: Qualidade de IA (ja funciona bem)
- **Tipografia**: Controlada pixel a pixel pelo Canvas (fontes reais, tamanhos exatos, espaçamento)
- **Elementos graficos**: Faixas diagonais, molduras, circulos — tudo renderizado programaticamente
- **Logo**: Posicionado com precisao
- **Consistencia de marca**: Cores da paleta aplicadas em todos os elementos

Isso replica o padrao dos templates profissionais das referencias (estilo Canva/Figma) usando a foto gerada por IA como base.
