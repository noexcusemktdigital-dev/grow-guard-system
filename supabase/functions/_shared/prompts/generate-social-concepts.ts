// Prompts para geração de conceitos visuais de posts para redes sociais.
// Extraído de supabase/functions/generate-social-concepts/index.ts em 2026-05-02.

export const PROMPT_VERSION = '1.0.0';

// ── VISUAL GUIDES BY POST TYPE ────────────────────────────────────────

const VISUAL_GUIDE_BY_TYPE: Record<string, string> = {
  produto: `For PRODUCT posts:
- Professional studio photography style with controlled lighting
- Product centered on an elegant surface (marble, wood, fabric)
- Soft gradient or bokeh background
- Studio lighting: key light + fill light + rim light
- Show texture, details, packaging
- Premium product photography, commercial quality`,
  servico: `For SERVICE posts:
- Show the service being delivered or its results
- Professional environment, clean workspace
- People interacting naturally (if applicable)
- Before/after visual metaphors
- Clean, trust-inspiring composition`,
  promocao: `For PROMOTIONAL posts:
- Bold graphic design with geometric shapes
- Dynamic composition suggesting urgency and excitement
- Gradients, abstract shapes, energy-filled layout
- Visual elements that suggest deals/savings (without text)
- Eye-catching, vibrant, action-oriented design`,
  institucional: `For INSTITUTIONAL posts:
- Corporate brand imagery, sophisticated composition
- Clean, minimalist layout with breathing room
- Professional environment or abstract brand elements
- Convey trust, authority, and professionalism
- Subtle gradients, refined color palette`,
  educativo: `For EDUCATIONAL posts:
- Clear, didactic visual elements
- Infographic-style composition with visual hierarchy
- Icons, diagrams, or step-by-step visual flow
- Clean layout that organizes information visually
- Professional but approachable aesthetic`,
  depoimento: `For TESTIMONIAL posts:
- Authentic, real-people photography style
- Warm lighting, natural environment
- Emotional connection, genuine expressions
- Soft focus backgrounds, intimate framing
- Trust and authenticity above all`,
};

const NIVEL_INSTRUCTIONS: Record<string, string> = {
  alto_padrao: `QUALITY LEVEL: ULTRA-PREMIUM
- Luxury brand aesthetic, magazine-quality
- Rich textures, dramatic lighting with deep shadows and highlights
- Sophisticated color grading, cinematic feel
- Every detail must be polished to perfection
- Think Vogue, Apple, luxury fashion campaigns`,
  elaborado: `QUALITY LEVEL: ELABORATE
- Strong composition with careful attention to balance
- Vibrant but harmonious colors, polished finish
- Professional-grade lighting and depth of field
- Layered visual interest, thoughtful details
- Agency-quality creative work`,
  simples: `QUALITY LEVEL: CLEAN & PROFESSIONAL
- Simple, effective composition
- Clean lines, clear focal point
- Professional but not over-designed
- Practical, ready-to-use social media content`,
};

const ART_STYLE_GUIDES: Record<string, string> = {
  foto_texto: 'ART STYLE: Photo + Text overlay. Use photorealistic backgrounds (professional photography) with clean compositional space for text. Studio lighting, sharp details, editorial feel.',
  composicao: 'ART STYLE: Graphic Composition. Abstract shapes, geometric elements, bold color blocks, layered visual design. Modern graphic design aesthetic with dynamic composition.',
  mockup: 'ART STYLE: Product Mockup. Show products in realistic contexts (desk, hand, lifestyle setting). Natural lighting, contextual backgrounds, commercial photography feel.',
  quote: 'ART STYLE: Quote Card. Stylized background (gradient, texture, or pattern) optimized for text overlay. Minimalist, clean, focused on legibility. Think inspirational quote format.',
  before_after: 'ART STYLE: Before & After. Split composition showing two contrasting states side by side or top/bottom. Clear visual contrast, same framing angle, transformation theme.',
};

const VIDEO_STYLE_GUIDES: Record<string, string> = {
  slideshow: 'VIDEO STYLE: Slideshow + Text. Generate frames that work as a cinematic slideshow with smooth Ken Burns transitions. Each frame should have a distinct visual moment. Subtle variations in angle and zoom for dynamic motion.',
  kinetic: 'VIDEO STYLE: Kinetic Typography. Generate bold, high-contrast backgrounds/textures. The motion graphics engine will add animated text. Focus on visually striking but text-overlay-friendly compositions.',
  revelacao: 'VIDEO STYLE: Product Reveal. Generate frames with dramatic zoom-in progression. Start wide/mysterious, progressively reveal the subject. Dramatic lighting, suspenseful composition.',
  countdown: 'VIDEO STYLE: Countdown. Generate frames with escalating visual intensity. Each frame should feel more urgent/exciting than the last. Bold compositions, dynamic energy.',
};

