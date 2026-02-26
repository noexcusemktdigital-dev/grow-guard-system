

## Plano: Estilos de Arte Claros + Prompts Especializados

Em vez de usar o motor Canvas para compor templates, vamos melhorar drasticamente os estilos de arte e os prompts para que a IA gere diretamente o resultado certo — seja uma arte gráfica estilo postagem ou uma imagem fotográfica.

---

### Problema

Os 5 estilos atuais (`foto_texto`, `composicao`, `mockup`, `quote`, `before_after`) tem descricoes curtas e prompts genericos. O cliente nao entende bem a diferenca e a IA nao recebe instrucoes suficientes para gerar o estilo correto.

### Solucao

1. Reorganizar os estilos em categorias claras: **Grafica** vs **Imagem**
2. Expandir massivamente os prompts de cada estilo no edge function
3. Remover a logica de `needs_template` e Canvas template overlay (nao necessario)

---

### Mudancas

#### 1. Atualizar `ART_STYLES` em `ClienteRedesSociais.tsx`

Reorganizar em duas categorias visuais com previews claros:

```typescript
const ART_STYLE_CATEGORIES = [
  {
    category: "Gráfica",
    description: "Design gráfico profissional — formas, tipografia estilizada, layout estruturado",
    styles: [
      { value: "grafica_moderna", label: "Design Moderno", desc: "Formas geométricas, cores vibrantes, layout clean tipo Canva", icon: "🎨" },
      { value: "grafica_elegante", label: "Design Elegante", desc: "Fundo escuro, detalhes dourados, tipografia serifada sofisticada", icon: "✨" },
      { value: "grafica_bold", label: "Design Bold", desc: "Cores fortes, faixas diagonais, texto grande e impactante", icon: "💥" },
      { value: "grafica_minimalista", label: "Design Minimalista", desc: "Muito espaço negativo, poucos elementos, tipografia fina", icon: "◻️" },
    ]
  },
  {
    category: "Imagem",
    description: "Fotografia ou ilustração realista como base visual",
    styles: [
      { value: "foto_editorial", label: "Foto Editorial", desc: "Fotografia profissional com espaço para texto, iluminação cinematográfica", icon: "📸" },
      { value: "foto_produto", label: "Foto de Produto", desc: "Produto em contexto lifestyle, fundo clean ou cenário natural", icon: "📦" },
      { value: "ilustracao", label: "Ilustração Digital", desc: "Ilustração moderna flat ou 3D, estilo tech/startup", icon: "🖌️" },
      { value: "collage", label: "Colagem Criativa", desc: "Mix de elementos visuais, texturas, recortes sobrepostos", icon: "🔄" },
    ]
  }
];
```

Mostrar as categorias com separador visual ("Estilo Grafico" | "Estilo Fotografia") para o cliente entender a diferenca.

#### 2. Expandir prompts no `generate-social-image/index.ts`

Substituir o `artStyleMap` atual (1 linha por estilo) por prompts de 10-15 linhas cada com instrucoes visuais detalhadas:

**Estilos Graficos** — instruir a IA a gerar design grafico flat, nao fotografia:

- `grafica_moderna`: "Create a flat graphic design composition. Use bold color blocks, geometric shapes (circles, rectangles, triangles), clean lines. The style should look like a professionally designed social media template — NOT a photograph. Use solid background colors, layered shapes with brand colors, decorative elements like dots, lines, abstract patterns. Leave clear structured space for text. Think: Canva Pro template, Behance social media design, Adobe Express layout."

- `grafica_elegante`: "Create a luxury graphic design composition with a dark background (deep navy, black, or charcoal). Add subtle gold or metallic accent elements — thin decorative lines, ornamental borders, small geometric details. The composition should feel high-end like a fashion brand or premium service announcement. Use serif-inspired visual elements, subtle gradients, and sophisticated color palette. NOT a photograph."

- `grafica_bold`: "Create an energetic, high-contrast graphic design. Use large bold color blocks, diagonal stripes or slashes, strong geometric shapes. Colors should be vibrant and attention-grabbing. The composition should feel dynamic and modern — like a sports brand announcement or sale promotion. Use brand colors in large areas, create visual tension with contrasting elements."

- `grafica_minimalista`: "Create an ultra-clean minimalist graphic design. Maximum negative space (60%+ of canvas should be empty or single-color). Use only 1-2 subtle geometric elements. Monochromatic or two-tone color scheme. Inspired by Japanese minimalism, Muji aesthetic, Apple marketing. The design should breathe and feel premium through restraint."

**Estilos Imagem** — manter instrucoes fotograficas mas mais detalhadas:

- `foto_editorial`: "Create a cinematic editorial photograph with professional studio or golden-hour lighting. Depth of field, intentional composition with rule of thirds. Leave clean negative space (top 20% or bottom 25%) for text overlay. Sharp focus on subject with soft background bokeh. Think: magazine cover, editorial spread, brand campaign photography."

- `foto_produto`: "Create a product photography scene. Product in lifestyle context — on a textured surface (marble, wood, fabric), held in hand, or in a curated flat lay. Soft directional lighting, subtle shadows, clean but warm color palette. Professional commercial photography quality."

- `ilustracao`: "Create a modern digital illustration. Flat design or soft 3D style, clean vector-like aesthetic. Stylized characters or objects, consistent color palette, modern tech/startup feel. Think: Slack illustrations, Notion artwork, Stripe marketing visuals."

- `collage`: "Create a creative mixed-media collage composition. Layer photographic elements with graphic shapes, textures, and color blocks. Use paper-cut effect, overlapping elements, varied scales. Contemporary editorial collage style — artistic and eye-catching."

#### 3. Atualizar chain-of-thought em `analyzeAndOptimizePrompt`

Adicionar ao system prompt da otimizacao o contexto de que o estilo pode ser "grafico" ou "fotografico", para que a IA otimize o prompt na direcao correta.

#### 4. Remover logica de `needs_template`

No `generate-social-image`, remover o check de `TEMPLATE_ART_STYLES` e o campo `needs_template` do retorno. Todos os estilos serao gerados diretamente pela IA sem necessidade de composicao Canvas posterior.

No `ClienteRedesSociais.tsx`, remover imports e logica do `canvasTemplateEngine` (manter o arquivo para uso futuro, mas desacoplar do fluxo principal).

#### 5. UI: Seletor visual com categorias

Substituir o grid flat atual por um layout com duas secoes:

```
┌─────────────────────────────────────────┐
│  🎨 ESTILO GRÁFICO                     │
│  Design profissional com formas e cores │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Modern│ │Elegan│ │ Bold │ │Minim │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
├─────────────────────────────────────────┤
│  📸 ESTILO IMAGEM                       │
│  Fotografia ou ilustração como base     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Editor│ │Produt│ │Ilustr│ │Collag│   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
└─────────────────────────────────────────┘
```

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/cliente/ClienteRedesSociais.tsx` | Editar — novos estilos com categorias, remover refs ao canvasTemplateEngine, UI com separador Grafica/Imagem |
| `supabase/functions/generate-social-image/index.ts` | Editar — prompts expandidos (10-15 linhas cada), remover needs_template, atualizar chain-of-thought |

