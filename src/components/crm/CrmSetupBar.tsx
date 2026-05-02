// @ts-nocheck
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, ChevronRight, Layers, UserPlus, Zap, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCrmLeads, useCrmFunnels } from "@/hooks/useClienteCrm";
import { cn } from "@/lib/utils";

interface CrmSetupBarProps {
  onOpenNewLead: () => void;
  onOpenFunnelManager: () => void;
  configRoute?: string;
}

export function CrmSetupBar({ onOpenNewLead, onOpenFunnelManager, configRoute }: CrmSetupBarProps) {
  const navigate = useNavigate();
  const { data: funnels } = useCrmFunnels();
  const { data: leads } = useCrmLeads();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("crm_setup_bar_dismissed") === "true");

  const steps = useMemo(() => {
    const hasFunnel = (funnels?.length ?? 0) > 0;
    const hasLeads = (leads?.length ?? 0) > 0;
    const hasMultipleLeads = (leads?.length ?? 0) >= 3;

    return [
      {
        key: "funnel",
        label: "Configurar funil",
        done: hasFunnel,
        icon: <Layers className="w-4 h-4" />,
        action: () => navigate(configRoute || "/cliente/crm/config"),
      },
      {
        key: "lead",
        label: "Cadastrar primeiro lead",
        done: hasLeads,
        icon: <UserPlus className="w-4 h-4" />,
        action: onOpenNewLead,
      },
      {
        key: "leads3",
        label: "Ter 3+ leads no pipeline",
        done: hasMultipleLeads,
        icon: <Zap className="w-4 h-4" />,
        action: onOpenNewLead,
      },
    ];
  }, [funnels, leads, configRoute, navigate, onOpenNewLead]);

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === steps.length;
  const progress = Math.round((completedCount / steps.length) * 100);

  if (dismissed || allDone) return null;

  const handleDismiss = () => {
    localStorage.setItem("crm_setup_bar_dismissed", "true");
    setDismissed(true);
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Configure seu CRM</span>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{steps.length} concluídos
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismiss} aria-label="Fechar">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Progress value={progress} className="h-1.5" />

      <div className="flex flex-wrap gap-2">
        {steps.map((step) => (
          <button
            key={step.key}
            onClick={step.done ? undefined : step.action}
            className={cn(
              "flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 border transition-colors",
              step.done
                ? "bg-primary/10 text-primary border-primary/20 cursor-default"
                : "bg-muted/50 text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground cursor-pointer"
            )}
          >
            {step.done ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Circle className="w-3.5 h-3.5" />
            )}
            {step.label}
            {!step.done && <ChevronRight className="w-3 h-3" />}
          </button>
        ))}
      </div>
    </div>
  );
}