export interface SocialConceptsInput {
  briefing: {
    mes: string;
    objetivo: string;
    cores?: string;
    temas?: string;
    promocoes?: string;
    observacoes?: string;
  };
  quantidade: number;
  estilo: string;
  tipo_post?: string;
  nivel?: string;
  descricao_produto?: string;
  roteiros_importados?: Array<{
    titulo?: string;
    legenda?: string;
    roteiro?: string;
    etapa?: string;
    funil?: string;
    formato?: string;
  }>;
  persona?: { nome?: string; descricao?: string };
  identidade_visual?: {
    paleta?: string;
    fontes?: string;
    estilo?: string;
    referencias?: string;
    concorrencia?: string;
    tom_visual?: string;
  };
  referencias_tipo?: string;
  incluir_video?: boolean;
  art_style?: string;
  video_style?: string;
  salesPlanCtx?: string;
  hasReferenceImages?: boolean;
  referenceImageCount?: number;
}

/**
 * Monta system prompt para geração de conceitos visuais.
 * Strings longas de contexto (salesPlanCtx, referencias_tipo) devem ser
 * pré-truncadas a 1000 chars pelo caller para evitar context overflow.
 */
export function buildUserPrompt(input: SocialConceptsInput): string {
  const {
    briefing,
    quantidade,
    estilo,
    tipo_post = 'institucional',
    nivel = 'simples',
    descricao_produto,
    roteiros_importados,
    persona,
    identidade_visual,
    referencias_tipo,
    incluir_video,
    art_style,
    video_style,
    salesPlanCtx = '',
    hasReferenceImages,
    referenceImageCount = 0,
  } = input;

  const tipoGuide = VISUAL_GUIDE_BY_TYPE[tipo_post] ?? VISUAL_GUIDE_BY_TYPE['institucional'];
  const nivelGuide = NIVEL_INSTRUCTIONS[nivel] ?? NIVEL_INSTRUCTIONS['simples'];

  let importedContext = '';
  if (roteiros_importados && roteiros_importados.length > 0) {
    importedContext = `\n\nIMPORTED CONTENT SCRIPTS (use these as creative base for captions and visual context):
${roteiros_importados.slice(0, 10).map((r, i) => `
Script ${i + 1}:
- Title: ${(r.titulo ?? 'N/A').slice(0, 200)}
- Caption/Body: ${(r.legenda ?? r.roteiro ?? 'N/A').slice(0, 500)}
- Funnel Stage: ${(r.etapa ?? r.funil ?? 'N/A').slice(0, 100)}
- Format: ${(r.formato ?? 'N/A').slice(0, 100)}
`).join('')}
Use these scripts to create more contextually relevant visual prompts and pre-fill captions.`;
  }

  let personaContext = '';
  if (persona?.nome || persona?.descricao) {
    personaContext = `\n\nTARGET AUDIENCE (PERSONA):
${persona.nome ? `Name: ${persona.nome}` : ''}
${persona.descricao ? `Description: ${persona.descricao}` : ''}

Adapt ALL content (captions, CTAs, visual prompts) to resonate with this specific persona.
Visual prompts must reflect the aesthetic preferences and world of this persona.
Use language, tone, and references that connect with this audience.`;
  }

  let identityContext = '';
  if (identidade_visual) {
    const iv = identidade_visual;
    identityContext = `\n\nBRAND IDENTITY:
${iv.paleta ? `- Colors: ${iv.paleta}` : ''}
${iv.fontes ? `- Fonts: ${iv.fontes}` : ''}
${iv.estilo ? `- Style: ${iv.estilo}` : ''}
${iv.referencias ? `- Visual References: ${iv.referencias}` : ''}
${iv.concorrencia ? `- Competitors Visual Style: ${iv.concorrencia}` : ''}
${iv.tom_visual ? `- Visual Tone: ${iv.tom_visual}` : ''}

Use these brand guidelines to ensure visual consistency across all generated prompts.
The visual prompts MUST reflect this brand identity.`;
  }

  let referenciasTipoContext = '';
  if (referencias_tipo) {
    referenciasTipoContext = `\n\nTYPE-SPECIFIC REFERENCES (${tipo_post}):
${referencias_tipo}

Use these references as inspiration for the visual style, composition, and aesthetic of the generated prompts.
Match the quality level and visual approach shown in these references.`;
  }

  let referenceImageContext = '';
  if (hasReferenceImages && referenceImageCount > 0) {
    referenceImageContext = `

REFERENCE IMAGES: The user has provided ${referenceImageCount} visual reference image(s).
Analyze them carefully:
- Extract the dominant color palette and color treatment
- Identify the composition style (grid, centered, asymmetric, layered)
- Note the lighting approach (soft, dramatic, flat, cinematic)
- Observe textures, materials, and visual elements
- Understand the overall mood, aesthetic, and quality level
- Note any recurring patterns, shapes, or design motifs

Your generated visual_prompt_feed and visual_prompt_story MUST
replicate the style, mood, and quality seen in these references
while adapting to the brand identity and briefing.
Be EXTREMELY specific about replicating the visual language you observe.`;
  }

  const artStyleContext = art_style ? `\n\n${ART_STYLE_GUIDES[art_style] ?? ''}` : '';
  const videoStyleContext = video_style ? `\n\n${VIDEO_STYLE_GUIDES[video_style] ?? ''}` : '';

  const systemPrompt = `Você é um diretor criativo SÊNIOR de uma agência de marketing digital premiada, especializado em artes para redes sociais de altíssima qualidade.

Gere exatamente ${quantidade} conceitos de posts para redes sociais.

TIPO DE POST: ${tipo_post}
${tipoGuide}

${nivelGuide}

${descricao_produto ? `PRODUTO/SERVIÇO: ${descricao_produto}` : ''}
${importedContext}
${personaContext}
${identityContext}
${referenciasTipoContext}
${referenceImageContext}
${artStyleContext}
${videoStyleContext}
${salesPlanCtx}

Cada conceito DEVE ter:
- titulo: título curto e chamativo do post (máx 60 caracteres)
- legenda: legenda completa para Instagram (150-300 palavras), com emojis, parágrafos e CTA
- cta: call-to-action curto (ex: "Agende sua demo", "Link na bio")
- hashtags: array de 5-8 hashtags relevantes sem #
- visual_prompt_feed: prompt ULTRA DETALHADO em inglês para gerar uma arte de Instagram Feed (1:1 square, 1080x1080).
- visual_prompt_story: prompt ULTRA DETALHADO em inglês para gerar uma arte de Instagram Story (9:16 vertical, 1080x1920).
${incluir_video ? `- video_script: roteiro completo de vídeo curto (15-60s) com timecodes detalhados (ex: "0-3s: Gancho visual impactante...", "3-8s: Contexto do problema...", "8-15s: Solução...")
- video_description: descrição visual frame-by-frame de cada cena do vídeo (movimentos de câmera, transições, elementos visuais)
- audio_suggestion: sugestão de trilha sonora/áudio (gênero, mood, exemplos de músicas)
- visual_prompt_thumbnail: prompt ULTRA DETALHADO em inglês para gerar uma thumbnail/capa do vídeo (1:1 square, 1080x1080). Deve ser impactante e convidativo para assistir.` : ''}

REGRAS CRÍTICAS para os prompts visuais:
1. SEMPRE inclua "Do NOT include any text, letters, numbers or words in the image"
2. SEMPRE inclua "Leave compositional space for text overlay"
3. Descreva EXATAMENTE: composição, iluminação, ângulo de câmera, texturas, materiais, profundidade de campo
4. Especifique o estilo: ${estilo}
5. Cores: ${briefing.cores ?? identidade_visual?.paleta ?? 'cores vibrantes e profissionais'}
6. Cada prompt deve ter pelo menos 80 palavras de descrição visual detalhada
7. Feed é quadrado (1:1), Story é vertical (9:16) - adapte a composição para cada formato
8. Para Story, use composição vertical com elementos empilhados
9. Para Feed, use composição centrada e equilibrada
10. NUNCA gere prompts genéricos como "professional social media post" - seja ESPECÍFICO sobre cada elemento visual
${incluir_video ? `11. Para roteiros de vídeo, crie conteúdo dinâmico e envolvente pensando em Reels/TikTok
12. O roteiro deve ter gancho nos primeiros 3 segundos para prender a atenção
13. A thumbnail deve ser a cena mais impactante do vídeo` : ''}`;

  const userTextPrompt = `Briefing do cliente:
- Mês: ${briefing.mes}
- Objetivo: ${briefing.objetivo}
- Tipo de Post: ${tipo_post}
- Nível de Qualidade: ${nivel}
- Estilo Visual: ${estilo}
- Cores: ${briefing.cores ?? identidade_visual?.paleta ?? 'A critério criativo'}
- Temas: ${briefing.temas ?? 'Variados'}
- Promoções: ${briefing.promocoes ?? 'Nenhuma'}
- Observações: ${briefing.observacoes ?? 'Nenhuma'}
${descricao_produto ? `- Descrição do Produto/Serviço: ${descricao_produto}` : ''}

Gere ${quantidade} conceitos de posts com prompts visuais EXTREMAMENTE detalhados.`;

  // Return combined system + user separated by delimiter for callers that need it
  return `SYSTEM:\n${systemPrompt}\n\nUSER:\n${userTextPrompt}`;
}

/** Returns just the system prompt portion (for multi-turn callers). */
export function buildSystemPrompt(input: SocialConceptsInput): string {
  const full = buildUserPrompt(input);
  const idx = full.indexOf('\n\nUSER:\n');
  return idx >= 0 ? full.slice('SYSTEM:\n'.length, idx) : full;
}

/** Returns just the user prompt portion (for multi-turn callers). */
export function buildConceptsUserPrompt(input: SocialConceptsInput): string {
  const full = buildUserPrompt(input);
  const idx = full.indexOf('\n\nUSER:\n');
  return idx >= 0 ? full.slice(idx + '\n\nUSER:\n'.length) : full;
}
