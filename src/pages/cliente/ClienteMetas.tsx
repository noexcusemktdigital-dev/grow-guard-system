import { useState, useMemo } from "react";
import {
  Target, Plus, CheckCircle2, AlertCircle, TrendingUp,
  Building2, Users, User, Calendar, ChevronDown, Archive, Pencil,
  BarChart3,
} from "lucide-react";
import { useActiveGoals, useHistoricGoals, useGoalMutations } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { useCrmTeams } from "@/hooks/useCrmTeams";
import { useCrmTeam } from "@/hooks/useCrmTeam";
import { GoalCard } from "@/components/metas/GoalCard";
import { GoalProgressRing } from "@/components/metas/GoalProgressRing";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, AreaChart, Area, Cell, Legend, ReferenceLine,
} from "recharts";

const METRIC_OPTIONS = [
  { value: "revenue", label: "Faturamento" },
  { value: "leads", label: "Leads Gerados" },
  { value: "conversions", label: "Taxa de Conversão" },
  { value: "contracts", label: "Contratos Fechados" },
  { value: "meetings", label: "Reuniões" },
  { value: "avg_ticket", label: "Ticket Médio" },
];

const METRIC_FORMAT: Record<string, (v: number) => string> = {
  revenue: (v) => `R$ ${v.toLocaleString("pt-BR")}`,
  leads: (v) => `${v}`,
  conversions: (v) => `${v}%`,
  contracts: (v) => `${v}`,
  meetings: (v) => `${v}`,
  avg_ticket: (v) => `R$ ${v.toLocaleString("pt-BR")}`,
};

