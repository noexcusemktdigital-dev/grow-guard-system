// @ts-nocheck

import { lazy, Suspense, useMemo } from "react";
import {
  Target, Plus, CheckCircle2, AlertCircle, TrendingUp, Building2, User,
  Users, FileText, Receipt, ChevronDown,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GoalCard } from "@/components/metas/GoalCard";
import { GoalProgressRing } from "@/components/metas/GoalProgressRing";
import { MESES_COMPLETOS } from "./ClientePlanoVendasData";

// PERF-WARN-01: recharts deferred — charts only render when user has active goals with progress data.
const MetasCharts = lazy(() => import("./ClientePlanoVendasMetasCharts"));

export interface GoalItem {
  id: string;
  title?: string;
  metric?: string;
  target_value?: number;
  scope?: string;
  priority?: string;
  [key: string]: unknown;
}

export interface GoalProgressItem {
  currentValue: number;
  percent: number;
  [key: string]: unknown;
}

export interface ClientePlanoVendasMetasProps {
  activeGoals: GoalItem[];
  historicGoals: GoalItem[] | undefined;
  goalProgress: Record<string, GoalProgressItem> | undefined;
  goalsLoading: boolean;
  scopeFilter: string;
  setScopeFilter: (v: string) => void;
  onNewMeta: () => void;
  onEditMeta: (goal: GoalItem) => void;
  onArchiveMeta: (id: string) => void;
  isMonetaryMetric: (m: string) => boolean;
}

