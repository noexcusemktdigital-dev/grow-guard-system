import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TemplateConfig } from "@/lib/canvasTemplateEngine";

export interface ArtTemplateOption {
  id: string;
  name: string;
  description: string;
  preview: {
    bg: string;
    accent: string;
    textColor: string;
    pattern: "diagonal" | "clean" | "dark-gold" | "gradient" | "photo" | "grid";
  };
  getConfig: (opts: { brandColors: string[]; logoUrl?: string; titulo: string; subtitulo: string; cta: string; format: "feed" | "story"; backgroundImageUrl?: string }) => TemplateConfig;
}

const mkFeedStory = (format: "feed" | "story") => ({
  w: 1080,
  h: format === "feed" ? 1080 : 1920,
});

export const ART_TEMPLATES: ArtTemplateOption[] = [
  {
    id: "impacto-bold",
    name: "Impacto Bold",
    description: "Fundo escuro, texto grande uppercase, faixas diagonais",
    preview: { bg: "from-slate-900 to-slate-800", accent: "bg-red-500", textColor: "text-white", pattern: "diagonal" },
    getConfig: ({ brandColors, logoUrl, titulo, subtitulo, cta, format, backgroundImageUrl }) => {
      const { w, h } = mkFeedStory(format);
      const p = brandColors[0] || "#E63946";
      return {
        width: w, height: h, brandColors, logoUrl,
        background: { type: backgroundImageUrl ? "image" : "solid", imageUrl: backgroundImageUrl, color: "#1a1a2e", imageFit: "cover", overlay: { color: "#000", opacity: 0.5 } },
        elements: [
          { type: "shape", shape: "diagonal-stripe", x: 0, y: h * 0.55, width: w, height: h * 0.45, color: p, opacity: 0.9 },
          { type: "text", content: titulo, x: 60, y: h * 0.62, width: w - 120, fontSize: 72, fontFamily: "Montserrat", fontWeight: "black", color: "#FFF", align: "left", textTransform: "uppercase", letterSpacing: 3 },
          { type: "text", content: subtitulo, x: 60, y: h * 0.8, width: w - 120, fontSize: 32, fontFamily: "Montserrat", fontWeight: "normal", color: "#eee", align: "left" },
          { type: "shape", shape: "rect", x: 60, y: h * 0.9, width: 300, height: 50, color: "#FFF", opacity: 1, borderRadius: 25 },
          { type: "text", content: cta, x: 60, y: h * 0.905, width: 300, fontSize: 22, fontFamily: "Montserrat", fontWeight: "bold", color: p, align: "center" },
        ],
      };
    },
  },
  {
    id: "clean-moderno",
    name: "Clean Moderno",
    description: "Fundo claro, tipografia fina, muito espaço branco",
    preview: { bg: "from-gray-50 to-white", accent: "bg-blue-500", textColor: "text-gray-900", pattern: "clean" },
    getConfig: ({ brandColors, logoUrl, titulo, subtitulo, cta, format, backgroundImageUrl }) => {
      const { w, h } = mkFeedStory(format);
      const p = brandColors[0] || "#3B82F6";
      return {
        width: w, height: h, brandColors, logoUrl,
        background: { type: backgroundImageUrl ? "image" : "solid", imageUrl: backgroundImageUrl, color: "#FAFAFA", imageFit: "cover", imageMask: backgroundImageUrl ? "frame-inset" : "full", overlay: backgroundImageUrl ? { color: "#FFF", opacity: 0.1 } : undefined },
        elements: [
          { type: "shape", shape: "rect", x: 0, y: h * 0.7, width: w, height: h * 0.3, color: "#FFFFFF", opacity: 0.95 },
          { type: "text", content: titulo, x: 80, y: h * 0.73, width: w - 160, fontSize: 48, fontFamily: "Inter", fontWeight: "bold", color: "#1a1a1a", align: "center" },
          { type: "text", content: subtitulo, x: 80, y: h * 0.85, width: w - 160, fontSize: 24, fontFamily: "Inter", fontWeight: "normal", color: "#666", align: "center" },
          { type: "shape", shape: "line", x: w * 0.35, y: h * 0.82, width: w * 0.3, height: 0, color: p, opacity: 1, borderWidth: 3 },
        ],
      };
    },
  },
  {
    id: "elegante-premium",
    name: "Elegante Premium",
    description: "Fundo escuro, acentos dourados, tipografia serifada",
    preview: { bg: "from-zinc-900 to-zinc-800", accent: "bg-amber-400", textColor: "text-amber-200", pattern: "dark-gold" },
    getConfig: ({ brandColors, logoUrl, titulo, subtitulo, cta, format, backgroundImageUrl }) => {
      const { w, h } = mkFeedStory(format);
      return {
        width: w, height: h, brandColors, logoUrl,
        background: { type: backgroundImageUrl ? "image" : "solid", imageUrl: backgroundImageUrl, color: "#1C1C1C", imageFit: "cover", overlay: { color: "#000", opacity: 0.6 } },
        elements: [
          { type: "shape", shape: "frame", x: w * 0.06, y: h * 0.06, width: w * 0.88, height: h * 0.88, color: "#D4AF37", opacity: 0.7, borderWidth: 2 },
          { type: "text", content: titulo, x: 100, y: h * 0.38, width: w - 200, fontSize: 56, fontFamily: "Playfair Display", fontWeight: "bold", color: "#F5F0E1", align: "center", lineHeight: 1.2 },
          { type: "shape", shape: "line", x: w * 0.3, y: h * 0.55, width: w * 0.4, height: 0, color: "#D4AF37", opacity: 0.8, borderWidth: 2 },
          { type: "text", content: subtitulo, x: 100, y: h * 0.6, width: w - 200, fontSize: 28, fontFamily: "Playfair Display", fontWeight: "normal", color: "#D4AF37", align: "center" },
          { type: "text", content: cta, x: 100, y: h * 0.85, width: w - 200, fontSize: 20, fontFamily: "Inter", fontWeight: "bold", color: "#D4AF37", align: "center", letterSpacing: 4, textTransform: "uppercase" },
        ],
      };
    },
  },
  {
    id: "colorido-vibrante",
    name: "Colorido Vibrante",
    description: "Gradientes, formas orgânicas, sans-serif bold",
    preview: { bg: "from-purple-600 via-pink-500 to-orange-400", accent: "bg-yellow-300", textColor: "text-white", pattern: "gradient" },
    getConfig: ({ brandColors, logoUrl, titulo, subtitulo, cta, format, backgroundImageUrl }) => {
      const { w, h } = mkFeedStory(format);
      const p = brandColors[0] || "#8B5CF6";
      const s = brandColors[1] || "#EC4899";
      return {
        width: w, height: h, brandColors, logoUrl,
        background: backgroundImageUrl
          ? { type: "image", imageUrl: backgroundImageUrl, imageFit: "cover", overlay: { color: p, opacity: 0.4 } }
          : { type: "gradient", gradientColors: [p, s, "#F97316"], gradientAngle: 135, imageFit: "cover" },
        elements: [
          { type: "shape", shape: "circle", x: -w * 0.2, y: -h * 0.1, width: w * 0.5, height: w * 0.5, color: "#FFF", opacity: 0.08 },
          { type: "shape", shape: "circle", x: w * 0.7, y: h * 0.7, width: w * 0.4, height: w * 0.4, color: "#FFF", opacity: 0.06 },
          { type: "text", content: titulo, x: 60, y: h * 0.35, width: w - 120, fontSize: 64, fontFamily: "Poppins", fontWeight: "black", color: "#FFF", align: "center", textTransform: "uppercase" },
          { type: "text", content: subtitulo, x: 80, y: h * 0.58, width: w - 160, fontSize: 28, fontFamily: "Poppins", fontWeight: "normal", color: "rgba(255,255,255,0.9)", align: "center" },
          { type: "shape", shape: "rect", x: w * 0.25, y: h * 0.78, width: w * 0.5, height: 56, color: "#FFF", opacity: 1, borderRadius: 28 },
          { type: "text", content: cta, x: w * 0.25, y: h * 0.785, width: w * 0.5, fontSize: 22, fontFamily: "Poppins", fontWeight: "bold", color: p, align: "center" },
        ],
      };
    },
  },
  {
    id: "foto-destaque",
    name: "Foto Destaque",
    description: "Foto full-bleed com overlay e texto sobre",
    preview: { bg: "from-black to-gray-800", accent: "bg-white/20", textColor: "text-white", pattern: "photo" },
    getConfig: ({ brandColors, logoUrl, titulo, subtitulo, cta, format, backgroundImageUrl }) => {
      const { w, h } = mkFeedStory(format);
      const p = brandColors[0] || "#E63946";
      return {
        width: w, height: h, brandColors, logoUrl,
        background: { type: backgroundImageUrl ? "image" : "solid", imageUrl: backgroundImageUrl, color: "#222", imageFit: "cover", overlay: { color: "#000", opacity: 0.35 } },
        elements: [
          { type: "shape", shape: "rect", x: 0, y: h * 0.65, width: w, height: h * 0.35, color: "rgba(0,0,0,0.6)", opacity: 1 },
          { type: "text", content: titulo, x: 60, y: h * 0.68, width: w - 120, fontSize: 56, fontFamily: "Montserrat", fontWeight: "black", color: "#FFF", align: "left", shadow: { blur: 20, color: "rgba(0,0,0,0.8)", offsetX: 0, offsetY: 4 } },
          { type: "text", content: subtitulo, x: 60, y: h * 0.82, width: w - 120, fontSize: 26, fontFamily: "Montserrat", fontWeight: "normal", color: "rgba(255,255,255,0.85)", align: "left" },
          { type: "shape", shape: "rect", x: 60, y: h * 0.92, width: 250, height: 48, color: p, opacity: 1, borderRadius: 24 },
          { type: "text", content: cta, x: 60, y: h * 0.925, width: 250, fontSize: 20, fontFamily: "Montserrat", fontWeight: "bold", color: "#FFF", align: "center" },
        ],
      };
    },
  },
  {
    id: "corporativo-pro",
    name: "Corporativo Pro",
    description: "Grid limpo, cores neutras, logo no topo",
    preview: { bg: "from-slate-100 to-slate-200", accent: "bg-blue-900", textColor: "text-slate-800", pattern: "grid" },
    getConfig: ({ brandColors, logoUrl, titulo, subtitulo, cta, format, backgroundImageUrl }) => {
      const { w, h } = mkFeedStory(format);
      const p = brandColors[0] || "#1E3A5F";
      return {
        width: w, height: h, brandColors, logoUrl,
        background: backgroundImageUrl
          ? { type: "image", imageUrl: backgroundImageUrl, imageFit: "cover", imageMask: "right-half" }
          : { type: "solid", color: "#F8F9FA", imageFit: "cover" },
        elements: [
          { type: "shape", shape: "rect", x: 0, y: 0, width: backgroundImageUrl ? w * 0.5 : w, height: h, color: "#FFFFFF", opacity: backgroundImageUrl ? 1 : 0 },
          { type: "shape", shape: "rect", x: 0, y: 0, width: w, height: 6, color: p, opacity: 1 },
          { type: "text", content: titulo, x: 60, y: h * 0.35, width: (backgroundImageUrl ? w * 0.45 : w) - 120, fontSize: 48, fontFamily: "Inter", fontWeight: "bold", color: p, align: "left", lineHeight: 1.2 },
          { type: "text", content: subtitulo, x: 60, y: h * 0.58, width: (backgroundImageUrl ? w * 0.45 : w) - 120, fontSize: 24, fontFamily: "Inter", fontWeight: "normal", color: "#555", align: "left" },
          { type: "shape", shape: "rect", x: 60, y: h * 0.78, width: 240, height: 48, color: p, opacity: 1, borderRadius: 8 },
          { type: "text", content: cta, x: 60, y: h * 0.785, width: 240, fontSize: 18, fontFamily: "Inter", fontWeight: "bold", color: "#FFF", align: "center" },
        ],
      };
    },
  },
];