const MESES_COMPLETOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function ClienteMetas() {
  const anoAtual = new Date().getFullYear();
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [novaMetaOpen, setNovaMetaOpen] = useState(false);
  const [novaMeta, setNovaMeta] = useState({ title: "", metric: "revenue", target_value: 0, scope: "company", team_id: "", assigned_to: "", priority: "media", mesRef: "" });
  const [targetDisplay, setTargetDisplay] = useState("");

  const { data: activeGoals, isLoading: goalsLoading } = useActiveGoals(scopeFilter);
  const { data: historicGoals } = useHistoricGoals();
  const { data: goalProgress } = useGoalProgress(activeGoals);
  const { createGoal, archiveGoal } = useGoalMutations();
  const { data: teams } = useCrmTeams();
  const { data: members } = useCrmTeam();

  const isMonetaryMetric = (m: string) => ["revenue", "avg_ticket"].includes(m);

  // ═══ CHARTS DATA ═══

  // Chart 1: Progress per goal (horizontal bar)
  const progressChartData = useMemo(() => {
    if (!activeGoals?.length || !goalProgress) return [];
    return activeGoals.map(g => {
      const p = goalProgress[g.id];
      return {
        name: g.title?.length > 25 ? g.title.slice(0, 22) + "..." : g.title,
        atual: p?.currentValue ?? 0,
        alvo: g.target_value ?? 0,
        percent: p?.percent ?? 0,
      };
    });
  }, [activeGoals, goalProgress]);

  // Chart 2: Daily evolution (simulated from progress data)
  const evolutionChartData = useMemo(() => {
    if (!activeGoals?.length || !goalProgress) return [];
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();

    // Build data points for the month
    const data = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const point: any = { dia: d };
      activeGoals.forEach(g => {
        const p = goalProgress[g.id];
        if (!p) return;
        const idealPerDay = (g.target_value ?? 0) / daysInMonth;
        point[`ideal_${g.id}`] = Math.round(idealPerDay * d);
        if (d <= currentDay) {
          // Linear interpolation of current value up to today
          point[`real_${g.id}`] = Math.round((p.currentValue / currentDay) * d);
        }
      });
      data.push(point);
    }
    return data;
  }, [activeGoals, goalProgress]);

  // Chart 3: Scope comparison
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

  const getBarColor = (pct: number) => {
    if (pct >= 80) return "hsl(var(--chart-3))";
    if (pct >= 50) return "hsl(var(--chart-2))";
    return "hsl(var(--destructive))";
  };

  // ═══ ADD META ═══
  const handleAddMeta = () => {
    if (!novaMeta.title || novaMeta.target_value <= 0 || !novaMeta.mesRef) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (novaMeta.scope === "team" && !novaMeta.team_id) {
      toast({ title: "Selecione o time para a meta de equipe", variant: "destructive" });
      return;
    }
    if (novaMeta.scope === "individual" && !novaMeta.assigned_to) {
      toast({ title: "Selecione a pessoa responsável pela meta individual", variant: "destructive" });
      return;
    }
    const [y, m] = novaMeta.mesRef.split("-").map(Number);
    const periodStart = new Date(y, m - 1, 1).toISOString();
    const periodEnd = new Date(y, m, 0, 23, 59, 59).toISOString();
    createGoal.mutate({
      title: novaMeta.title,
      target_value: novaMeta.target_value,
      metric: novaMeta.metric,
      scope: novaMeta.scope,
      priority: novaMeta.priority,
      team_id: novaMeta.scope === "team" && novaMeta.team_id ? novaMeta.team_id : undefined,
      assigned_to: novaMeta.scope === "individual" && novaMeta.assigned_to ? novaMeta.assigned_to : undefined,
      period_start: periodStart,
      period_end: periodEnd,
      status: "active",
    }, {
      onSuccess: () => {
        setNovaMeta({ title: "", metric: "revenue", target_value: 0, scope: "company", team_id: "", assigned_to: "", priority: "media", mesRef: "" });
        setTargetDisplay("");
        setNovaMetaOpen(false);
        toast({ title: "Meta criada com sucesso!" });
      },
    });
  };

  const progValues = goalProgress ? Object.values(goalProgress) : [];
  const hasGoals = activeGoals && activeGoals.length > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Metas Comerciais"
        subtitle={`Acompanhe suas metas com dados reais do CRM · ${MESES_COMPLETOS[new Date().getMonth()]} ${anoAtual}`}
        icon={<BarChart3 className="w-5 h-5 text-primary" />}
        actions={
          <Button size="sm" className="gap-1" onClick={() => setNovaMetaOpen(true)}>
            <Plus className="w-3 h-3" /> Nova Meta
          </Button>
        }
      />

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

      {/* KPI Summary */}
      {hasGoals && goalProgress && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

      {/* ═══ CHARTS ═══ */}
      {hasGoals && goalProgress && (
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">GRÁFICOS DE ACOMPANHAMENTO</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart 1: Progress per goal */}
            {progressChartData.length > 0 && (
              <Card>
                <CardContent className="py-5">
                  <p className="text-xs font-semibold mb-4">Progresso das Metas</p>
                  <div style={{ height: Math.max(progressChartData.length * 50, 150) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progressChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} stroke="hsl(var(--muted-foreground))" />
                        <RechartsTooltip
                          formatter={(value: number, name: string) => [
                            typeof value === "number" ? value.toLocaleString("pt-BR") : value,
                            name === "atual" ? "Atual" : "Alvo",
                          ]}
                        />
                        <Bar dataKey="alvo" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={16} name="Alvo" />
                        <Bar dataKey="atual" radius={[0, 4, 4, 0]} barSize={16} name="Atual">
                          {progressChartData.map((entry, i) => (
                            <Cell key={i} fill={getBarColor(entry.percent)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chart 3: Scope comparison */}
            {scopeChartData.length > 0 && (
              <Card>
                <CardContent className="py-5">
                  <p className="text-xs font-semibold mb-4">Comparativo por Escopo</p>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scopeChartData} margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} unit="%" />
                        <RechartsTooltip formatter={(v: number) => [`${v}%`, "Progresso Médio"]} />
                        <Bar dataKey="media" radius={[4, 4, 0, 0]} barSize={40} name="Progresso Médio">
                          {scopeChartData.map((entry, i) => (
                            <Cell key={i} fill={getBarColor(entry.media)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chart 2: Daily evolution (full width) */}
          {evolutionChartData.length > 0 && activeGoals.length <= 5 && (
            <Card>
              <CardContent className="py-5">
                <p className="text-xs font-semibold mb-4">Evolução Diária do Mês</p>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionChartData} margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dia" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <RechartsTooltip />
                      {activeGoals.slice(0, 3).map((g, i) => {
                        const colors = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];
                        return (
                          <Area
                            key={`real_${g.id}`}
                            type="monotone"
                            dataKey={`real_${g.id}`}
                            stroke={colors[i]}
                            fill={`${colors[i].replace(")", " / 0.1)")}`}
                            strokeWidth={2}
                            name={g.title?.slice(0, 20)}
                            connectNulls={false}
                            dot={false}
                          />
                        );
                      })}
                      {activeGoals.slice(0, 3).map((g, i) => {
                        const colors = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];
                        return (
                          <Area
                            key={`ideal_${g.id}`}
                            type="monotone"
                            dataKey={`ideal_${g.id}`}
                            stroke={colors[i]}
                            fill="none"
                            strokeWidth={1}
                            strokeDasharray="5 5"
                            name={`Ideal: ${g.title?.slice(0, 15)}`}
                            dot={false}
                          />
                        );
                      })}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Linha sólida = progresso real · Linha pontilhada = ritmo ideal</p>
              </CardContent>
            </Card>
          )}
        </div>
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
            <Button size="sm" variant="outline" className="mt-4 gap-1" onClick={() => setNovaMetaOpen(true)}>
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
              onEdit={() => { /* TODO */ }}
              onArchive={() => archiveGoal.mutate(goal.id)}
            />
          ))}
        </div>
      )}

      {/* Historic */}
      {historicGoals && historicGoals.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
            <ChevronDown className="w-4 h-4" />
            Histórico de Metas ({historicGoals.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {historicGoals.map(goal => {
              const pct = goal.target_value > 0 ? Math.round(((goal.current_value || 0) / goal.target_value) * 100) : 0;
              const achieved = pct >= 100;
              return (
                <Card key={goal.id} className="opacity-70">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GoalProgressRing percent={Math.min(pct, 100)} size={36} strokeWidth={3} />
                      <div>
                        <p className="text-xs font-medium">{goal.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {goal.period_start && new Date(goal.period_start).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[9px] ${achieved ? "border-emerald-500/30 text-emerald-600" : "border-destructive/30 text-destructive"}`}>
                      {achieved ? "Batida" : `${pct}%`}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Dialog: Nova Meta */}
      <Dialog open={novaMetaOpen} onOpenChange={setNovaMetaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-base">Nova Meta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Nome da meta</Label>
              <Input value={novaMeta.title} onChange={e => setNovaMeta(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Faturar R$ 50 mil em março" className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Métrica</Label>
                <Select value={novaMeta.metric} onValueChange={v => setNovaMeta(p => ({ ...p, metric: v }))}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METRIC_OPTIONS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mês de referência</Label>
                <Select value={novaMeta.mesRef} onValueChange={v => setNovaMeta(p => ({ ...p, mesRef: v }))}>
                  <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {MESES_COMPLETOS.map((m, i) => (
                      <SelectItem key={i} value={`${anoAtual}-${String(i + 1).padStart(2, "0")}`}>{m} {anoAtual}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Valor alvo {isMonetaryMetric(novaMeta.metric) && <span className="text-muted-foreground">(R$)</span>}</Label>
                {isMonetaryMetric(novaMeta.metric) ? (
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={targetDisplay}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, "");
                      if (!raw) { setTargetDisplay(""); setNovaMeta(p => ({ ...p, target_value: 0 })); return; }
                      const num = parseInt(raw, 10);
                      setTargetDisplay(num.toLocaleString("pt-BR"));
                      setNovaMeta(p => ({ ...p, target_value: num }));
                    }}
                    placeholder="Ex: 50.000"
                    className="text-sm"
                  />
                ) : (
                  <Input
                    type="number"
                    value={novaMeta.target_value || ""}
                    onChange={e => setNovaMeta(p => ({ ...p, target_value: Number(e.target.value) }))}
                    placeholder="Ex: 20"
                    className="text-sm"
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Prioridade</Label>
                <Select value={novaMeta.priority} onValueChange={v => setNovaMeta(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Escopo</Label>
              <Select value={novaMeta.scope} onValueChange={v => setNovaMeta(p => ({ ...p, scope: v, team_id: "", assigned_to: "" }))}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Empresa (toda a organização)</SelectItem>
                  <SelectItem value="team">Equipe (time específico)</SelectItem>
                  <SelectItem value="individual">Individual (pessoa específica)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {novaMeta.scope === "team" && (
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                {teams && teams.length > 0 ? (
                  <Select value={novaMeta.team_id} onValueChange={v => setNovaMeta(p => ({ ...p, team_id: v }))}>
                    <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Selecione o time" /></SelectTrigger>
                    <SelectContent>
                      {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">Nenhum time cadastrado. Crie times em Configurações &gt; CRM.</p>
                )}
              </div>
            )}
            {novaMeta.scope === "individual" && (
              <div className="space-y-1">
                <Label className="text-xs">Responsável</Label>
                {members && members.length > 0 ? (
                  <Select value={novaMeta.assigned_to} onValueChange={v => setNovaMeta(p => ({ ...p, assigned_to: v }))}>
                    <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Selecione a pessoa" /></SelectTrigger>
                    <SelectContent>
                      {members.map(m => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.full_name} <span className="text-muted-foreground ml-1">({m.role})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">Nenhum membro encontrado na organização.</p>
                )}
              </div>
            )}
            <Button className="w-full gap-1" onClick={handleAddMeta} disabled={createGoal.isPending}>
              <Plus className="w-3 h-3" /> {createGoal.isPending ? "Criando..." : "Criar Meta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
