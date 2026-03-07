import { useState } from "react";
import { Trophy, BarChart3, Target, Zap, Settings, Inbox, Plus, TrendingUp, Medal, Users, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useGoals, useRankings, useGoalMutations } from "@/hooks/useGoals";
import { useUnits } from "@/hooks/useUnits";
import { toast } from "sonner";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "metas", label: "Metas", icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "ranking", label: "Ranking", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "campanhas", label: "Campanhas", icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "config", label: "Configuração", icon: Settings, color: "text-rose-500", bg: "bg-rose-500/10" },
];

export default function MetasRanking() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: goals, isLoading: loadingGoals } = useGoals();
  const now = new Date();
  const { data: rankings, isLoading: loadingRankings } = useRankings(now.getMonth() + 1, now.getFullYear());
  const { data: units } = useUnits();
  const { createGoal } = useGoalMutations();

  const [showNewGoal, setShowNewGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: "", type: "faturamento", target_value: "", scope: "rede", unit_org_id: "", period_month: "" });

  const isLoading = loadingGoals || loadingRankings;

  const activeGoals = (goals ?? []).filter(g => g.status === "active");
  const avgProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + Math.min(100, ((g as any).current_value || 0) / g.target_value * 100), 0) / activeGoals.length)
    : 0;

  const handleCreateGoal = () => {
    if (!goalForm.title || !goalForm.target_value) return;
    createGoal.mutate(
      {
        title: goalForm.title,
        type: goalForm.type,
        target_value: Number(goalForm.target_value),
        scope: goalForm.scope,
        unit_org_id: goalForm.scope === "unidade" ? goalForm.unit_org_id : undefined,
        period_start: goalForm.period_start || undefined,
        period_end: goalForm.period_end || undefined,
        status: "active",
        metric: goalForm.type,
      },
      {
        onSuccess: () => {
          toast.success("Meta criada com sucesso");
          setShowNewGoal(false);
          setGoalForm({ title: "", type: "faturamento", target_value: "", scope: "rede", unit_org_id: "", period_start: "", period_end: "" });
        },
        onError: () => toast.error("Erro ao criar meta"),
      }
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Metas Ativas", value: activeGoals.length, icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Atingimento Médio", value: `${avgProgress}%`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Unidades no Target", value: (rankings ?? []).filter((r: any) => r.score >= 80).length, icon: Users, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Campanhas Ativas", value: (goals ?? []).filter(g => g.scope === "campaign" && g.status === "active").length, icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10" },
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

      {/* Rankings preview */}
      {(rankings ?? []).length > 0 ? (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Ranking do Mês</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(rankings ?? []).slice(0, 5).map((r: any, i: number) => {
                const unit = (units ?? []).find((u: any) => u.unit_org_id === r.unit_org_id);
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-500/20 text-amber-600" : i === 1 ? "bg-gray-300/20 text-gray-600" : i === 2 ? "bg-orange-500/20 text-orange-600" : "bg-muted text-muted-foreground"}`}>
                      {r.position || i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{unit?.name || `Unidade ${i + 1}`}</p>
                    </div>
                    <p className="text-sm font-bold">{r.score ?? 0} pts</p>
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
        <Button size="sm" className="gap-1.5" onClick={() => setShowNewGoal(true)}>
          <Plus className="w-4 h-4" /> Nova Meta
        </Button>
      </div>
      {(goals ?? []).length === 0 ? (
        <div className="text-center py-12"><Inbox className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Nenhuma meta criada ainda.</p></div>
      ) : (
        <div className="grid gap-3">
          {(goals ?? []).map((g: any) => {
            const progress = g.current_value ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : 0;
            const unit = g.unit_org_id ? (units ?? []).find((u: any) => u.unit_org_id === g.unit_org_id) : null;
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
                      </div>
                    </div>
                    <p className="text-lg font-bold">{formatBRL(g.target_value)}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  {g.period_start && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(g.period_start).toLocaleDateString("pt-BR")}
                      {g.period_end && ` — ${new Date(g.period_end).toLocaleDateString("pt-BR")}`}
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
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Ranking Mensal — {now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h3>
      {(rankings ?? []).length === 0 ? (
        <div className="text-center py-12"><Inbox className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Nenhum dado de ranking disponível.</p></div>
      ) : (
        <div className="space-y-3">
          {(rankings ?? []).map((r: any, i: number) => {
            const unit = (units ?? []).find((u: any) => u.unit_org_id === r.unit_org_id);
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
                    <p className="text-lg font-bold">{r.score ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">pontos</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderCampanhas = () => {
    const campaigns = (goals ?? []).filter(g => g.scope === "campaign");
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">Campanhas & Premiações</h3>
          <Button size="sm" className="gap-1.5" onClick={() => { setGoalForm(f => ({ ...f, scope: "campaign" })); setShowNewGoal(true); }}>
            <Plus className="w-4 h-4" /> Nova Campanha
          </Button>
        </div>
        {campaigns.length === 0 ? (
          <div className="text-center py-12"><Inbox className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Nenhuma campanha ativa.</p></div>
        ) : (
          <div className="grid gap-3">
            {campaigns.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center"><Zap className="w-5 h-5 text-purple-500" /></div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{c.title}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge>
                        <Badge variant="outline" className="text-[10px]">{formatBRL(c.target_value)}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderConfig = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Configuração de Pesos</h3>
      <Card>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">Defina os pesos das métricas para cálculo do ranking mensal.</p>
          {[
            { label: "Faturamento", placeholder: "40" },
            { label: "Leads Convertidos", placeholder: "30" },
            { label: "Contratos Fechados", placeholder: "20" },
            { label: "NPS / Satisfação", placeholder: "10" },
          ].map((metric) => (
            <div key={metric.label} className="flex items-center gap-3">
              <Label className="w-40 text-sm">{metric.label}</Label>
              <Input type="number" placeholder={metric.placeholder} className="w-24" />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          ))}
          <Button className="mt-2">Salvar Configuração</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
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

      {/* Tabs */}
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

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
      ) : (
        <>
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "metas" && renderMetas()}
          {activeTab === "ranking" && renderRanking()}
          {activeTab === "campanhas" && renderCampanhas()}
          {activeTab === "config" && renderConfig()}
        </>
      )}

      {/* New Goal Dialog */}
      <Dialog open={showNewGoal} onOpenChange={setShowNewGoal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{goalForm.scope === "campaign" ? "Nova Campanha" : "Nova Meta"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={goalForm.title} onChange={(e) => setGoalForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Faturamento Março" /></div>
            <div><Label>Tipo / Métrica</Label>
              <Select value={goalForm.type} onValueChange={(v) => setGoalForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="faturamento">Faturamento</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="contratos">Contratos</SelectItem>
                  <SelectItem value="nps">NPS</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor Alvo</Label><Input type="number" value={goalForm.target_value} onChange={(e) => setGoalForm(f => ({ ...f, target_value: e.target.value }))} placeholder="10000" /></div>
            {goalForm.scope !== "campaign" && (
              <div><Label>Escopo</Label>
                <Select value={goalForm.scope} onValueChange={(v) => setGoalForm(f => ({ ...f, scope: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rede">Toda a Rede</SelectItem>
                    <SelectItem value="unidade">Por Unidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {goalForm.scope === "unidade" && (
              <div><Label>Unidade</Label>
                <Select value={goalForm.unit_org_id} onValueChange={(v) => setGoalForm(f => ({ ...f, unit_org_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                  <SelectContent>
                    {(units ?? []).map((u: any) => <SelectItem key={u.id} value={u.unit_org_id || u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Início</Label><Input type="date" value={goalForm.period_start} onChange={(e) => setGoalForm(f => ({ ...f, period_start: e.target.value }))} /></div>
              <div><Label>Fim</Label><Input type="date" value={goalForm.period_end} onChange={(e) => setGoalForm(f => ({ ...f, period_end: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGoal(false)}>Cancelar</Button>
            <Button onClick={handleCreateGoal} disabled={createGoal.isPending || !goalForm.title || !goalForm.target_value}>
              {createGoal.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
