// @ts-nocheck
import { memo } from "react";
import { AlertTriangle, ArrowUpRight, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface UsageQuotaBannerProps {
  used: number;
  limit: number; // -1 = ilimitado
  label: string;
  planName: string;
}

export const UsageQuotaBanner = memo(function UsageQuotaBanner({ used, limit, label, planName }: UsageQuotaBannerProps) {
  if (limit === -1) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <InfinityIcon className="w-4 h-4 text-emerald-600 shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {used} {label} usados este mês
          </p>
          <p className="text-[10px] text-emerald-600/70">Ilimitado no plano {planName}</p>
        </div>
      </div>
    );
  }

  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  const atLimit = used >= limit;
  const isWarning = percentage >= 50 && percentage < 80;
  const isDanger = percentage >= 80;

  const colorClass = atLimit
    ? "border-red-500/30 bg-red-500/5"
    : isDanger
      ? "border-red-500/20 bg-red-500/[0.03]"
      : isWarning
        ? "border-amber-500/20 bg-amber-500/[0.03]"
        : "border-border bg-muted/30";

  const progressColor = atLimit || isDanger
    ? "[&>[data-state=complete]>div]:bg-red-500 [&>div]:bg-red-500"
    : isWarning
      ? "[&>[data-state=complete]>div]:bg-amber-500 [&>div]:bg-amber-500"
      : "";

  return (
    <div className={`rounded-xl border px-4 py-3 space-y-2 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {atLimit && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
          <p className="text-xs font-semibold">
            {used} de {limit} {label} usados este mês
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground">Plano {planName}</span>
      </div>
      <Progress value={Math.min(percentage, 100)} className={`h-1.5 ${progressColor}`} />
      {atLimit && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-red-600 font-medium">
            Limite atingido. Faça upgrade para continuar gerando.
          </p>
          <Button size="sm" variant="outline" className="text-[10px] h-7 gap-1 text-primary border-primary/30">
            <ArrowUpRight className="w-3 h-3" /> Fazer Upgrade
          </Button>
        </div>
      )}
    </div>
  );
});
