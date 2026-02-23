import { Target, Palette, MousePointerClick } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  objetivo: string;
  estilo: string;
  cta: string;
  onObjetivo: (v: string) => void;
  onEstilo: (v: string) => void;
  onCta: (v: string) => void;
}

const OBJETIVOS = [
  { id: "leads", label: "Captura de Leads", desc: "Formulários, CTAs de conversão" },
  { id: "institucional", label: "Institucional", desc: "Apresentação da empresa e equipe" },
  { id: "vendas", label: "Vendas", desc: "Foco em conversão e compra" },
  { id: "portfolio", label: "Portfólio", desc: "Mostrar trabalhos e cases" },
];

const ESTILOS = [
  { id: "moderno", label: "Moderno e Clean", desc: "Minimalismo sofisticado" },
  { id: "corporativo", label: "Corporativo", desc: "Profissional e sóbrio" },
  { id: "ousado", label: "Ousado e Colorido", desc: "Cores vibrantes e impactante" },
  { id: "minimalista", label: "Minimalista", desc: "Essencial e elegante" },
];

function OptionGrid({ items, selected, onSelect, icon: Icon }: {
  items: { id: string; label: string; desc: string }[];
  selected: string;
  onSelect: (id: string) => void;
  icon: React.ElementType;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <Card
          key={item.id}
          className={`cursor-pointer transition-all border-2 ${
            selected === item.id ? "border-primary bg-primary/5" : "border-transparent hover:border-border"
          }`}
          onClick={() => onSelect(item.id)}
        >
          <CardContent className="py-3 px-3">
            <p className="text-xs font-bold">{item.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SiteWizardStep2({ objetivo, estilo, cta, onObjetivo, onEstilo, onCta }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          <Label className="text-xs font-bold uppercase tracking-wider">Objetivo do Site</Label>
        </div>
        <OptionGrid items={OBJETIVOS} selected={objetivo} onSelect={onObjetivo} icon={Target} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-primary" />
          <Label className="text-xs font-bold uppercase tracking-wider">Estilo Visual</Label>
        </div>
        <OptionGrid items={ESTILOS} selected={estilo} onSelect={onEstilo} icon={Palette} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <MousePointerClick className="w-4 h-4 text-primary" />
          <Label className="text-xs font-bold uppercase tracking-wider">CTA Principal</Label>
        </div>
        <Input
          value={cta}
          onChange={(e) => onCta(e.target.value)}
          placeholder="Ex: Agendar demo gratuita"
          className="text-sm"
        />
      </div>
    </div>
  );
}
