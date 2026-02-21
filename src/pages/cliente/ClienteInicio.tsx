import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, Users, TrendingUp, Target, AlertTriangle, Rocket, CheckSquare, Calendar } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getClienteDashboardKpis, getChecklistItems, getClienteCampanhas } from "@/data/clienteData";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

export default function ClienteInicio() {
  const kpis = useMemo(() => getClienteDashboardKpis(), []);
  const checklist = useMemo(() => getChecklistItems(), []);
  const campanhas = useMemo(() => getClienteCampanhas().filter(c => c.status === "Ativa"), []);

  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const hojeCapitalized = hoje.charAt(0).toUpperCase() + hoje.slice(1);

  const pendingTasks = checklist.filter(t => !t.done);
  const completedTasks = checklist.filter(t => t.done);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Bom dia, Empresa Demo" subtitle={`SaaS NoExcuse · ${hojeCapitalized}`} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} sublabel={kpi.sublabel} trend={kpi.trend} icon={kpiIcons[i]} delay={i} variant={i === 0 ? "accent" : "default"} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Leads por Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
