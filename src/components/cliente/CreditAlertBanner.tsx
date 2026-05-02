import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, XCircle, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreditAlert } from "@/hooks/useCreditAlert";

const DISMISS_KEY = "credit-alert-dismissed-at";

function isDismissed(): boolean {
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  const elapsed = Date.now() - Number(ts);
  return elapsed < 24 * 60 * 60 * 1000; // 24h
}

export function CreditAlertBanner() {
  const { level, percent, balance, isLoading } = useCreditAlert();
  const [dismissed, setDismissed] = useState(isDismissed);
  const navigate = useNavigate();

  if (isLoading) return null;

  if (level === "normal" || (dismissed && level !== "zero")) return null;

  const config = {
    warning: {
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-700 dark:text-amber-300",
      icon: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
      message: `Você tem ${percent.toFixed(0)}% dos créditos restantes. Considere fazer upgrade.`,
    },
    critical: {
      bg: "bg-destructive/10 border-destructive/20",
      text: "text-destructive dark:text-red-300",
      icon: <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />,
      message: `Créditos quase esgotados! Apenas ${balance.toLocaleString("pt-BR")} restantes.`,
    },
    zero: {
      bg: "bg-destructive/10 border-destructive/20",
      text: "text-destructive dark:text-red-300",
      icon: <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />,
      message: "Créditos esgotados. Funções da nossa IA estão pausadas.",
    },
  }[level];

  if (!config) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${config.bg}`}>
      {config.icon}
      <span className={`text-sm flex-1 ${config.text}`}>{config.message}</span>
      <Button
        size="sm"
        variant="ghost"
        className={`h-7 text-xs gap-1 ${config.text} hover:bg-transparent`}
        onClick={() => navigate("/cliente/plano-creditos")}
      >
        Ver Plano <ArrowRight className="w-3 h-3" />
      </Button>
      {level !== "zero" && (
        <button onClick={handleDismiss} className={`${config.text} opacity-60 hover:opacity-100`}>
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
