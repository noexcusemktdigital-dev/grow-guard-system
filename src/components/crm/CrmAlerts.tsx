import { AlertTriangle, Clock, Flame, TrendingUp } from "lucide-react";
import type { CrmAlert } from "@/data/crmData";

const iconMap = {
  "no-contact": AlertTriangle,
  "overdue-task": Clock,
  "hot-stalled": Flame,
  "conversion-rate": TrendingUp,
};

const bgMap = {
  "no-contact": "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
  "overdue-task": "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800",
  "hot-stalled": "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
  "conversion-rate": "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
};

interface CrmAlertsProps {
  alerts: CrmAlert[];
}

export function CrmAlerts({ alerts }: CrmAlertsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {alerts.map((alert) => {
        const Icon = iconMap[alert.type];
        return (
          <div
            key={alert.type}
            className={`flex items-center gap-3 p-3 rounded-lg border ${bgMap[alert.type]} transition-all`}
          >
            <Icon className={`w-5 h-5 ${alert.color} flex-shrink-0 ${alert.type === "no-contact" && alert.count > 0 ? "animate-pulse" : ""}`} />
            <div className="min-w-0">
              <div className={`text-lg font-bold ${alert.color}`}>
                {alert.type === "conversion-rate" ? `${alert.count}%` : alert.count}
              </div>
              <div className="text-xs text-muted-foreground truncate">{alert.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
