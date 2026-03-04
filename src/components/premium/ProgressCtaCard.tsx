import React from "react";
import { Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProgressCtaCardProps {
  title?: string;
  level?: string;
  metaLabel?: string;
  metaDescription?: string;
  percent: number;
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaDescription?: string;
  ctaButtonLabel?: string;
  onCtaClick?: () => void;
}

export const ProgressCtaCard = React.forwardRef<HTMLDivElement, ProgressCtaCardProps>(function ProgressCtaCard({
  title = "MEU PROGRESSO DE VENDAS",
  level = "NÍVEL PRO",
  metaLabel = "META MENSAL",
  metaDescription = "Faltam R$ 12.000 para o bônus de performance.",
  percent = 82,
  ctaTitle = "AÇÃO NECESSÁRIA",
  ctaSubtitle = "PRÓXIMA BLITZ DE CONTEÚDO",
  ctaDescription = "Prepare 3 stories com o novo roteiro até as 14h de amanhã.",
  ctaButtonLabel = "VER ROTEIRO",
  onCtaClick,
}, ref) {
  return (
    <div ref={ref} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Progress Card */}
      <div className="lg:col-span-2 glass-card p-6 lg:p-8 relative overflow-hidden">
        {/* Decorative shape */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-muted/20" />

        <div className="flex items-center justify-between mb-6 relative">
          <h3 className="page-header-title text-base">{title}</h3>
          <Badge variant="outline" className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border-foreground/20">
            {level}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mb-5 relative">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-extrabold uppercase tracking-wider">{metaLabel}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{metaDescription}</p>
          </div>
          <span className="text-3xl font-black tracking-tight">{percent}%</span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 rounded-full bg-muted/60 overflow-hidden relative">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>

      {/* Dark CTA Card */}
      <div className="glass-card p-6 lg:p-8 bg-[hsl(220,15%,10%)] dark:bg-[hsl(220,15%,8%)] border-[hsl(220,10%,18%)] text-white relative overflow-hidden flex flex-col justify-between">
        {/* Decorative circle */}
        <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative space-y-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
            {ctaTitle}
          </p>
          <h4 className="text-lg font-black uppercase italic tracking-tight leading-tight">
            {ctaSubtitle}
          </h4>
          <p className="text-xs text-white/60 leading-relaxed">{ctaDescription}</p>
        </div>

        <Button
          onClick={onCtaClick}
          className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold uppercase tracking-wider text-xs py-3 rounded-xl relative"
        >
          {ctaButtonLabel}
        </Button>
      </div>
    </div>
  );
});
