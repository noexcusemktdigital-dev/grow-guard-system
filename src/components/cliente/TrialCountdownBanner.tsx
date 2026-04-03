import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";

export function TrialCountdownBanner() {
  const navigate = useNavigate();
  const { data: subscription } = useClienteSubscription();

  if (subscription?.status !== "trial" || !subscription?.expires_at) return null;

  const daysLeft = Math.max(0, differenceInDays(new Date(subscription.expires_at), new Date()));

  const urgency = daysLeft <= 2 ? "critical" : daysLeft <= 4 ? "warning" : "normal";

  const colors = {
    critical: "bg-destructive/10 border-destructive/20 text-destructive",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    normal: "bg-primary/8 border-primary/15 text-primary",
  }[urgency];

  return (
    <div className={`flex items-center justify-between px-4 py-2 border-b shrink-0 ${colors}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="w-4 h-4" />
        <span>
          {daysLeft === 0
            ? "Seu período de teste termina hoje!"
            : `Faltam ${daysLeft} dia${daysLeft > 1 ? "s" : ""} do seu teste grátis`}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1.5 border-current/30 hover:bg-current/10"
        onClick={() => navigate("/cliente/plano-creditos")}
      >
        Ver planos <ArrowRight className="w-3 h-3" />
      </Button>
    </div>
  );
}
