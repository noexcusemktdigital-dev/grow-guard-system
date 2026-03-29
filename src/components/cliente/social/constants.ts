// @ts-nocheck
import { Square, RectangleVertical, Smartphone, Monitor } from "lucide-react";

/* ── Art Formats ── */
export const ART_FORMATS = [
  { value: "feed", label: "1:1", desc: "Feed padrão", icon: Square, ratio: "1080×1080" },
  { value: "portrait", label: "4:5", desc: "Feed otimizado", icon: RectangleVertical, ratio: "1080×1350" },
  { value: "story", label: "9:16", desc: "Story / Reels", icon: Smartphone, ratio: "1080×1920" },
] as const;

/* ── Layout Types (Diagramação) — replaces ART_STYLES ── */
export const LAYOUT_TYPES = [
  {
    value: "hero_central",
    label: "Hero Central",
    desc: "Headline grande centralizada, sub abaixo, fundo texturizado ou foto com overlay.",
    promptRules: "Large centered headline dominating the upper 60%. Subheadline directly below in smaller weight. Background uses a textured gradient or subtle photographic image with dark overlay for contrast. CTA button centered at bottom. Brand logo small in top-left or top-right corner.",
  },
  {
    value: "split_texto_imagem",
    label: "Split Texto + Imagem",
    desc: "Texto à esquerda, imagem à direita (ou vice-versa). CTA visível.",
    promptRules: "Composition split vertically: left 45% is a solid or gradient color block with headline, supporting text and CTA stacked vertically. Right 55% is a high-quality photograph or illustration filling edge to edge. Brand logo in the text side, top corner. Clear dividing line or overlap between zones.",
  },
  {
    value: "card_moldura",
    label: "Card com Moldura",
    desc: "Card com bordas arredondadas sobre fundo colorido, texto dentro do card.",
    promptRules: "Background is a solid bold color or subtle gradient. Centered rounded card (border-radius 24px+) in white or contrasting color containing all text: headline, subheadline, bullet points, CTA. Card has subtle shadow for depth. Brand logo outside the card in a corner. Clean padding inside card.",
  },
  {
    value: "imagem_overlay",
    label: "Imagem + Overlay",
    desc: "Foto full-bleed com overlay escuro e texto sobreposto com alto contraste.",
    promptRules: "Full-bleed high-quality photograph covering entire canvas. Dark gradient overlay (40-60% opacity) concentrated on the area where text appears. White or light-colored headline text with strong contrast. Supporting text and CTA in lighter weight below. Brand logo in corner with subtle backdrop.",
  },
  {
    value: "grid_carrossel",
    label: "Grid Organizado",
    desc: "Grid estruturado estilo infográfico ou resumo, ideal para carrosséis.",
    promptRules: "Organized grid layout with 2-3 columns or rows. Each cell contains an icon/number + short text. Header zone at top with headline. Footer zone with CTA. Clean dividers between sections. Consistent spacing and alignment. Brand logo in header. Professional infographic aesthetic.",
  },
  {
    value: "minimalista_clean",
    label: "Minimalista Clean",
    desc: "60%+ espaço vazio, poucos elementos, tipografia elegante. Marcas premium.",
    promptRules: "60% or more negative space. Single focal element (one word, one object, or one graphic). Ultra-refined sans-serif or elegant serif typography. Maximum 2 colors plus white/black. No clutter, no busy backgrounds. Brand logo subtle and small. Breathing room around every element.",
  },
  {
    value: "anuncio_agressivo",
    label: "Anúncio de Impacto",
    desc: "Alto contraste, texto enorme, cores vibrantes. Máxima atenção no feed.",
    promptRules: "MAXIMUM IMPACT layout. Headline text is ENORMOUS — fills 40%+ of the canvas. Ultra-bold weight, possibly tilted 2-5 degrees. Vibrant saturated background color (red, yellow, electric blue). High contrast between text and background. CTA in contrasting accent color. Exclamation energy. Brand logo prominent.",
  },
  {
    value: "premium_luxo",
    label: "Premium / Luxo",
    desc: "Tipografia serifada, fundos escuros, detalhes dourados. Sofisticação.",
    promptRules: "Dark background (#0a0a0a to #1a1a2e). Elegant serif typography for headline. Gold, champagne, or rose-gold accent color for highlights and decorative elements. Thin ornamental lines or borders. Generous letter-spacing on headline. Brand logo in metallic finish. Overall mood: exclusive, refined, aspirational.",
  },
  {
    value: "texto_dominante",
    label: "Texto Dominante",
    desc: "Texto como elemento principal visual, imagem mínima ou ausente.",
    promptRules: "Typography IS the design. Headline uses creative typographic treatment: mixed weights, sizes, or colors within the text. Minimal or no imagery — background is solid or very subtle texture. Text occupies 70%+ of canvas. Supporting text in much smaller size. Brand logo integrated into the typographic composition. Think poster design.",
  },
] as const;

// Keep ART_STYLES as alias for backward compatibility in other files
export const ART_STYLES = LAYOUT_TYPES.map(l => ({
  value: l.value,
  label: l.label,
  desc: l.desc,
  colors: "bg-muted",
  emoji: "",
}));

