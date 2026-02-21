import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, Users, TrendingUp, Target, AlertTriangle, Rocket, CheckSquare, MessageCircle, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getClienteDashboardKpis, getChecklistItems, getClienteCampanhas } from "@/data/clienteData";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

const revenueData = [
  { week: "Sem 1", receita: 8500 },
  { week: "Sem 2", receita: 12200 },
  { week: "Sem 3", receita: 9800 },
  { week: "Sem 4", receita: 16700 },
];

const leadsData = [
  { week: "Sem 1", leads: 32 },
  { week: "Sem 2", leads: 38 },
  { week: "Sem 3", leads: 29 },
  { week: "Sem 4", leads: 35 },
];

const kpiIcons = [DollarSign, Users, TrendingUp, Target];

const monthlyGoals = [
  { label: "Vendas", current: 34200, target: 47500, format: "currency" as const },
  { label: "Leads Qualificados", current: 89, target: 120, format: "number" as const },
  { label: "Taxa de Conversão", current: 18, target: 25, format: "percent" as const },
];

function formatGoalValue(value: number, format: "currency" | "number" | "percent") {
  if (format === "currency") return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(value);
  if (format === "percent") return `${value}%`;
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Bom dia! 👋"
        subtitle={`NOEXCUSE Gestão Comercial · ${hojeCapitalized} · ${pendingTasks.length} tarefas pendentes`}
      />

      {/* KPIs - Kivo-style StatsCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpiIcons[i];
          return (
            <Card key={kpi.label} className="relative overflow-hidden hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                {kpi.sublabel && (
                  <div className="flex items-center gap-1 mt-1">
                    {kpi.trend === "up" && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />}
                    {kpi.trend === "down" && <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />}
                    <span className={`text-xs ${kpi.trend === "up" ? "text-emerald-500" : kpi.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                      {kpi.sublabel}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts + Monthly Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Receita Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Goals - Kivo-inspired */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Metas do Mês</CardTitle>
            <CardDescription className="capitalize text-xs">
              {format(new Date(), "MMMM yyyy", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {monthlyGoals.map((goal, i) => {
              const pct = Math.min((goal.current / goal.target) * 100, 100);
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{goal.label}</span>
                    <span className="font-medium">{formatGoalValue(goal.current, goal.format)} / {formatGoalValue(goal.target, goal.format)}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-[10px] text-muted-foreground">{pct.toFixed(0)}% da meta</p>
                </div>
              );
            })}
            <Button className="w-full" size="sm" variant="outline" onClick={() => navigate("/cliente/plano-vendas")}>
              Ver detalhes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Campanhas ativas + Tarefas pendentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Campanhas Ativas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {campanhas.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.objective} · {c.leads} leads</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">R$ {c.spent.toLocaleString()}/{c.budget.toLocaleString()}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Tarefas do Dia</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">{completedTasks.length}/{checklist.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingTasks.slice(0, 4).map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary/60" />
                <span className="text-sm">{t.title}</span>
                <Badge variant="outline" className="text-[9px] ml-auto">{t.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Kivo-inspired */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Abrir Chat", icon: MessageCircle, path: "/cliente/chat" },
          { label: "Novo Lead", icon: Users, path: "/cliente/crm" },
          { label: "Ver Relatórios", icon: BarChart3, path: "/cliente/relatorios" },
          { label: "Plano de Vendas", icon: Target, path: "/cliente/plano-vendas" },
        ].map(action => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              className="h-16 flex flex-col items-center gap-1.5 hover:bg-primary/5 hover:border-primary/30 transition-all"
              onClick={() => navigate(action.path)}
            >
              <Icon className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Alertas */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Alertas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: "3 leads sem contato há +48h", color: "text-destructive" },
              { label: "Meta mensal em 72% — faltam 8 dias", color: "text-yellow-500" },
              { label: "Campanha Google Ads atingiu 64% do orçamento", color: "text-blue-500" },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                <AlertTriangle className={`w-4 h-4 ${a.color} flex-shrink-0`} />
                <span className="text-xs">{a.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
