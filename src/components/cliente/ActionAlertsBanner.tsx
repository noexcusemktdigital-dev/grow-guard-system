// @ts-nocheck
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Target, MessageSquare, Wallet, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCrmLeads } from "@/hooks/useClienteCrm";
import { useActiveGoals } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { useClienteWallet } from "@/hooks/useClienteWallet";

interface Alert {
  id: string;
  icon: React.ElementType;
  message: string;
  path: string;
  cta: string;
  variant: "warning" | "danger";
}

export function ActionAlertsBanner() {
  const navigate = useNavigate();
  const { data: leads } = useCrmLeads();
  const { data: activeGoals } = useActiveGoals();
  const { data: goalProgress } = useGoalProgress(activeGoals);
  const { data: wallet } = useClienteWallet();

  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem("dismissed_alerts");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const dismiss = (id: string) => {
    setDismissed(prev => {
      const next = new Set(prev).add(id);
      sessionStorage.setItem("dismissed_alerts", JSON.stringify([...next]));
      return next;
    });
  };

  const alerts = useMemo(() => {
    const result: Alert[] = [];

    // Leads sem contato há 48h+
    if (leads) {
      const cutoff = Date.now() - 48 * 60 * 60 * 1000;
      const staleLeads = leads.filter(
        (l) => !l.won_at && !l.lost_at && new Date(l.updated_at).getTime() < cutoff
      );
      if (staleLeads.length > 0) {
        result.push({
          id: "stale_leads",
          icon: AlertTriangle,
          message: `${staleLeads.length} lead${staleLeads.length > 1 ? "s" : ""} sem contato há mais de 48h`,
          path: "/cliente/crm",
          cta: "Ver Leads",
          variant: "warning",
        });
      }
    }

    // Metas abaixo de 30%
    if (activeGoals && goalProgress) {
      const criticalGoals = activeGoals.filter((g) => {
        const p = goalProgress[g.id];
        return p && p.percent < 30 && p.daysLeft < 20;
      });
      if (criticalGoals.length > 0) {
        result.push({
          id: "critical_goals",
          icon: Target,
          message: `${criticalGoals.length} meta${criticalGoals.length > 1 ? "s" : ""} abaixo de 30% do ritmo ideal`,
          path: "/cliente/plano-vendas",
          cta: "Ver Metas",
          variant: "danger",
        });
      }
    }

    // Créditos baixos
    if (wallet && wallet.balance < 50) {
      result.push({
        id: "low_credits",
        icon: Wallet,
        message: `Saldo de créditos baixo: ${wallet.balance} restantes`,
        path: "/cliente/plano-creditos",
        cta: "Recarregar",
        variant: "danger",
      });
    }

    return result.filter((a) => !dismissed.has(a.id)).slice(0, 3);
  }, [leads, activeGoals, goalProgress, wallet, dismissed]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {alerts.map((alert) => {
        const Icon = alert.icon;
        const isDanger = alert.variant === "danger";
        return (
          <div
            key={alert.id}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm ${
              isDanger
                ? "bg-destructive/5 border-destructive/20 text-destructive"
                : "bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-xs font-medium">{alert.message}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px] gap-1 px-2"
              onClick={() => navigate(alert.path)}
            >
              {alert.cta} <ArrowRight className="w-3 h-3" />
            </Button>
            <button
              onClick={() => dismiss(alert.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
