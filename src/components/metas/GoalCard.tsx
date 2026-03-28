import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { GoalProgressRing } from "./GoalProgressRing";
import { Target, Users, Building2, User, Calendar, TrendingUp, Pencil, Archive } from "lucide-react";

const METRIC_CONFIG: Record<string, { label: string; format: (v: number) => string }> = {
  revenue: { label: "Faturamento", format: (v) => `R$ ${v.toLocaleString("pt-BR")}` },
  leads: { label: "Leads Gerados", format: (v) => `${v}` },
  conversions: { label: "Conversão", format: (v) => `${v}%` },
  contracts: { label: "Contratos", format: (v) => `${v}` },
  meetings: { label: "Reuniões", format: (v) => `${v}` },
  avg_ticket: { label: "Ticket Médio", format: (v) => `R$ ${v.toLocaleString("pt-BR")}` },
};

const SCOPE_CONFIG: Record<string, { label: string; icon: typeof Building2 }> = {
  company: { label: "Empresa", icon: Building2 },
  team: { label: "Equipe", icon: Users },
  individual: { label: "Individual", icon: User },
};

const PRIORITY_STYLES: Record<string, string> = {
  alta: "border-destructive/40 text-destructive bg-destructive/5",
  media: "border-amber-500/40 text-amber-600 bg-amber-500/5",
  baixa: "border-muted-foreground/30 text-muted-foreground bg-muted/30",
};

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  batida: { label: "Batida ✓", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  no_ritmo: { label: "No ritmo", class: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  em_andamento: { label: "Em andamento", class: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  abaixo: { label: "Abaixo do ritmo", class: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  critica: { label: "Crítica", class: "bg-destructive/10 text-destructive border-destructive/30" },
};

interface GoalCardProps {
  goal: { metric: string; scope: string; priority: string; title: string; target_value: number; period_start?: string; period_end?: string };
  progress?: { currentValue: number; percent: number; status: string; pacePerDay: number; requiredPacePerDay: number; remaining: number; daysLeft: number };
  onEdit?: () => void;
  onArchive?: () => void;
}

export const GoalCard = memo(function GoalCard({ goal, progress, onEdit, onArchive }: GoalCardProps) {
  const metric = METRIC_CONFIG[goal.metric] || METRIC_CONFIG.revenue;
  const scope = SCOPE_CONFIG[goal.scope] || SCOPE_CONFIG.company;
  const ScopeIcon = scope.icon;
  const percent = progress?.percent ?? 0;
  const clamped = Math.min(percent, 100);
  const status = progress?.status ?? "em_andamento";
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.em_andamento;

  const progressBarColor =
    clamped >= 80 ? "bg-emerald-500" :
    clamped >= 50 ? "bg-amber-500" :
    "bg-destructive";

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className={`h-1 ${clamped >= 80 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : clamped >= 50 ? "bg-gradient-to-r from-amber-400 to-amber-600" : "bg-gradient-to-r from-red-400 to-red-600"}`} />
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Progress Ring */}
          <GoalProgressRing percent={clamped} size={60} strokeWidth={5} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <p className="font-semibold text-sm leading-tight">{goal.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <ScopeIcon className="w-3 h-3" /> {scope.label}
                  </span>
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${PRIORITY_STYLES[goal.priority] || ""}`}>
                    {goal.priority === "alta" ? "Alta" : goal.priority === "media" ? "Média" : "Baixa"}
                  </Badge>
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${statusCfg.class}`}>
                    {statusCfg.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Values */}
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{metric.label}</span>
                <span className="font-bold tabular-nums">{metric.format(progress?.currentValue ?? 0)} / {metric.format(goal.target_value)}</span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className={`h-full rounded-full transition-all duration-700 ${progressBarColor}`} style={{ width: `${clamped}%` }} />
              </div>
            </div>

            {/* Pace & Details */}
            <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
              {goal.period_start && goal.period_end && (
                <span className="flex items-center gap-0.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(goal.period_start).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} - {new Date(goal.period_end).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
              )}
              {progress && progress.daysLeft > 0 && (
                <>
                  <span className="font-medium text-foreground">{progress.daysLeft} dias restantes</span>
                  <span>Faltam: {metric.format(progress.remaining)}</span>
                  <span className="flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    Ritmo: {metric.format(Math.round(progress.pacePerDay))}/dia
                  </span>
                  <span>
                    Necessário: {metric.format(Math.round(progress.requiredPacePerDay))}/dia
                  </span>
                </>
              )}
            </div>

            {/* Projection */}
            {progress && progress.daysLeft > 0 && percent < 100 && (
              <div className={`mt-2 p-2 rounded-md text-[10px] ${
                progress.pacePerDay >= progress.requiredPacePerDay * 0.9
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : progress.pacePerDay >= progress.requiredPacePerDay * 0.7
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "bg-destructive/10 text-destructive"
              }`}>
                {(() => {
                  const totalDays = progress.pacePerDay > 0
                    ? progress.daysLeft + (progress.currentValue / progress.pacePerDay)
                    : progress.daysLeft;
                  const projectedPercent = progress.pacePerDay > 0
                    ? Math.round(progress.pacePerDay * totalDays / (goal.target_value || 1) * 100)
                    : 0;
                  const increaseNeeded = progress.pacePerDay > 0
                    ? Math.round(((progress.requiredPacePerDay / progress.pacePerDay) - 1) * 100)
                    : 100;
                  if (progress.pacePerDay >= progress.requiredPacePerDay * 0.9) {
                    return `✅ No ritmo atual, você atingirá ~${Math.min(projectedPercent, 150)}% da meta até o final do período.`;
                  } else if (progress.pacePerDay >= progress.requiredPacePerDay * 0.7) {
                    return `⚠️ Projeção: ~${Math.min(projectedPercent, 150)}% da meta. Aumente o ritmo em ${increaseNeeded}% para bater.`;
                  } else {
                    return `🚨 Ritmo crítico! Projeção: ~${Math.min(projectedPercent, 150)}% da meta. Necessário ${metric.format(Math.round(progress.requiredPacePerDay))}/dia.`;
                  }
                })()}
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 flex gap-2">
              {onEdit && (
                <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2" onClick={onEdit}>
                  <Pencil className="w-3 h-3" /> Editar
                </Button>
              )}
              {onArchive && (
                <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2 text-muted-foreground" onClick={onArchive}>
                  <Archive className="w-3 h-3" /> Arquivar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
