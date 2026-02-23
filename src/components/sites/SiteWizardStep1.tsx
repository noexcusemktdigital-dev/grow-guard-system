import { Globe, Lock, FileText, Layout, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  selected: string;
  onSelect: (type: string) => void;
  allowedTypes: string[];
  activeSites: number;
  maxSites: number;
}

const SITE_TYPES = [
  {
    id: "lp",
    label: "Landing Page",
    desc: "1 página — Hero, Features, Depoimentos, CTA, Footer",
    icon: FileText,
    pages: 1,
  },
  {
    id: "3pages",
    label: "Site 3 Páginas",
    desc: "Home + Sobre + Contato",
    icon: Layout,
    pages: 3,
  },
  {
    id: "5pages",
    label: "Site 5 Páginas",
    desc: "Home + Sobre + Serviços + Depoimentos + Contato",
    icon: Layers,
    pages: 5,
  },
  {
    id: "8pages",
    label: "Site 8 Páginas",
    desc: "Home + Sobre + Serviços + Portfólio + Blog + Depoimentos + FAQ + Contato",
    icon: Globe,
    pages: 8,
  },
];

const planForType: Record<string, string> = {
  "3pages": "Growth",
  "5pages": "Growth",
  "8pages": "Scale",
};

export function SiteWizardStep1({ selected, onSelect, allowedTypes, activeSites, maxSites }: Props) {
  const atLimit = activeSites >= maxSites;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          Sites ativos: <span className="text-foreground font-bold">{activeSites}/{maxSites}</span>
        </p>
        {atLimit && (
          <Badge variant="destructive" className="text-[9px]">Limite atingido</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SITE_TYPES.map((t) => {
          const allowed = allowedTypes.includes(t.id);
          const disabled = !allowed || atLimit;
          const isSelected = selected === t.id;
          const Icon = t.icon;

          return (
            <Card
              key={t.id}
              className={`cursor-pointer transition-all border-2 ${
                isSelected ? "border-primary bg-primary/5" : "border-transparent hover:border-border"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !disabled && onSelect(t.id)}
            >
              <CardContent className="py-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-primary/20" : "bg-muted"
                }`}>
                  {disabled && !allowed ? (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">{t.label}</p>
                    {!allowed && planForType[t.id] && (
                      <Badge variant="outline" className="text-[8px]">
                        Plano {planForType[t.id]}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
