import { Square, RectangleVertical, Smartphone, Monitor } from "lucide-react";

/* ── Art Formats ── */
export const ART_FORMATS = [
  { value: "feed", label: "1:1", desc: "Feed padrão", icon: Square, ratio: "1080×1080" },
  { value: "portrait", label: "4:5", desc: "Feed otimizado", icon: RectangleVertical, ratio: "1080×1350" },
  { value: "story", label: "9:16", desc: "Story / Reels", icon: Smartphone, ratio: "1080×1920" },
] as const;

/* ── Art Styles with descriptive thumbnails ── */
export const ART_STYLES = [
  {
    value: "minimalista",
    label: "Minimalista",
    desc: "Fundo clean, tipografia elegante, pouca informação visual. Ideal para marcas premium.",
    colors: "bg-gradient-to-br from-slate-50 to-slate-200",
    emoji: "✨",
  },
  {
    value: "bold_impacto",
    label: "Bold / Impacto",
    desc: "Cores vibrantes, texto grande e chamativo, forte contraste. Para chamar atenção no feed.",
    colors: "bg-gradient-to-br from-orange-500 to-red-600",
    emoji: "🔥",
  },
  {
    value: "editorial",
    label: "Editorial",
    desc: "Layout tipo revista, grids organizados, sofisticado. Para conteúdos educativos e autoridade.",
    colors: "bg-gradient-to-br from-stone-100 to-amber-100",
    emoji: "📰",
  },
  {
    value: "organico",
    label: "Orgânico",
    desc: "Formas fluidas, texturas naturais, cores suaves. Para marcas humanizadas e próximas.",
    colors: "bg-gradient-to-br from-emerald-100 to-teal-200",
    emoji: "🌿",
  },
  {
    value: "corporativo",
    label: "Corporativo",
    desc: "Profissional, sóbrio, tons escuros com destaques. Para B2B e mercado financeiro.",
    colors: "bg-gradient-to-br from-slate-800 to-blue-900",
    emoji: "🏢",
  },
  {
    value: "criativo_pop",
    label: "Criativo / Pop",
    desc: "Colorido, divertido, elementos gráficos, ícones. Para público jovem e engajamento.",
    colors: "bg-gradient-to-br from-purple-500 to-pink-500",
    emoji: "🎨",
  },
] as const;

/* ── Post Types ── */
export const POST_TYPES = [
  { value: "post_unico", label: "Post único", desc: "Imagem única para feed", icon: "🖼️" },
  { value: "carrossel", label: "Carrossel", desc: "Múltiplos slides (capa + conteúdo + CTA)", icon: "📚" },
  { value: "story", label: "Story", desc: "Arte vertical para stories", icon: "📱" },
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
