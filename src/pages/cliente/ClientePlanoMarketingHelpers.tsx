import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Palette, Monitor, Zap, Users, PenTool, CheckSquare, ExternalLink,
} from "lucide-react";

/* ═══════════════ ANIMATED COUNTER ═══════════════ */

export function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
      className="font-bold text-2xl"
    >
      {value}{suffix}
    </motion.span>
  );
}

/* ═══════════════ SCORE RING ═══════════════ */

export function ScoreRing({ score, label, size = 120 }: { score: number; label: string; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "hsl(var(--chart-2, 160 60% 45%))" : score >= 40 ? "hsl(var(--chart-3, 30 80% 55%))" : "hsl(var(--destructive))";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      <p className="text-xs font-medium text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

/* ═══════════════ TAG LIST ═══════════════ */

export function TagList({ items, variant = "secondary" }: { items: string[]; variant?: "secondary" | "outline" | "default" }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Badge key={i} variant={variant} className="text-xs">{item}</Badge>
      ))}
    </div>
  );
}

/* ═══════════════ TOOL BUTTON ═══════════════ */

const TOOL_ICON_MAP: Record<string, React.ElementType> = {
  conteudos: FileText,
  postagens: Palette,
  sites: Monitor,
  trafego: Zap,
  crm: Users,
  scripts: PenTool,
  manual: CheckSquare,
};

const TOOL_ROUTES_MAP: Record<string, { label: string; path: string }> = {
  conteudos: { label: "Conteudos", path: "/cliente/conteudos" },
  postagens: { label: "Postagens", path: "/cliente/redes-sociais" },
  sites: { label: "Sites", path: "/cliente/sites" },
  trafego: { label: "Trafego Pago", path: "/cliente/trafego-pago" },
  crm: { label: "CRM", path: "/cliente/crm" },
  scripts: { label: "Scripts", path: "/cliente/scripts" },
  manual: { label: "Manual", path: "#" },
};

export function ToolButton({ ferramenta }: { ferramenta: string }) {
  const navigate = useNavigate();
  const tool = TOOL_ROUTES_MAP[ferramenta] || TOOL_ROUTES_MAP.manual;
  const Icon = TOOL_ICON_MAP[ferramenta] || CheckSquare;
  if (ferramenta === "manual") return null;
  return (
    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(tool.path)}>
      <Icon className="w-3.5 h-3.5" /> {tool.label} <ExternalLink className="w-3 h-3" />
    </Button>
  );
}