/* ── Post Types ── */
export const POST_TYPES = [
  { value: "post_unico", label: "Post único", desc: "Imagem única para feed", icon: "🖼️" },
  { value: "carrossel", label: "Carrossel", desc: "Múltiplos slides (capa + conteúdo + CTA)", icon: "📚" },
  { value: "story", label: "Story", desc: "Arte vertical para stories", icon: "📱" },
] as const;

/* ── Objective options for simplified wizard ── */
export const ART_OBJECTIVES = [
  { value: "vender", label: "Vender", desc: "Converter leads em clientes" },
  { value: "educar", label: "Educar", desc: "Ensinar algo ao público" },
  { value: "engajar", label: "Engajar", desc: "Gerar interação e comentários" },
  { value: "informar", label: "Informar", desc: "Comunicar novidade ou notícia" },
  { value: "lancamento", label: "Lançamento", desc: "Divulgar produto/serviço novo" },
  { value: "autoridade", label: "Autoridade", desc: "Posicionar como referência" },
] as const;

/* ── Element Suggestions ── */
export const ELEMENT_SUGGESTIONS = [
  "Notebook com gráfico", "Smartphone", "Prédio corporativo", "Casa moderna",
  "Pessoa sorrindo", "Mesa de trabalho", "Xícara de café", "Chave de carro",
];

/* ── Scene suggestions ── */
export const SCENE_SUGGESTIONS = [
  "Empresário no escritório", "Pessoa recebendo chave", "Médico com paciente",
  "Reunião de negócios", "Estudante em biblioteca", "Chef na cozinha",
];

/* ── Print Formats (CMYK / Impressão) ── */
export const PRINT_FORMATS = [
  { value: "cartao_visita", label: "Cartão de Visita", desc: "9×5 cm (frente)", ratio: "1063×591px", w: 1063, h: 591, cm: "9×5 cm" },
  { value: "cartao_visita_verso", label: "Cartão (verso)", desc: "9×5 cm (verso)", ratio: "1063×591px", w: 1063, h: 591, cm: "9×5 cm" },
  { value: "flyer_a5", label: "Flyer A5", desc: "14.8×21 cm", ratio: "1748×2480px", w: 1748, h: 2480, cm: "14.8×21 cm" },
  { value: "flyer_a4", label: "Flyer A4", desc: "21×29.7 cm", ratio: "2480×3508px", w: 2480, h: 3508, cm: "21×29.7 cm" },
  { value: "banner_100x60", label: "Banner 100×60", desc: "100×60 cm", ratio: "3000×1800px", w: 1920, h: 1152, cm: "100×60 cm" },
] as const;

export const PRINT_TYPES = [
  { value: "cartao", label: "Cartão de Visita", icon: "💳", desc: "Frente e/ou verso" },
  { value: "flyer", label: "Flyer", icon: "📄", desc: "A5 ou A4" },
  { value: "banner", label: "Banner", icon: "🖼️", desc: "100×60 cm" },
] as const;

/* ── Video constants ── */
export const VIDEO_PLATFORMS = [
  { value: "instagram_reels", label: "Instagram Reels", format: "story" },
  { value: "tiktok", label: "TikTok", format: "story" },
  { value: "youtube_shorts", label: "YouTube Shorts", format: "story" },
  { value: "instagram_feed", label: "Feed Instagram", format: "feed" },
  { value: "youtube", label: "YouTube", format: "banner" },
];

export const VIDEO_FORMATS = [
  { value: "story", label: "9:16", desc: "Vertical (Reels/TikTok)", icon: Smartphone, aspect: "9:16" },
  { value: "feed", label: "1:1", desc: "Quadrado (Feed)", icon: Square, aspect: "1:1" },
  { value: "banner", label: "16:9", desc: "Horizontal (YouTube)", icon: Monitor, aspect: "16:9" },
];

export const VIDEO_DURATIONS = [
  { value: "5s", label: "5 segundos", frames: 3 },
  { value: "8s", label: "8 segundos", frames: 5 },
];

export const VIDEO_STYLES = [
  { value: "corporativo_moderno", label: "Corporativo moderno", desc: "Escritório, negócios, profissional" },
  { value: "premium_minimalista", label: "Premium minimalista", desc: "Elegante, clean, sofisticado" },
  { value: "publicidade_sofisticada", label: "Publicidade sofisticada", desc: "Alto padrão, comercial" },
  { value: "social_media", label: "Social media", desc: "Vibrante, dinâmico, chamativo" },
  { value: "inspiracional", label: "Inspiracional", desc: "Motivacional, corporativo aspiracional" },
];

export const MOVEMENT_SUGGESTIONS = [
  "Digitando no notebook", "Entregando chave", "Apertando mãos",
  "Analisando gráfico", "Abrindo porta", "Sorrindo para câmera",
];

export const LOADING_PHRASES = [
  "Analisando referências visuais…",
  "Construindo prompt otimizado…",
  "Aplicando identidade visual…",
  "Gerando imagem com IA…",
  "Finalizando composição…",
  "Quase pronto…",
];
