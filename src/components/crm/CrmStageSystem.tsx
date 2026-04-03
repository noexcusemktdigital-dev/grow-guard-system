import {
  CirclePlus, PhoneOutgoing, SearchCheck, ClipboardList,
  Handshake, ShieldCheck, Ban, Star, Sparkles, Target,
  Crosshair, CircleDot
} from "lucide-react";

export interface FunnelStage {
  key: string;
  label: string;
  color: string;
  icon: string;
  [key: string]: unknown;
}

export const STAGE_ICONS: Record<string, React.ReactNode> = {
  "circle-plus": <CirclePlus className="w-4 h-4" />,
  "phone-outgoing": <PhoneOutgoing className="w-4 h-4" />,
  "search-check": <SearchCheck className="w-4 h-4" />,
  "clipboard": <ClipboardList className="w-4 h-4" />,
  "handshake": <Handshake className="w-4 h-4" />,
  "shield-check": <ShieldCheck className="w-4 h-4" />,
  "ban": <Ban className="w-4 h-4" />,
  "star": <Star className="w-4 h-4" />,
  "sparkles": <Sparkles className="w-4 h-4" />,
  "target": <Target className="w-4 h-4" />,
  "crosshair": <Crosshair className="w-4 h-4" />,
  "circle-dot": <CircleDot className="w-4 h-4" />,
};

export const STAGE_ICON_OPTIONS = Object.keys(STAGE_ICONS);

export const STAGE_COLORS = [
  { name: "blue", label: "Azul", gradient: "from-blue-500/10 to-transparent", border: "border-blue-500/25", text: "text-blue-500", dot: "bg-blue-500", bg: "bg-blue-500", ring: "ring-blue-500/20", light: "bg-blue-500/8" },
  { name: "amber", label: "Âmbar", gradient: "from-amber-500/10 to-transparent", border: "border-amber-500/25", text: "text-amber-500", dot: "bg-amber-500", bg: "bg-amber-500", ring: "ring-amber-500/20", light: "bg-amber-500/8" },
  { name: "purple", label: "Roxo", gradient: "from-purple-500/10 to-transparent", border: "border-purple-500/25", text: "text-purple-500", dot: "bg-purple-500", bg: "bg-purple-500", ring: "ring-purple-500/20", light: "bg-purple-500/8" },
  { name: "emerald", label: "Verde", gradient: "from-emerald-500/10 to-transparent", border: "border-emerald-500/25", text: "text-emerald-500", dot: "bg-emerald-500", bg: "bg-emerald-500", ring: "ring-emerald-500/20", light: "bg-emerald-500/8" },
  { name: "red", label: "Vermelho", gradient: "from-red-500/10 to-transparent", border: "border-red-500/25", text: "text-red-500", dot: "bg-red-500", bg: "bg-red-500", ring: "ring-red-500/20", light: "bg-red-500/8" },
  { name: "cyan", label: "Ciano", gradient: "from-cyan-500/10 to-transparent", border: "border-cyan-500/25", text: "text-cyan-500", dot: "bg-cyan-500", bg: "bg-cyan-500", ring: "ring-cyan-500/20", light: "bg-cyan-500/8" },
  { name: "pink", label: "Rosa", gradient: "from-pink-500/10 to-transparent", border: "border-pink-500/25", text: "text-pink-500", dot: "bg-pink-500", bg: "bg-pink-500", ring: "ring-pink-500/20", light: "bg-pink-500/8" },
  { name: "orange", label: "Laranja", gradient: "from-orange-500/10 to-transparent", border: "border-orange-500/25", text: "text-orange-500", dot: "bg-orange-500", bg: "bg-orange-500", ring: "ring-orange-500/20", light: "bg-orange-500/8" },
  { name: "indigo", label: "Índigo", gradient: "from-indigo-500/10 to-transparent", border: "border-indigo-500/25", text: "text-indigo-500", dot: "bg-indigo-500", bg: "bg-indigo-500", ring: "ring-indigo-500/20", light: "bg-indigo-500/8" },
  { name: "teal", label: "Teal", gradient: "from-teal-500/10 to-transparent", border: "border-teal-500/25", text: "text-teal-500", dot: "bg-teal-500", bg: "bg-teal-500", ring: "ring-teal-500/20", light: "bg-teal-500/8" },
];

export const getColorStyle = (colorName: string) => STAGE_COLORS.find(c => c.name === colorName) || STAGE_COLORS[0];

export const DEFAULT_STAGES: FunnelStage[] = [
  { key: "novo", label: "Novo Lead", color: "blue", icon: "circle-plus" },
  { key: "contato", label: "Contato", color: "amber", icon: "phone-outgoing" },
  { key: "qualificacao", label: "Qualificação", color: "cyan", icon: "search-check" },
  { key: "proposta", label: "Proposta", color: "purple", icon: "clipboard" },
  { key: "negociacao", label: "Negociação", color: "orange", icon: "handshake" },
  { key: "fechado", label: "Fechado", color: "emerald", icon: "shield-check" },
  { key: "perdido", label: "Perdido", color: "red", icon: "ban" },
];
