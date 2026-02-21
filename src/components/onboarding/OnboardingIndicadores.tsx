import { Progress } from "@/components/ui/progress";
import { Users, DollarSign, FileText, Target, Zap } from "lucide-react";
import type { OnboardingIndicators } from "@/data/onboardingData";

interface OnboardingIndicadoresProps {
  indicators: OnboardingIndicators | undefined;
}

export function OnboardingIndicadoresView({ indicators }: OnboardingIndicadoresProps) {
  if (!indicators) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Indicadores não disponíveis para esta unidade.</p>
      </div>
    );
  }

  const kpis = [
    { label: "Clientes Ativos", value: indicators.clientesAtivos, icon: Users, format: (v: number) => String(v) },
    { label: "Receita Acumulada", value: indicators.receita, icon: DollarSign, format: (v: number) => `R$ ${v.toLocaleString("pt-BR")}` },
    { label: "Propostas Enviadas", value: indicators.propostasEnviadas, icon: FileText, format: (v: number) => String(v) },
    { label: "Leads Gerados", value: indicators.leadsGerados, icon: Zap, format: (v: number) => String(v) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="w-4 h-4" />
                <span className="text-xs">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold">{kpi.format(kpi.value)}</p>
            </div>
          );
        })}
      </div>

      {/* Meta atingida card */}
      <div className="p-4 rounded-lg border border-border bg-card space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Target className="w-4 h-4" />
          <span className="text-sm font-medium">Meta Atingida</span>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={indicators.metaAtingidaPct} className="h-3 flex-1" />
          <span className="text-lg font-bold">{indicators.metaAtingidaPct}%</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center italic">
        Dados referentes aos primeiros 90 dias da unidade. Valores simulados — integração automática em desenvolvimento.
      </p>
    </div>
  );
}
