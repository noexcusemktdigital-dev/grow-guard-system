// @ts-nocheck
import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { formatBRL } from "@/lib/formatting";
import { Trophy, BarChart3, Target, Plus, TrendingUp, Medal, Users, CalendarDays, Inbox, MoreVertical, Pencil, Archive, Star, Flame, Zap, Lock, Crown, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { useGoals, useRankings, useGoalMutations } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { useUnits } from "@/hooks/useUnits";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useNetworkTrophies } from "@/hooks/useNetworkTrophies";
import type { TrophyId } from "@/hooks/useTrophyProgress";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const MONETARY_TYPES = ["faturamento", "avg_ticket", "revenue"];
const isMonetaryType = (type: string) => MONETARY_TYPES.includes(type);
const formatMetricValue = (v: number, type: string) => isMonetaryType(type) ? formatBRL(v) : v.toLocaleString("pt-BR");
const parseFormattedNumber = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;
const formatInputNumber = (s: string) => {
  const digits = s.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("pt-BR");
};

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "metas", label: "Metas", icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "ranking", label: "Ranking", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
];

const trophyDefs: { id: TrophyId; title: string; icon: React.ElementType }[] = [
  { id: "first_sale", title: "1ª Venda", icon: Star },
  { id: "hat_trick", title: "Hat-trick", icon: Flame },
  { id: "top_revenue", title: "Top Faturamento", icon: TrendingUp },
  { id: "speed_close", title: "Relâmpago", icon: Zap },
  { id: "first_goal", title: "1ª Meta", icon: Target },
  { id: "ten_clients", title: "10 Clientes", icon: Users },
];

