import { LAYOUT_TYPES } from "./constants";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

interface LayoutPickerProps {
  selected: string;
  onSelect: (value: string) => void;
}

/** SVG mockup thumbnails for each layout type */
function LayoutMockupSvg({ type }: { type: string }) {
  const w = 120;
  const h = 120;

  switch (type) {
    case "hero_central":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#f1f5f9" rx="4" />
          <rect x="20" y="25" width="80" height="10" rx="2" fill="#334155" />
          <rect x="30" y="42" width="60" height="6" rx="2" fill="#94a3b8" />
          <rect x="40" y="70" width="40" height="14" rx="4" fill="#3b82f6" />
          <rect x="8" y="8" width="16" height="8" rx="2" fill="#64748b" />
        </svg>
      );
    case "split_texto_imagem":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#f1f5f9" rx="4" />
          <rect x="0" y="0" width="52" height={h} fill="#f8fafc" rx="4" />
          <rect x="56" y="0" width="64" height={h} fill="#cbd5e1" rx="4" />
          <rect x="8" y="30" width="36" height="8" rx="2" fill="#334155" />
          <rect x="8" y="44" width="30" height="5" rx="1" fill="#94a3b8" />
          <rect x="8" y="54" width="28" height="5" rx="1" fill="#94a3b8" />
          <rect x="8" y="70" width="24" height="10" rx="3" fill="#3b82f6" />
          <rect x="8" y="8" width="14" height="6" rx="1" fill="#64748b" />
          <line x1="72" y1="35" x2="100" y2="35" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="86" cy="55" r="12" fill="#e2e8f0" />
        </svg>
      );
    case "card_moldura":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#3b82f6" rx="4" />
          <rect x="15" y="15" width="90" height="90" rx="12" fill="white" />
          <rect x="28" y="30" width="64" height="8" rx="2" fill="#334155" />
          <rect x="32" y="44" width="56" height="5" rx="1" fill="#94a3b8" />
          <rect x="32" y="54" width="50" height="5" rx="1" fill="#94a3b8" />
          <rect x="38" y="72" width="44" height="12" rx="4" fill="#3b82f6" />
          <rect x="8" y="4" width="12" height="6" rx="1" fill="rgba(255,255,255,0.6)" />
        </svg>
      );
    case "imagem_overlay":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#64748b" rx="4" />
          <rect width={w} height={h} fill="url(#overlay)" rx="4" />
          <defs>
            <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="60%" stopColor="rgba(0,0,0,0.6)" />
            </linearGradient>
          </defs>
          <circle cx="70" cy="30" r="15" fill="#94a3b8" opacity="0.5" />
          <rect x="12" y="65" width="70" height="10" rx="2" fill="white" />
          <rect x="12" y="82" width="50" height="5" rx="1" fill="rgba(255,255,255,0.7)" />
          <rect x="12" y="95" width="30" height="10" rx="3" fill="#3b82f6" />
        </svg>
      );
    case "grid_carrossel":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#f1f5f9" rx="4" />
          <rect x="8" y="8" width="104" height="16" rx="2" fill="#334155" />
          <rect x="8" y="30" width="48" height="32" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          <rect x="64" y="30" width="48" height="32" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          <rect x="8" y="68" width="48" height="32" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          <rect x="64" y="68" width="48" height="32" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          <circle cx="32" cy="40" r="5" fill="#3b82f6" />
          <circle cx="88" cy="40" r="5" fill="#10b981" />
          <circle cx="32" cy="78" r="5" fill="#f59e0b" />
          <circle cx="88" cy="78" r="5" fill="#ef4444" />
          <rect x="16" y="50" width="32" height="4" rx="1" fill="#94a3b8" />
          <rect x="72" y="50" width="32" height="4" rx="1" fill="#94a3b8" />
          <rect x="16" y="88" width="32" height="4" rx="1" fill="#94a3b8" />
          <rect x="72" y="88" width="32" height="4" rx="1" fill="#94a3b8" />
        </svg>
      );
    case "minimalista_clean":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="white" rx="4" />
          <rect x="25" y="50" width="70" height="8" rx="2" fill="#1e293b" />
          <rect x="40" y="65" width="40" height="5" rx="1" fill="#cbd5e1" />
          <rect x="8" y="8" width="12" height="5" rx="1" fill="#94a3b8" />
        </svg>
      );
    case "anuncio_agressivo":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#ef4444" rx="4" />
          <rect x="8" y="20" width="104" height="20" rx="3" fill="white" />
          <rect x="8" y="46" width="80" height="14" rx="2" fill="rgba(255,255,255,0.3)" />
          <rect x="30" y="80" width="60" height="18" rx="6" fill="#fbbf24" />
          <rect x="8" y="4" width="16" height="8" rx="2" fill="rgba(255,255,255,0.7)" />
        </svg>
      );
    case "premium_luxo":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#0f172a" rx="4" />
          <rect x="20" y="35" width="80" height="8" rx="2" fill="#d4a853" />
          <rect x="30" y="50" width="60" height="5" rx="1" fill="#64748b" />
          <line x1="20" y1="28" x2="100" y2="28" stroke="#d4a853" strokeWidth="0.5" />
          <line x1="20" y1="62" x2="100" y2="62" stroke="#d4a853" strokeWidth="0.5" />
          <rect x="40" y="75" width="40" height="12" rx="2" fill="transparent" stroke="#d4a853" strokeWidth="1" />
          <rect x="48" y="8" width="24" height="8" rx="1" fill="#d4a853" opacity="0.7" />
        </svg>
      );
    case "texto_dominante":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#f8fafc" rx="4" />
          <rect x="10" y="15" width="100" height="18" rx="2" fill="#0f172a" />
          <rect x="10" y="38" width="70" height="14" rx="2" fill="#3b82f6" />
          <rect x="10" y="58" width="90" height="10" rx="2" fill="#334155" />
          <rect x="10" y="80" width="50" height="8" rx="2" fill="#94a3b8" />
          <rect x="10" y="100" width="14" height="6" rx="1" fill="#64748b" />
        </svg>
      );
    default:
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <rect width={w} height={h} fill="#f1f5f9" rx="4" />
          <rect x="20" y="40" width="80" height="10" rx="2" fill="#334155" />
          <rect x="30" y="60" width="60" height="6" rx="2" fill="#94a3b8" />
        </svg>
      );
  }
}

export function LayoutPicker({ selected, onSelect }: LayoutPickerProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {LAYOUT_TYPES.map((layout) => {
        const isSelected = selected === layout.value;
        return (
          <Card
            key={layout.value}
            className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}`}
            onClick={() => onSelect(layout.value)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-square bg-muted/30 p-2">
                <LayoutMockupSvg type={layout.value} />
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="font-semibold text-xs">{layout.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{layout.desc}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
