import { useMemo } from "react";
import { format, startOfMonth, subMonths, isAfter, subHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DollarSign, Users, TrendingUp, Target, AlertTriangle,
  MessageCircle, BarChart3, ArrowUpRight, ArrowDownRight,
  CheckSquare, ChevronRight, Sparkles, Clock,
  Zap, ArrowRight, Bot, Link, FileText, Lightbulb,
  Wifi, WifiOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { TaskListCard } from "@/components/premium/TaskListCard";
import { ProgressCtaCard } from "@/components/premium/ProgressCtaCard";
import { useClienteChecklist } from "@/hooks/useClienteContent";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { useActiveGoals } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { useWhatsAppInstance, useWhatsAppContacts } from "@/hooks/useWhatsApp";
import { useClienteAgents } from "@/hooks/useClienteAgents";
import { useDailyMessages } from "@/hooks/useDailyMessages";

const kpiConfig = [
  { label: "Receita Estimada", icon: DollarSign, gradient: "from-emerald-500/10 to-emerald-500/5", iconColor: "text-emerald-500" },
  { label: "Leads do Mês", icon: Users, gradient: "from-blue-500/10 to-blue-500/5", iconColor: "text-blue-500" },
  { label: "Taxa de Conversão", icon: TrendingUp, gradient: "from-purple-500/10 to-purple-500/5", iconColor: "text-purple-500" },
  { label: "Meta vs Realizado", icon: Target, gradient: "from-primary/10 to-primary/5", iconColor: "text-primary" },
];

const defaultPhrases = [
  "Cada lead é uma oportunidade disfarçada. Não deixe nenhuma escapar.",
  "Consistência supera talento. Continue executando.",
  "O follow-up de hoje é a venda de amanhã.",
  "Foco nas ações que geram resultado.",
  "Seu próximo grande cliente pode estar a uma mensagem de distância.",
  "Disciplina comercial constrói resultados previsíveis.",
  "Quem acompanha métricas, controla resultados.",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(value);
}

export default function ClienteInicio() {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: checklistItems } = useClienteChecklist(today);
  const { data: leads, isLoading: leadsLoading } = useCrmLeads();
  const { data: activeGoals } = useActiveGoals();
  const { data: goalProgress } = useGoalProgress(activeGoals);
  const { data: waInstance } = useWhatsAppInstance();
  const { data: waContacts = [] } = useWhatsAppContacts();
  const { data: agentsData } = useClienteAgents();
  const { data: dailyMessage } = useDailyMessages();

  const checklist = checklistItems ?? [];
  const allLeads = leads ?? [];

  // Date calculations
  const now = new Date();
  const monthStart = startOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = subMonths(monthStart, 0); // = monthStart

  // Current month leads
  const thisMonthLeads = useMemo(() => allLeads.filter(l => isAfter(new Date(l.created_at), monthStart)), [allLeads, monthStart]);
  const prevMonthLeads = useMemo(() => allLeads.filter(l => {
    const d = new Date(l.created_at);
    return isAfter(d, prevMonthStart) && !isAfter(d, prevMonthEnd);
  }), [allLeads, prevMonthStart, prevMonthEnd]);

  const wonThisMonth = useMemo(() => allLeads.filter(l => l.won_at && isAfter(new Date(l.won_at), monthStart)), [allLeads, monthStart]);
  const wonPrevMonth = useMemo(() => allLeads.filter(l => l.won_at && isAfter(new Date(l.won_at), prevMonthStart) && !isAfter(new Date(l.won_at), prevMonthEnd)), [allLeads, prevMonthStart, prevMonthEnd]);

  const revenueThisMonth = wonThisMonth.reduce((s, l) => s + (Number(l.value) || 0), 0);
  const revenuePrevMonth = wonPrevMonth.reduce((s, l) => s + (Number(l.value) || 0), 0);
  const conversionRate = thisMonthLeads.length > 0 ? (wonThisMonth.length / thisMonthLeads.length) * 100 : 0;
  const prevConversionRate = prevMonthLeads.length > 0 ? (wonPrevMonth.length / prevMonthLeads.length) * 100 : 0;

  // Primary goal progress
  const primaryGoal = activeGoals?.[0];
  const primaryProgress = primaryGoal && goalProgress ? goalProgress[primaryGoal.id] : null;
  const goalPercent = primaryProgress?.percent ?? 0;

  // Revenue trend
  const revenueTrend = revenuePrevMonth > 0 ? ((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth * 100) : 0;
  const leadsTrend = prevMonthLeads.length > 0 ? ((thisMonthLeads.length - prevMonthLeads.length) / prevMonthLeads.length * 100) : 0;
  const convTrend = conversionRate - prevConversionRate;

  const kpiValues = [
    { value: formatCurrency(revenueThisMonth), sublabel: revenueTrend !== 0 ? `${revenueTrend > 0 ? "+" : ""}${revenueTrend.toFixed(0)}% vs mês anterior` : "sem dados anteriores", trend: revenueTrend > 0 ? "up" as const : revenueTrend < 0 ? "down" as const : "neutral" as const },
    { value: String(thisMonthLeads.length), sublabel: leadsTrend !== 0 ? `${leadsTrend > 0 ? "+" : ""}${leadsTrend.toFixed(0)}% vs mês anterior` : `${thisMonthLeads.length} leads no CRM`, trend: leadsTrend > 0 ? "up" as const : leadsTrend < 0 ? "down" as const : "neutral" as const },
    { value: `${conversionRate.toFixed(1)}%`, sublabel: convTrend !== 0 ? `${convTrend > 0 ? "+" : ""}${convTrend.toFixed(1)}pp` : "taxa do mês", trend: convTrend > 0 ? "up" as const : convTrend < 0 ? "down" as const : "neutral" as const },
    { value: `${Math.min(goalPercent, 100).toFixed(0)}%`, sublabel: primaryGoal ? `${formatCurrency(primaryProgress?.currentValue ?? 0)} / ${formatCurrency(primaryGoal.target_value)}` : "sem meta ativa", trend: goalPercent >= 70 ? "up" as const : goalPercent >= 40 ? "neutral" as const : "down" as const },
  ];

  // Weekly revenue chart from real data
  const revenueData = useMemo(() => {
    const weeks = [
      { label: "Sem 1", start: 1, end: 7 },
      { label: "Sem 2", start: 8, end: 14 },
      { label: "Sem 3", start: 15, end: 21 },
      { label: "Sem 4", start: 22, end: 31 },
    ];
    return weeks.map(w => {
      const total = wonThisMonth.filter(l => {
        const day = new Date(l.won_at!).getDate();
        return day >= w.start && day <= w.end;
      }).reduce((s, l) => s + (Number(l.value) || 0), 0);
      return { week: w.label, receita: total };
    });
  }, [wonThisMonth]);

  // Insights
  const leadsWithoutContact48h = useMemo(() => {
    const threshold = subHours(now, 48);
    return allLeads.filter(l => !l.won_at && !l.lost_at && isAfter(threshold, new Date(l.updated_at)));
  }, [allLeads]);

  const unreadConversations = waContacts.filter(c => c.unread_count > 0).length;

  const insights = useMemo(() => {
    const items: { label: string; type: "urgent" | "warning" | "info"; path: string; icon: React.ElementType }[] = [];
    if (leadsWithoutContact48h.length > 0) {
      items.push({ label: `${leadsWithoutContact48h.length} leads sem contato há +48h`, type: "urgent", path: "/cliente/crm", icon: AlertTriangle });
    }
    if (primaryProgress && goalPercent < 100) {
      items.push({ label: `Meta mensal em ${goalPercent.toFixed(0)}%`, type: goalPercent < 50 ? "urgent" : "warning", path: "/cliente/plano-vendas", icon: Target });
    }
    if (unreadConversations > 0) {
      items.push({ label: `${unreadConversations} conversas aguardando resposta`, type: "warning", path: "/cliente/chat", icon: MessageCircle });
    }
    return items;
  }, [leadsWithoutContact48h, goalPercent, unreadConversations]);

  // Next steps
  const isWAConnected = waInstance?.status === "connected";
  const hasAgents = (agentsData || []).filter(a => a.status === "active").length > 0;
  const hasGoals = (activeGoals ?? []).length > 0;

  const nextSteps = useMemo(() => {
    const steps: { title: string; description: string; icon: React.ElementType; path: string; done: boolean }[] = [];
    steps.push({ title: "Conecte seu WhatsApp", description: "Atenda leads automaticamente via WhatsApp", icon: Wifi, path: "/cliente/integracoes", done: isWAConnected });
    steps.push({ title: "Crie um Agente IA", description: "Automatize atendimento e qualificação", icon: Bot, path: "/cliente/agentes-ia", done: hasAgents });
    steps.push({ title: "Configure suas metas", description: "Acompanhe resultados do mês", icon: Target, path: "/cliente/plano-vendas", done: hasGoals });
    return steps.filter(s => !s.done);
  }, [isWAConnected, hasAgents, hasGoals]);

  // Greeting
  const hora = now.getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  const pendingTasks = checklist.filter(t => !t.is_completed);
  const completedTasks = checklist.filter(t => t.is_completed);
  const taskProgress = checklist.length > 0 ? (completedTasks.length / checklist.length) * 100 : 0;

  // Daily phrase
  const dailyPhrase = dailyMessage?.message || defaultPhrases[now.getDay()];

  // Goals for sidebar
  const goalsDisplay = useMemo(() => {
    if (!activeGoals || !goalProgress) return [];
    return activeGoals.slice(0, 3).map(g => {
      const p = goalProgress[g.id];
      return {
        label: g.title,
        current: p?.currentValue ?? 0,
        target: g.target_value,
        percent: p?.percent ?? 0,
        metric: g.metric || "revenue",
      };
    });
  }, [activeGoals, goalProgress]);

  return (
    <div className="w-full space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {saudacao}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR }).replace(/^./, c => c.toUpperCase())} · <span className="font-medium text-foreground">{pendingTasks.length} tarefas pendentes</span>
        </p>
      </div>

      {/* Daily Phrase */}
      <Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Frase do Dia</p>
            <p className="text-sm font-medium text-foreground/90 italic leading-relaxed">"{dailyPhrase}"</p>
            {dailyMessage?.author && (
              <p className="text-[10px] text-muted-foreground mt-1">— {dailyMessage.author}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights alerts */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <button
                key={i}
                onClick={() => navigate(insight.path)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:scale-[1.01] ${
                  insight.type === "urgent"
                    ? "bg-destructive/5 border-destructive/15 hover:bg-destructive/10"
                    : insight.type === "warning"
                    ? "bg-amber-500/5 border-amber-500/15 hover:bg-amber-500/10"
                    : "bg-blue-500/5 border-blue-500/15 hover:bg-blue-500/10"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${
                  insight.type === "urgent" ? "text-destructive" : insight.type === "warning" ? "text-amber-500" : "text-blue-500"
                }`} />
                <span className={`text-xs font-medium ${
                  insight.type === "urgent" ? "text-destructive" : insight.type === "warning" ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                }`}>{insight.label}</span>
                <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground" />
              </button>
            );
          })}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiConfig.map((cfg, i) => {
          const kpi = kpiValues[i];
          const Icon = cfg.icon;
          return (
            <Card key={cfg.label} className={`hover-lift card-shine bg-gradient-to-br ${cfg.gradient} border-0 shadow-sm`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{cfg.label}</span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.iconColor} bg-background/60`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">{leadsLoading ? <Skeleton className="h-7 w-24" /> : kpi.value}</div>
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

      {/* Progress CTA */}
      {primaryGoal && primaryProgress && (
        <ProgressCtaCard
          title="MEU PROGRESSO DE VENDAS"
          level={primaryProgress.status === "batida" ? "META BATIDA" : primaryProgress.status === "no_ritmo" ? "NO RITMO" : "AÇÃO NECESSÁRIA"}
          metaLabel="META MENSAL"
          metaDescription={primaryProgress.remaining > 0 ? `Faltam ${formatCurrency(primaryProgress.remaining)} para bater a meta.` : "Meta atingida!"}
          percent={Math.min(goalPercent, 100)}
          ctaTitle="RITMO DIÁRIO"
          ctaSubtitle={`${formatCurrency(primaryProgress.pacePerDay)}/dia`}
          ctaDescription={primaryProgress.daysLeft > 0 ? `Necessário: ${formatCurrency(primaryProgress.requiredPacePerDay)}/dia nos próximos ${primaryProgress.daysLeft} dias` : "Último dia do período"}
          ctaButtonLabel="VER METAS"
          onCtaClick={() => navigate("/cliente/plano-vendas")}
        />
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-5">
          {/* Revenue Chart */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Receita Semanal</CardTitle>
                <Badge variant="secondary" className="text-[10px] rounded-full">{format(now, "MMM/yyyy", { locale: ptBR })}</Badge>
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
                      formatter={(v: number) => [formatCurrency(v), "Receita"]}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="url(#revenueGrad)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--card))" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          {nextSteps.length > 0 && (
            <Card>
              <CardHeader className="pb-3 px-5 pt-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Próximos Passos</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-2">
                {nextSteps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => navigate(step.path)}
                      className="w-full group flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-[11px] text-muted-foreground">{step.description}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tasks */}
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
                {pendingTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhuma tarefa pendente</p>
                )}
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
                <span className="text-[10px] text-muted-foreground capitalize font-medium">{format(now, "MMMM yyyy", { locale: ptBR })}</span>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {goalsDisplay.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground mb-2">Nenhuma meta configurada</p>
                  <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg" onClick={() => navigate("/cliente/plano-vendas")}>
                    Criar meta <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              ) : goalsDisplay.map((goal, i) => {
                const pct = Math.min(goal.percent, 100);
                const isOnTrack = pct >= 70;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-medium">{goal.label}</span>
                      <span className="font-semibold tabular-nums">
                        {goal.metric === "revenue" ? formatCurrency(goal.current) : goal.current.toLocaleString("pt-BR")}
                        <span className="text-muted-foreground font-normal"> / {goal.metric === "revenue" ? formatCurrency(goal.target) : goal.target.toLocaleString("pt-BR")}</span>
                      </span>
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
