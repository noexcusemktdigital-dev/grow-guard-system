import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useStrategyData } from "@/hooks/useStrategyData";

interface StrategyBannerProps {
  toolName: string;
  dataUsed: string;
}

export function StrategyBanner({ toolName, dataUsed }: StrategyBannerProps) {
  const navigate = useNavigate();
  const { hasStrategy, status } = useStrategyData();

  if (hasStrategy && status === "approved") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        <p className="text-xs text-foreground/80 flex-1">
          <span className="font-semibold">Estratégia ativa</span> — {dataUsed} estão sendo usados para personalizar {toolName}.
        </p>
        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 px-2" onClick={() => navigate("/cliente/plano-marketing")}>
          Ver <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  if (!hasStrategy) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-foreground/80 flex-1">
          Crie uma <span className="font-semibold">Estratégia de Marketing</span> para personalizar automaticamente {toolName}.
        </p>
        <Button variant="outline" size="sm" className="text-xs gap-1 h-7 px-2" onClick={() => navigate("/cliente/plano-marketing")}>
          Criar <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return null;
}
