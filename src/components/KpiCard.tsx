import { memo } from "react";
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

export const KpiCard = memo(function KpiCard({ label, value, sublabel, trend, accent, icon: Icon, delay = 0, variant }: KpiCardProps) {
  const isAccent = accent || variant === "accent";
  return (
    <div
      className={`kpi-card card-shine group ${isAccent ? "border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" : ""}`}
      style={delay ? { animationDelay: `${delay * 80}ms`, animationFillMode: "both" } : undefined}
    >
      {/* Decorative shape */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-muted/40 opacity-60 group-hover:scale-125 transition-transform duration-500" />

      <div className="flex items-center justify-between relative">
        <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.15em]">{label}</span>
        {Icon && (
          <div className="p-2.5 bg-muted/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-4 h-4 text-primary/60" />
          </div>
        )}
      </div>
      <div className="flex items-end gap-2.5 mt-1 relative">
        <span className={`text-xl font-black tracking-tight transition-colors duration-300 group-hover:text-primary truncate ${
          trend === "up" ? "text-kpi-positive" : 
          trend === "down" ? "text-kpi-negative" : 
          "text-foreground"
        }`}>
          {value}
        </span>
        {trend && (
          <span className={`mb-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 ${
            trend === "up" ? "bg-kpi-positive/10 text-kpi-positive" :
            trend === "down" ? "bg-kpi-negative/10 text-kpi-negative" :
            "bg-muted text-muted-foreground"
          }`}>
            {trend === "up" && <TrendingUp className="w-3 h-3" />}
            {trend === "down" && <TrendingDown className="w-3 h-3" />}
            {trend === "neutral" && <Minus className="w-3 h-3" />}
          </span>
        )}
      </div>
      {sublabel && <span className="text-[11px] text-muted-foreground mt-0.5 relative">{sublabel}</span>}
    </div>
  );
});