/* ── Template Selector Grid ── */
interface TemplateSelectorProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function TemplatePreviewCard({ template, selected, onClick }: { template: ArtTemplateOption; selected: boolean; onClick: () => void }) {
  const p = template.preview;
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group rounded-xl overflow-hidden border-2 transition-all duration-200 text-left",
        selected ? "border-primary ring-2 ring-primary/30 scale-[1.02]" : "border-border hover:border-primary/40 hover:shadow-lg"
      )}
    >
      {/* Mini preview */}
      <div className={cn("h-36 bg-gradient-to-br flex items-center justify-center relative", p.bg)}>
        {p.pattern === "diagonal" && <div className="absolute bottom-0 left-0 w-full h-1/3 bg-red-500/80 skew-y-[-3deg] origin-bottom-left" />}
        {p.pattern === "dark-gold" && <div className="absolute inset-4 border border-amber-400/50 rounded" />}
        {p.pattern === "grid" && <div className="absolute right-0 top-0 w-1/2 h-full bg-slate-300/30" />}
        <div className={cn("relative z-10 px-4 text-center", p.textColor)}>
          <div className="text-sm font-bold truncate">{template.name}</div>
          <div className="text-[10px] opacity-70 mt-0.5">{template.description}</div>
        </div>
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center z-20">
            <Check className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
        )}
      </div>
      <div className="p-2.5 bg-card">
        <p className="text-xs font-semibold truncate">{template.name}</p>
      </div>
    </button>
  );
}

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {ART_TEMPLATES.map(t => (
        <TemplatePreviewCard key={t.id} template={t} selected={selectedId === t.id} onClick={() => onSelect(t.id)} />
      ))}
    </div>
  );
}
