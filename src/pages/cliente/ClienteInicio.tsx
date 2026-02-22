import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DollarSign, Users, TrendingUp, Target, AlertTriangle,
  MessageCircle, BarChart3, ArrowUpRight, ArrowDownRight,
  CheckSquare, Rocket, ChevronRight, Sparkles, Clock,
  Zap, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { TaskListCard } from "@/components/premium/TaskListCard";
import { ProgressCtaCard } from "@/components/premium/ProgressCtaCard";
import { useClienteChecklist } from "@/hooks/useClienteContent";
import { useClienteCampaigns } from "@/hooks/useClienteContent";
import { useCrmLeads } from "@/hooks/useCrmLeads";

const revenueData = [
  { week: "Sem 1", receita: 8500 },
  { week: "Sem 2", receita: 12200 },
  { week: "Sem 3", receita: 9800 },
  { week: "Sem 4", receita: 16700 },
];

const kpiConfig = [
  { label: "Receita Estimada", icon: DollarSign, gradient: "from-emerald-500/10 to-emerald-500/5", iconColor: "text-emerald-500" },
  { label: "Leads do Mês", icon: Users, gradient: "from-blue-500/10 to-blue-500/5", iconColor: "text-blue-500" },
  { label: "Taxa de Conversão", icon: TrendingUp, gradient: "from-purple-500/10 to-purple-500/5", iconColor: "text-purple-500" },
  { label: "Meta vs Realizado", icon: Target, gradient: "from-primary/10 to-primary/5", iconColor: "text-primary" },
];