export default function MetasRanking() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, role } = useAuth();
  const { data: goals, isLoading: loadingGoals } = useGoals();
  const now = new Date();
  const { data: rankings, isLoading: loadingRankings } = useRankings(now.getMonth() + 1, now.getFullYear());
  const { data: units } = useUnits();
  const { data: orgMembers } = useOrgMembers();
  const { data: networkTrophies, isLoading: loadingNetworkTrophies } = useNetworkTrophies();
  const { createGoal, updateGoal, archiveGoal } = useGoalMutations();

  const activeGoals = (goals ?? []).filter((g: Record<string, unknown>) => g.status === "active");
  const { data: goalProgress } = useGoalProgress(activeGoals.length > 0 ? activeGoals : undefined);

  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Tables<'goals'> | null>(null);
  const currentYear = new Date().getFullYear();
  const [goalForm, setGoalForm] = useState({ title: "", type: "faturamento", target_value: "", scope: "rede", unit_org_id: "", period_month_num: "", period_year: String(currentYear) });

  const isLoading = loadingGoals || loadingRankings;

  const goalsWithProgress = activeGoals.map((g: Record<string, unknown>) => {
    const progress = goalProgress?.[g.id];
    return { ...g, realPercent: progress?.percent ?? 0, realValue: progress?.currentValue ?? 0, status_calc: progress?.status ?? "em_andamento" };
  });

  const metasAtingidas = goalsWithProgress.filter(g => g.realPercent >= 100).length;
  const avgProgress = goalsWithProgress.length > 0
    ? Math.round(goalsWithProgress.reduce((sum, g) => sum + Math.min(100, g.realPercent), 0) / goalsWithProgress.length)
    : 0;

  const openNewGoal = () => {
    setEditingGoal(null);
    setGoalForm({ title: "", type: "faturamento", target_value: "", scope: "rede", unit_org_id: "", period_month_num: "", period_year: String(currentYear) });
    setShowGoalDialog(true);
  };

  const openEditGoal = (g: Record<string, unknown>) => {
    setEditingGoal(g);
    const pMonth = g.period_start ? String(Number(g.period_start.substring(5, 7))) : "";
    const pYear = g.period_start ? g.period_start.substring(0, 4) : String(currentYear);
    setGoalForm({
      title: g.title || "",
      type: g.type || g.metric || "faturamento",
      target_value: g.target_value ? Number(g.target_value).toLocaleString("pt-BR") : "",
      scope: g.scope || "rede",
      unit_org_id: g.unit_org_id || "",
      period_month_num: pMonth,
      period_year: pYear,
    });
    setShowGoalDialog(true);
  };

  const handleSaveGoal = () => {
    if (!goalForm.title || !goalForm.target_value) return;
    const payload: Record<string, unknown> = {
      title: goalForm.title,
      type: goalForm.type,
      target_value: parseFormattedNumber(goalForm.target_value),
      scope: goalForm.scope,
      unit_org_id: goalForm.scope === "unidade" ? goalForm.unit_org_id : null,
      period_start: goalForm.period_month_num ? `${goalForm.period_year}-${goalForm.period_month_num.padStart(2, "0")}-01` : undefined,
      period_end: goalForm.period_month_num
        ? new Date(Number(goalForm.period_year), Number(goalForm.period_month_num), 0).toISOString().split("T")[0]
        : undefined,
      metric: goalForm.type,
    };

    if (editingGoal) {
      updateGoal.mutate({ id: editingGoal.id, ...payload }, {
        onSuccess: () => { toast.success("Meta atualizada"); setShowGoalDialog(false); },
        onError: () => toast.error("Erro ao atualizar meta"),
      });
    } else {
      createGoal.mutate({ ...payload, status: "active" }, {
        onSuccess: () => { toast.success("Meta criada com sucesso"); setShowGoalDialog(false); },
        onError: () => toast.error("Erro ao criar meta"),
      });
    }
  };

  const handleArchiveGoal = (id: string) => {
    archiveGoal.mutate(id, {
      onSuccess: () => toast.success("Meta arquivada"),
      onError: () => toast.error("Erro ao arquivar"),
    });
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Metas Ativas", value: activeGoals.length, icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Atingimento Médio", value: `${avgProgress}%`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Unidades no Target", value: (rankings ?? []).filter((r: Record<string, unknown>) => (r.score as number) >= 80).length, icon: Users, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Metas Atingidas", value: metasAtingidas, icon: Medal, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(rankings ?? []).length > 0 ? (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Ranking do Mês</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(rankings ?? []).slice(0, 5).map((r: Record<string, unknown>, i: number) => {
                const unit = (units ?? []).find((u: Record<string, unknown>) => u.unit_org_id === r.unit_org_id);
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-500/20 text-amber-600" : i === 1 ? "bg-gray-300/20 text-gray-600" : i === 2 ? "bg-orange-500/20 text-orange-600" : "bg-muted text-muted-foreground"}`}>
                      {r.position || i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{unit?.name || `Unidade ${i + 1}`}</p>
                    </div>
                    <p className="text-sm font-bold">{(r.score ?? 0).toLocaleString("pt-BR")} pts</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Nenhum ranking disponível para este mês.</CardContent></Card>
      )}
    </div>
  );

  const renderMetas = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm">Metas da Rede</h3>
        <Button size="sm" className="gap-1.5" onClick={openNewGoal}>
          <Plus className="w-4 h-4" /> Nova Meta
        </Button>
      </div>
      {(goals ?? []).length === 0 ? (
        <div className="text-center py-12"><Inbox className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Nenhuma meta criada ainda.</p></div>
      ) : (
        <div className="grid gap-3">
          {(goals ?? []).map((g: Record<string, unknown>) => {
            const gp = goalProgress?.[g.id];
            const progress = gp ? Math.min(100, Math.round(gp.percent)) : 0;
            const currentValue = gp?.currentValue ?? 0;
            const unit = g.unit_org_id ? (units ?? []).find((u: Record<string, unknown>) => u.unit_org_id === g.unit_org_id) : null;
            const statusColor = gp?.status === "batida" ? "text-green-500" : gp?.status === "critica" ? "text-red-500" : gp?.status === "abaixo" ? "text-orange-500" : "text-blue-500";
            return (
              <Card key={g.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{g.title}</h4>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{g.type || g.metric || "—"}</Badge>
                        <Badge variant={g.status === "active" ? "default" : "secondary"} className="text-[10px]">{g.status}</Badge>
                        {g.scope === "unidade" && unit && <Badge variant="secondary" className="text-[10px]">{unit.name}</Badge>}
                        {g.scope === "rede" && <Badge variant="secondary" className="text-[10px]">Rede</Badge>}
                        {g.scope === "matriz" && <Badge variant="secondary" className="text-[10px]">Matriz</Badge>}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatMetricValue(g.target_value, g.type || g.metric || "")}</p>
                        {gp && <p className={`text-xs font-medium ${statusColor}`}>Atual: {formatMetricValue(currentValue, g.type || g.metric || "")}</p>}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Mais opções">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditGoal(g)}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchiveGoal(g.id)} className="text-destructive">
                            <Archive className="w-4 h-4 mr-2" /> Arquivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  {gp && gp.daysLeft > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      Faltam {gp.daysLeft} dias • Ritmo necessário: {formatMetricValue(gp.requiredPacePerDay, g.type || g.metric || "")}/dia
                    </p>
                  )}
                  {g.period_start && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(g.period_start).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderRanking = () => (
    <div className="space-y-6">
      {/* Ranking Mensal */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">Ranking Mensal — {now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h3>
        {(rankings ?? []).length === 0 ? (
          <div className="text-center py-8"><Inbox className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Nenhum dado de ranking disponível.</p></div>
        ) : (
          <div className="space-y-3">
            {(rankings ?? []).map((r: Record<string, unknown>, i: number) => {
              const unit = (units ?? []).find((u: Record<string, unknown>) => u.unit_org_id === r.unit_org_id);
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <Card key={r.id} className={i < 3 ? "border-amber-500/20" : ""}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <span className="text-2xl w-10 text-center">{medals[i] || `#${r.position || i + 1}`}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{unit?.name || "Unidade"}</p>
                      <p className="text-xs text-muted-foreground">{unit?.city || ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{(r.score ?? 0).toLocaleString("pt-BR")}</p>
                      <p className="text-[10px] text-muted-foreground">pontos</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Troféus da Rede */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Troféus da Rede
        </h3>
        {loadingNetworkTrophies ? (
          <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        ) : !units?.length ? (
          <p className="text-sm text-muted-foreground">Nenhuma unidade cadastrada.</p>
        ) : (
          <div className="space-y-3">
            {(units ?? []).map((unit: Record<string, unknown>) => {
              const unitTrophies = networkTrophies?.[unit.unit_org_id];
              const unlockedCount = unitTrophies ? Object.values(unitTrophies).filter(t => t.unlocked).length : 0;
              return (
                <Card key={unit.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold">{unit.name}</p>
                        <p className="text-xs text-muted-foreground">{unlockedCount}/6 troféus</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{unit.city || "—"}</Badge>
                    </div>
                    <div className="flex gap-2">
                      {trophyDefs.map((td) => {
                        const Icon = td.icon;
                        const unlocked = unitTrophies?.[td.id]?.unlocked ?? false;
                        return (
                          <div
                            key={td.id}
                            title={td.title}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              unlocked ? "bg-yellow-500/15 text-yellow-400" : "bg-muted text-muted-foreground/40"
                            }`}
                          >
                            {unlocked ? <Icon className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Time Interno da Matriz */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" /> Time Interno da Matriz
        </h3>
        {!orgMembers?.length ? (
          <p className="text-sm text-muted-foreground">Nenhum membro encontrado.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {orgMembers.map((member) => {
              // Count goals assigned to this member
              const memberGoals = activeGoals.filter((g: Record<string, unknown>) => g.assigned_to === member.user_id);
              const memberAchieved = memberGoals.filter((g: Record<string, unknown>) => {
                const gp = goalProgress?.[g.id];
                return gp && gp.percent >= 100;
              }).length;
              return (
                <Card key={member.user_id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {(member.full_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{member.full_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">{member.job_title || member.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{memberGoals.length}</p>
                      <p className="text-[10px] text-muted-foreground">{memberAchieved} atingidas</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20">
            <Trophy className="w-7 h-7 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-header-title">Metas & Ranking</h1>
              <Badge variant="secondary" className="text-[10px]">Franqueadora</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Performance, gamificação e metas da rede</p>
          </div>
        </div>
      </div>

      {/* Minhas Metas — visível para usuários não-admin */}
      {role !== "cliente_admin" && role !== "admin" && role !== "super_admin" && (() => {
        const myGoals = activeGoals.filter((g: Tables<'goals'>) => g.assigned_to === user?.id);
        const myCompletedGoals = myGoals.filter((g: Tables<'goals'>) => {
          const gp = goalProgress?.[g.id];
          return gp && gp.percent >= 100;
        });

        if (myGoals.length === 0) {
          return (
            <div className="text-center py-8 text-muted-foreground text-sm mb-2 border border-dashed rounded-lg">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Nenhuma meta atribuída a você ainda.</p>
              <p className="text-xs mt-1">Fale com o administrador para criar suas metas.</p>
            </div>
          );
        }

        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Minhas Metas</h2>
              <Badge variant="outline">{myCompletedGoals.length}/{myGoals.length} concluídas</Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {myGoals.map((goal: Tables<'goals'>) => {
                const gp = goalProgress?.[goal.id];
                const progress = Math.min(gp?.percent ?? 0, 100);
                const currentValue = gp?.currentValue ?? 0;
                const isCompleted = progress >= 100;
                const deadlineRaw = goal.deadline || goal.period_end;
                const deadline = deadlineRaw ? new Date(deadlineRaw) : null;
                const isOverdue = deadline && deadline < new Date() && !isCompleted;
                const metricType = goal.metric || goal.type || "";

                return (
                  <Card key={goal.id} className={cn(
                    "border",
                    isCompleted && "border-green-500/30 bg-green-500/5",
                    isOverdue && "border-red-500/30 bg-red-500/5"
                  )}>
                    <CardContent className="pt-4 pb-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{goal.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {goal.metric_label || metricType}
                          </p>
                        </div>
                        {isCompleted && (
                          <Badge className="bg-green-500 text-white shrink-0">✓ Concluída</Badge>
                        )}
                        {isOverdue && (
                          <Badge variant="destructive" className="shrink-0">Atrasada</Badge>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-bold text-primary">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isCompleted ? "bg-green-500" :
                              progress >= 70 ? "bg-primary" :
                              progress >= 40 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="text-center p-2 bg-muted/40 rounded-lg">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Atual</p>
                          <p className="text-lg font-bold text-primary">
                            {formatMetricValue(currentValue, metricType)}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-muted/40 rounded-lg">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Meta</p>
                          <p className="text-lg font-bold">
                            {formatMetricValue(goal.target_value || 0, metricType)}
                          </p>
                        </div>
                      </div>

                      {deadline && (
                        <p className={cn(
                          "text-xs",
                          isOverdue ? "text-red-500" : "text-muted-foreground"
                        )}>
                          {isOverdue ? "⚠ " : "🗓 "}
                          Prazo: {format(deadline, "dd/MM/yyyy", { locale: ptBR })}
                          {!isCompleted && !isOverdue && ` (${formatDistanceToNow(deadline, { locale: ptBR, addSuffix: true })})`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
      ) : (
        <>
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "metas" && renderMetas()}
          {activeTab === "ranking" && renderRanking()}
        </>
      )}

      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingGoal ? "Editar Meta" : "Nova Meta"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={goalForm.title} onChange={(e) => setGoalForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Faturamento Março" /></div>
            <div><Label>Tipo / Métrica</Label>
              <Select value={goalForm.type} onValueChange={(v) => setGoalForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="faturamento">Faturamento</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="contratos">Contratos</SelectItem>
                  <SelectItem value="contratos_ativos">Contratos Ativos</SelectItem>
                  <SelectItem value="nps">NPS</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor Alvo</Label><Input type="text" inputMode="numeric" value={goalForm.target_value} onChange={(e) => setGoalForm(f => ({ ...f, target_value: formatInputNumber(e.target.value) }))} placeholder="10.000" /></div>
            <div><Label>Escopo</Label>
              <Select value={goalForm.scope} onValueChange={(v) => setGoalForm(f => ({ ...f, scope: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rede">Toda a Rede</SelectItem>
                  <SelectItem value="matriz">Matriz (interna)</SelectItem>
                  <SelectItem value="unidade">Por Unidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {goalForm.scope === "unidade" && (
              <div><Label>Unidade</Label>
                <Select value={goalForm.unit_org_id} onValueChange={(v) => setGoalForm(f => ({ ...f, unit_org_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                  <SelectContent>
                    {(units ?? []).map((u: Record<string, unknown>) => <SelectItem key={u.id as string} value={(u.unit_org_id || u.id) as string}>{u.name as string}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mês</Label>
                <Select value={goalForm.period_month_num} onValueChange={(v) => setGoalForm(f => ({ ...f, period_month_num: v }))}>
                  <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                  <SelectContent>
                    {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ano</Label>
                <Select value={goalForm.period_year} onValueChange={(v) => setGoalForm(f => ({ ...f, period_year: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[currentYear, currentYear + 1, currentYear + 2].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveGoal} disabled={(createGoal.isPending || updateGoal.isPending) || !goalForm.title || !goalForm.target_value}>
              {(createGoal.isPending || updateGoal.isPending) ? "Salvando..." : editingGoal ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