export function ClientePlanoVendasMetas({
  activeGoals, historicGoals, goalProgress, goalsLoading, scopeFilter, setScopeFilter,
  onNewMeta, onEditMeta, onArchiveMeta, isMonetaryMetric,
}: ClientePlanoVendasMetasProps) {
  const anoAtual = new Date().getFullYear();
  const progValues = goalProgress ? Object.values(goalProgress) : [];
  const hasGoals = activeGoals && activeGoals.length > 0;

  const getBarColor = (pct: number) => {
    if (pct >= 80) return "hsl(var(--chart-3))";
    if (pct >= 50) return "hsl(var(--chart-2))";
    return "hsl(var(--destructive))";
  };

  const progressChartData = useMemo(() => {
    if (!activeGoals?.length || !goalProgress) return [];
    return [...activeGoals]
      .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
      .map(g => {
        const p = goalProgress[g.id];
        return {
          name: g.title?.length > 25 ? g.title.slice(0, 22) + "..." : g.title,
          atual: p?.currentValue ?? 0,
          alvo: g.target_value ?? 0,
          percent: p?.percent ?? 0,
        };
      });
  }, [activeGoals, goalProgress]);

  const evolutionChartData = useMemo(() => {
    if (!activeGoals?.length || !goalProgress) return [];
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();
    const data = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const point: Record<string, unknown> = { dia: d };
      activeGoals.forEach(g => {
        const p = goalProgress[g.id];
        if (!p) return;
        const idealPerDay = (g.target_value ?? 0) / daysInMonth;
        point[`ideal_${g.id}`] = Math.round(idealPerDay * d);
        if (d <= currentDay) {
          point[`real_${g.id}`] = Math.round((p.currentValue / currentDay) * d);
        }
      });
      data.push(point);
    }
    return data;
  }, [activeGoals, goalProgress]);

  const scopeChartData = useMemo(() => {
    if (!activeGoals?.length || !goalProgress) return [];
    const scopeGroups: Record<string, number[]> = { company: [], team: [], individual: [] };
    activeGoals.forEach(g => {
      const p = goalProgress[g.id];
      if (p) {
        const scope = g.scope || "company";
        if (!scopeGroups[scope]) scopeGroups[scope] = [];
        scopeGroups[scope].push(Math.min(p.percent, 100));
      }
    });
    const labels: Record<string, string> = { company: "Empresa", team: "Equipe", individual: "Individual" };
    return Object.entries(scopeGroups)
      .filter(([, vals]) => vals.length > 0)
      .map(([scope, vals]) => ({
        name: labels[scope] || scope,
        media: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
        total: vals.length,
      }));
  }, [activeGoals, goalProgress]);

  return (
    <>
      {/* Header + Filters + Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Metas Comerciais</p>
          <p className="text-xs text-muted-foreground">Acompanhe suas metas com dados reais do CRM · {MESES_COMPLETOS[new Date().getMonth()]} {anoAtual}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => {
            if (!activeGoals.length) return;
            const rows = activeGoals.map(g => {
              const p = goalProgress?.[g.id];
              return [g.title, g.metric, g.target_value, p?.currentValue ?? 0, p?.percent ?? 0, g.scope, g.priority].join(",");
            });
            const csv = "Meta,Métrica,Alvo,Atual,%,Escopo,Prioridade\n" + rows.join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `metas-${anoAtual}.csv`; a.click(); URL.revokeObjectURL(url);
          }}>
            <FileText className="w-3 h-3" /> CSV
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={async () => {
            const el = document.getElementById("metas-report-area");
            if (!el) return;
            const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import("jspdf"), import("html2canvas")]);
            const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL("image/jpeg", 0.95);
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const imgW = pageW;
            const imgH = (canvas.height * imgW) / canvas.width;
            let y = 0;
            while (y < imgH) { if (y > 0) pdf.addPage(); pdf.addImage(imgData, "JPEG", 0, -y, imgW, imgH); y += pageH; }
            pdf.save(`relatorio-metas-${anoAtual}.pdf`);
          }}>
            <Receipt className="w-3 h-3" /> PDF
          </Button>
          <Button size="sm" className="gap-1" onClick={onNewMeta}>
            <Plus className="w-3 h-3" /> Nova Meta
          </Button>
        </div>
      </div>

      {/* Scope Filters */}
      <div className="flex bg-secondary rounded-lg p-0.5 w-fit">
        {[
          { value: "all", label: "Todas", icon: Target },
          { value: "company", label: "Empresa", icon: Building2 },
          { value: "team", label: "Equipe", icon: Users },
          { value: "individual", label: "Individual", icon: User },
        ].map(f => (
          <button key={f.value} onClick={() => setScopeFilter(f.value)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${scopeFilter === f.value ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <f.icon className="w-3 h-3" /> {f.label}
          </button>
        ))}
      </div>

      <div id="metas-report-area">
      {/* KPI Summary */}
      {hasGoals && goalProgress && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {(() => {
            const total = activeGoals.length;
            const achieved = progValues.filter(p => p.percent >= 100).length;
            const avgPct = progValues.length > 0 ? Math.round(progValues.reduce((s, p) => s + Math.min(p.percent, 100), 0) / progValues.length) : 0;
            const highPriority = activeGoals.filter(g => g.priority === "alta").length;
            return [
              { label: "Metas Ativas", value: total, icon: Target, color: "text-primary" },
              { label: "Batidas", value: achieved, icon: CheckCircle2, color: "text-emerald-500" },
              { label: "Progresso Médio", value: `${avgPct}%`, icon: TrendingUp, color: "text-amber-500" },
              { label: "Alta Prioridade", value: highPriority, icon: AlertCircle, color: "text-destructive" },
            ].map((kpi, i) => (
              <Card key={i}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  <div>
                    <p className="text-lg font-bold tabular-nums">{kpi.value}</p>
                    <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                  </div>
                </CardContent>
              </Card>
            ));
          })()}
        </div>
      )}

      {/* Charts */}
      {hasGoals && goalProgress && (
        <Suspense fallback={<div className="h-48 animate-pulse bg-muted rounded-xl" />}>
          <MetasCharts
            progressChartData={progressChartData}
            scopeChartData={scopeChartData}
            evolutionChartData={evolutionChartData}
            activeGoals={activeGoals}
            getBarColor={getBarColor}
          />
        </Suspense>
      )}

      {/* Goals List */}
      {goalsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <Card key={i}><CardContent className="h-40 animate-pulse bg-muted rounded" /></Card>)}
        </div>
      ) : !hasGoals ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">Nenhuma meta ativa</p>
            <p className="text-xs text-muted-foreground mt-1">Crie metas integradas ao CRM para acompanhar seu desempenho.</p>
            <Button size="sm" variant="outline" className="mt-4 gap-1" onClick={onNewMeta}>
              <Plus className="w-3 h-3" /> Criar primeira meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={goalProgress?.[goal.id]}
              onEdit={() => onEditMeta(goal)}
              onArchive={() => onArchiveMeta(goal.id)}
            />
          ))}
        </div>
      )}
      </div>{/* close metas-report-area */}

      {/* Historic */}
      {historicGoals && historicGoals.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
            <ChevronDown className="w-4 h-4" />
            Histórico de Metas ({historicGoals.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {historicGoals.map(goal => {
              const pctVal = goal.target_value > 0 ? Math.round(((goal.current_value || 0) / goal.target_value) * 100) : 0;
              const achieved = pctVal >= 100;
              return (
                <Card key={goal.id} className="opacity-70">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GoalProgressRing percent={Math.min(pctVal, 100)} size={36} strokeWidth={3} />
                      <div>
                        <p className="text-xs font-medium">{goal.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {goal.period_start && new Date(goal.period_start).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[9px] ${achieved ? "border-emerald-500/30 text-emerald-600" : "border-destructive/30 text-destructive"}`}>
                      {achieved ? "Batida" : `${pctVal}%`}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      )}
    </>
  );
}