const quickActions = [
  { label: "Novo Lead", icon: Users, path: "/cliente/crm", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20" },
  { label: "Abrir Chat", icon: MessageCircle, path: "/cliente/chat", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20" },
  { label: "Gerar com IA", icon: Sparkles, path: "/cliente/conteudos", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20" },
  { label: "Relatórios", icon: BarChart3, path: "/cliente/relatorios", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20" },
];

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
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: checklistItems } = useClienteChecklist(today);
  const { data: campaigns } = useClienteCampaigns();
  const { data: leads } = useCrmLeads();

  const checklist = checklistItems ?? [];
  const activeCampaigns = (campaigns ?? []).filter(c => c.status === "active").slice(0, 3);
  const leadsCount = leads?.length ?? 0;

  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const hojeCapitalized = hoje.charAt(0).toUpperCase() + hoje.slice(1);
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  const pendingTasks = checklist.filter(t => !t.is_completed);
  const completedTasks = checklist.filter(t => t.is_completed);
  const taskProgress = checklist.length > 0 ? (completedTasks.length / checklist.length) * 100 : 0;

  // KPI values (mix of real data + placeholders)
  const kpiValues = [
    { value: "R$ 47.500", sublabel: "+12% vs mês anterior", trend: "up" },
    { value: String(leadsCount), sublabel: "leads no CRM", trend: "up" },
    { value: "18,5%", sublabel: "+2.3pp", trend: "up" },
    { value: "72%", sublabel: "R$ 34.200 / R$ 47.500", trend: "neutral" },
  ] as const;

  const alerts = [
    { label: "3 leads sem contato há +48h", type: "urgent" as const },
    { label: "Meta mensal em 72%", type: "warning" as const },
    { label: "Campanha atingiu 64% do orçamento", type: "info" as const },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Alert Strip */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-destructive/[0.04] border border-destructive/10">
        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
        <div className="flex items-center gap-4 text-[12px] overflow-x-auto">
          {alerts.map((a, i) => (
            <span key={i} className={`whitespace-nowrap font-medium ${a.type === "urgent" ? "text-destructive" : a.type === "warning" ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"}`}>
              {a.label}
            </span>
          ))}
        </div>
      </div>

      {/* Welcome + Quick Actions */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {saudacao}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            {hojeCapitalized} · <span className="font-medium text-foreground">{pendingTasks.length} tarefas pendentes</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {quickActions.map(a => (
            <button key={a.label} onClick={() => navigate(a.path)} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${a.color}`}>
              <a.icon className="w-3.5 h-3.5" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
        {kpiConfig.map((cfg, i) => {
          const kpi = kpiValues[i];
          const Icon = cfg.icon;
          return (
            <Card key={cfg.label} className={`hover-lift card-shine bg-gradient-to-br ${cfg.gradient} border-0 shadow-sm`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{cfg.label}</span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.iconColor} bg-white/60 dark:bg-white/10`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">{kpi.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.trend === "up" && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
                  {kpi.trend === "down" && <ArrowDownRight className="h-3 w-3 text-destructive" />}
                  <span className={`text-[11px] font-medium ${kpi.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : kpi.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                    {kpi.sublabel}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ProgressCtaCard
        title="MEU PROGRESSO DE VENDAS"
        level="NÍVEL PRO"
        metaLabel="META MENSAL"
        metaDescription="Faltam R$ 12.000 para o bônus de performance."
        percent={82}
        ctaTitle="AÇÃO NECESSÁRIA"
        ctaSubtitle="PRÓXIMA BLITZ DE CONTEÚDO"
        ctaDescription="Prepare 3 stories com o novo roteiro No Excuse até as 14h de amanhã."
        ctaButtonLabel="VER ROTEIRO"
        onCtaClick={() => navigate("/cliente/conteudos")}
      />

      <TaskListCard
        title="TAREFAS OPERACIONAIS"
        tasks={pendingTasks.slice(0, 4).map((t, i) => ({
          id: t.id,
          title: t.title,
          description: "",
          time: format(new Date(t.created_at), "HH:mm"),
          done: !!t.is_completed,
        }))}
        onTaskClick={() => navigate("/cliente/checklist")}
      />

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Receita Semanal</CardTitle>
                <Badge variant="secondary" className="text-[10px] rounded-full">Fev/2026</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="url(#revenueGrad)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--card))" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns */}
          <Card>
            <CardHeader className="pb-3 px-5 pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Rocket className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Campanhas Ativas</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-2">
              {activeCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma campanha ativa</p>
              ) : activeCampaigns.map(c => (
                <div key={c.id} className="group flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <span className="text-[11px] text-muted-foreground">{c.type}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Tasks + Goals */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-3 px-5 pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CheckSquare className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Tarefas do Dia</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground">{Math.round(taskProgress)}%</span>
                  <div className="w-8 h-8 relative">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${taskProgress * 0.942} 100`} strokeLinecap="round" className="transition-all duration-700" />
                    </svg>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-1">
                {pendingTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-all duration-200 cursor-pointer">
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary transition-colors flex-shrink-0" />
                    <span className="text-[13px] flex-1 text-foreground/80 group-hover:text-foreground transition-colors">{t.title}</span>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-xs h-8 text-muted-foreground hover:text-foreground" onClick={() => navigate("/cliente/checklist")}>
                Ver checklist completo <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Monthly Goals */}
          <Card>
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Metas do Mês</CardTitle>
                </div>
                <span className="text-[10px] text-muted-foreground capitalize font-medium">{format(new Date(), "MMMM yyyy", { locale: ptBR })}</span>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {monthlyGoals.map((goal, i) => {
                const pct = Math.min((goal.current / goal.target) * 100, 100);
                const isOnTrack = pct >= 70;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-medium">{goal.label}</span>
                      <span className="font-semibold tabular-nums">{formatGoalValue(goal.current, goal.format)} <span className="text-muted-foreground font-normal">/ {formatGoalValue(goal.target, goal.format)}</span></span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${isOnTrack ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <Button variant="outline" size="sm" className="w-full text-xs h-9 mt-2 rounded-lg" onClick={() => navigate("/cliente/plano-vendas")}>
                Ver detalhes <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
