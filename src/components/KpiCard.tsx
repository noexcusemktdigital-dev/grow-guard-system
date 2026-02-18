import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  trend?: "up" | "down" | "neutral";
  accent?: boolean;
}

export function KpiCard({ label, value, sublabel, trend, accent }: KpiCardProps) {
  return (
    <div className={`kpi-card animate-fade-in ${accent ? "border-primary/30" : ""}`}>
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-end gap-2 mt-1">
        <span className={`text-2xl font-bold ${
          trend === "up" ? "text-kpi-positive" : 
          trend === "down" ? "text-kpi-negative" : 
          "text-foreground"
        }`}>
          {value}
        </span>
        {trend && (
          <span className="mb-1">
            {trend === "up" && <TrendingUp className="w-4 h-4 text-kpi-positive" />}
            {trend === "down" && <TrendingDown className="w-4 h-4 text-kpi-negative" />}
            {trend === "neutral" && <Minus className="w-4 h-4 text-kpi-neutral" />}
          </span>
        )}
      </div>
      {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
    </div>
  );
}
