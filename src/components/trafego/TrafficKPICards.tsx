import type { ElementType } from "react";
import { DollarSign, Target, TrendingDown, TrendingUp, Percent, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAdMetrics, useAdMetricsSummary } from "@/hooks/useAdPlatforms";
import { formatBRL } from "@/lib/formatting";
import { cn } from "@/lib/utils";

interface KPI {
  label: string;
  value: string;
  icon: ElementType;
  delta: number | null; // % change vs previous period
  invert?: boolean; // for CPL: a queda é boa
}

function Trend({ delta, invert }: { delta: number | null; invert?: boolean }) {
  if (delta === null || !isFinite(delta)) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Minus className="w-3 h-3" /> sem comparativo
      </span>
    );
  }
  if (Math.abs(delta) < 0.5) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Minus className="w-3 h-3" /> estável
      </span>
    );
  }
  const isUp = delta > 0;
  // Para CPL (invert=true), subir é ruim
  const isPositive = invert ? !isUp : isUp;
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold tabular-nums",
        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      )}
    >
      <Icon className="w-3 h-3" />
      {isUp ? "+" : ""}
      {delta.toFixed(2).replace(".", ",")}% vs período anterior
    </span>
  );
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / prev) * 100;
}

interface TrafficKPICardsProps {
  period?: number;
}

export function TrafficKPICards({ period = 30 }: TrafficKPICardsProps) {
  // Período atual
  const { data: current } = useAdMetrics(period);
  // Período anterior: dobro do atual (para extrair janela equivalente anterior)
  const { data: fullDouble } = useAdMetrics(period * 2);

  const summaryCurrent = useAdMetricsSummary(current);

  // Calcular janela anterior (período atrás de "period" dias)
  const cutoff = new Date(Date.now() - period * 86400000).toISOString().split("T")[0];
  const previous = (fullDouble || []).filter((m) => m.date < cutoff);
  const summaryPrevious = useAdMetricsSummary(previous);

  const periodLabel = period === 7 ? "7d" : period === 30 ? "30d" : period === 90 ? "90d" : period === 180 ? "6m" : period === 365 ? "1 ano" : `${period}d`;

  const kpis: KPI[] = [
    {
      label: `Total investido (${periodLabel})`,
      value: formatBRL(summaryCurrent.totalSpend),
      icon: DollarSign,
      delta: pctDelta(summaryCurrent.totalSpend, summaryPrevious.totalSpend),
    },
    {
      label: "Leads gerados",
      value: summaryCurrent.totalConversions.toLocaleString("pt-BR"),
      icon: Target,
      delta: pctDelta(summaryCurrent.totalConversions, summaryPrevious.totalConversions),
    },
    {
      label: "CPL médio",
      value: summaryCurrent.totalConversions > 0 ? formatBRL(summaryCurrent.avgCpl) : "—",
      icon: TrendingDown,
      delta: pctDelta(summaryCurrent.avgCpl, summaryPrevious.avgCpl),
      invert: true,
    },
    {
      label: "CTR médio",
      value: `${summaryCurrent.avgCtr.toFixed(2).replace(".", ",")}%`,
      icon: Percent,
      delta: pctDelta(summaryCurrent.avgCtr, summaryPrevious.avgCtr),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((k) => (
        <Card key={k.label} className="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <k.icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                {k.label}
              </p>
            </div>
            <p className="text-2xl font-bold leading-tight tabular-nums">{k.value}</p>
            <div className="mt-1.5">
              <Trend delta={k.delta} invert={k.invert} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
