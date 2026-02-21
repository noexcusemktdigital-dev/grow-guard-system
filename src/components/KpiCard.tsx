import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  trend?: "up" | "down" | "neutral";
  accent?: boolean;
  icon?: LucideIcon;
  delay?: number;
  variant?: "default" | "accent";
}

export function KpiCard({ label, value, sublabel, trend, accent, icon: Icon, delay = 0, variant }: KpiCardProps) {
  const isAccent = accent || variant === "accent";
  return (
    <div
      className={`kpi-card animate-fade-in ${isAccent ? "border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" : ""}`}
      style={delay ? { animationDelay: `${delay * 100}ms` } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-primary/60" />}
      </div>
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
