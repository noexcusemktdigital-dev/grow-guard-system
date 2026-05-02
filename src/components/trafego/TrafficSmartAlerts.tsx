import { useMemo, type ElementType } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useAdMetrics, useAdMetricsSummary, useSyncMetrics, AdConnection } from "@/hooks/useAdPlatforms";
import { cn } from "@/lib/utils";

type AlertLevel = "danger" | "warning" | "success" | "info";

interface SmartAlert {
  level: AlertLevel;
  icon: ElementType;
  message: string;
  action?: { label: string; onClick: () => void };
}

const styles: Record<AlertLevel, string> = {
  danger: "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400",
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
  success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
  info: "border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-400",
};

interface Props {
  metaConnection: AdConnection | undefined;
}

export function TrafficSmartAlerts({ metaConnection }: Props) {
  const { data: metrics30 } = useAdMetrics(30);
  const { data: metrics7 } = useAdMetrics(7);
  const syncMutation = useSyncMetrics();

  const summary30 = useAdMetricsSummary(metrics30);
  const summary7 = useAdMetricsSummary(metrics7);

  // Semana anterior (7-14d atrás)
  const { data: metrics14 } = useAdMetrics(14);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const previousWeek = (metrics14 || []).filter((m) => m.date < sevenDaysAgo);
  const summaryPrevWeek = useAdMetricsSummary(previousWeek);

  const alerts = useMemo<SmartAlert[]>(() => {
    if (!metaConnection) return [];
    const list: SmartAlert[] = [];

    // 1. Dados desatualizados
    if (metaConnection.last_synced_at) {
      const hoursAgo = (Date.now() - new Date(metaConnection.last_synced_at).getTime()) / 3600000;
      if (hoursAgo > 24) {
        list.push({
          level: "info",
          icon: RefreshCw,
          message: `Dados desatualizados há ${Math.floor(hoursAgo)}h — clique para sincronizar`,
          action: {
            label: "Sincronizar",
            onClick: () => syncMutation.mutate(metaConnection.id),
          },
        });
      }
    } else {
      list.push({
        level: "info",
        icon: RefreshCw,
        message: "Conta conectada mas nunca sincronizada",
        action: {
          label: "Sincronizar agora",
          onClick: () => syncMutation.mutate(metaConnection.id),
        },
      });
    }

    // 2. Nenhuma campanha ativa
    const activeCampaigns = (metrics30 || []).filter(
      (m) => m.campaign_status === "ACTIVE" || m.campaign_status === "ENABLED"
    );
    if ((metrics30?.length ?? 0) > 0 && activeCampaigns.length === 0) {
      list.push({
        level: "warning",
        icon: AlertTriangle,
        message: "Nenhuma campanha ativa encontrada na conta",
      });
    }

    // 3. CPL alto vs histórico (CPL semana atual > CPL 30d em 20%)
    if (summary7.avgCpl > 0 && summary30.avgCpl > 0 && summary7.avgCpl > summary30.avgCpl * 1.2) {
      list.push({
        level: "danger",
        icon: AlertCircle,
        message: `CPL da semana (R$${summary7.avgCpl.toFixed(2)}) ${(((summary7.avgCpl - summary30.avgCpl) / summary30.avgCpl) * 100).toFixed(0)}% acima da média — revise o público`,
      });
    }

    // 4. CPL caiu vs semana passada
    if (summary7.avgCpl > 0 && summaryPrevWeek.avgCpl > 0 && summary7.avgCpl < summaryPrevWeek.avgCpl * 0.85) {
      const drop = ((summaryPrevWeek.avgCpl - summary7.avgCpl) / summaryPrevWeek.avgCpl) * 100;
      list.push({
        level: "success",
        icon: CheckCircle2,
        message: `Ótimo! Seu CPL caiu ${drop.toFixed(0)}% essa semana`,
      });
    }

    return list;
  }, [metaConnection, metrics30, summary7, summary30, summaryPrevWeek, syncMutation]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-sm",
            styles[a.level]
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <a.icon className="w-4 h-4 shrink-0" />
            <span className="font-medium truncate">{a.message}</span>
          </div>
          {a.action && (
            <button
              onClick={a.action.onClick}
              disabled={syncMutation.isPending}
              className="text-xs font-semibold underline underline-offset-2 hover:no-underline shrink-0 disabled:opacity-50"
            >
              {syncMutation.isPending ? "..." : a.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
