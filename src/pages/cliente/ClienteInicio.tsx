import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, Users, TrendingUp, Target, AlertTriangle, MessageCircle, BarChart3, ArrowUpRight, ArrowDownRight, CheckSquare, Rocket, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getClienteDashboardKpis, getChecklistItems, getClienteCampanhas } from "@/data/clienteData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

const revenueData = [
  { week: "Sem 1", receita: 8500 },
  { week: "Sem 2", receita: 12200 },
  { week: "Sem 3", receita: 9800 },
  { week: "Sem 4", receita: 16700 },
];

const kpiIcons = [DollarSign, Users, TrendingUp, Target];

const monthlyGoals = [
  { label: "Vendas", current: 34200, target: 47500, format: "currency" as const },
  { label: "Leads Qualificados", current: 89, target: 120, format: "number" as const },
  { label: "Taxa de Conversão", current: 18, target: 25, format: "percent" as const },
];

function formatGoalValue(value: number, fmt: "currency" | "number" | "percent") {
  if (fmt === "currency") return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(value);
  if (fmt === "percent") return `${value}%`;
  return value.toLocaleString("pt-BR");
}

export default function ClienteInicio() {
  const kpis = useMemo(() => getClienteDashboardKpis(), []);
  const checklist = useMemo(() => getChecklistItems(), []);
  const campanhas = useMemo(() => getClienteCampanhas().filter(c => c.status === "Ativa"), []);
  const navigate = useNavigate();

  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const hojeCapitalized = hoje.charAt(0).toUpperCase() + hoje.slice(1);

  const pendingTasks = checklist.filter(t => !t.done);
  const completedTasks = checklist.filter(t => t.done);

  // Alerts as top banner
  const alerts = [
    { label: "3 leads sem contato há +48h", color: "text-destructive" },
    { label: "Meta mensal em 72% — faltam 8 dias", color: "text-amber-500" },
    { label: "Campanha Google Ads atingiu 64% do orçamento", color: "text-blue-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Alert Banner */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-destructive/5 border border-destructive/10 overflow-x-auto">
        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
        <div className="flex items-center gap-4 text-xs">
          {alerts.map((a, i) => (
            <span key={i} className={`whitespace-nowrap ${a.color}`}>{a.label}</span>
          ))}
        </div>
      </div>

      {/* Header + Quick Actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground">Bom dia! 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{hojeCapitalized} · {pendingTasks.length} tarefas pendentes</p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: "Chat", icon: MessageCircle, path: "/cliente/chat" },
            { label: "Novo Lead", icon: Users, path: "/cliente/crm" },
            { label: "Relatórios", icon: BarChart3, path: "/cliente/relatorios" },
          ].map(a => (
            <Button key={a.label} variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate(a.path)}>
              <a.icon className="w-3.5 h-3.5" /> {a.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPIs — compact 4-col */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpiIcons[i];
          return (
            <Card key={kpi.label} className="hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground font-medium">{kpi.label}</span>
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="text-xl font-bold">{kpi.value}</div>
                {kpi.sublabel && (
                  <div className="flex items-center gap-1 mt-0.5">
                    {kpi.trend === "up" && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
                    {kpi.trend === "down" && <ArrowDownRight className="h-3 w-3 text-destructive" />}
                    <span className={`text-[10px] ${kpi.trend === "up" ? "text-emerald-500" : kpi.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                      {kpi.sublabel}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Chart + Campaigns (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          <Card>
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold">Receita Semanal</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.12)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns */}
          <Card>
            <CardHeader className="pb-2 px-5 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Campanhas Ativas</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/cliente/campanhas")}>
                  Ver todas <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-2">
              {campanhas.map(c => (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.objective} · {c.leads} leads</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">R$ {c.spent.toLocaleString()}/{c.budget.toLocaleString()}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Tasks + Goals (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tasks */}
          <Card>
            <CardHeader className="pb-2 px-5 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Tarefas do Dia</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px]">{completedTasks.length}/{checklist.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="space-y-1.5">
                {pendingTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span className="text-[13px] flex-1">{t.title}</span>
                    <Badge variant="outline" className="text-[8px]">{t.type}</Badge>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-2 text-xs h-7" onClick={() => navigate("/cliente/checklist")}>
                Ver checklist completo
              </Button>
            </CardContent>
          </Card>

          {/* Monthly Goals */}
          <Card>
            <CardHeader className="px-5 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Metas do Mês</CardTitle>
                <span className="text-[10px] text-muted-foreground capitalize">{format(new Date(), "MMMM yyyy", { locale: ptBR })}</span>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-4">
              {monthlyGoals.map((goal, i) => {
                const pct = Math.min((goal.current / goal.target) * 100, 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{goal.label}</span>
                      <span className="font-medium">{formatGoalValue(goal.current, goal.format)} / {formatGoalValue(goal.target, goal.format)}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
              <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => navigate("/cliente/plano-vendas")}>
                Ver detalhes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
