import { useMemo, useEffect, useState, useCallback } from "react";
import { format, startOfMonth, subMonths, isAfter, subHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DollarSign, Users, TrendingUp, Target, AlertTriangle,
  MessageCircle, BarChart3,
  CheckSquare,
  ArrowRight, Bot, Lightbulb,
  Wifi, Sun, Moon, CloudSun,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ProgressCtaCard } from "@/components/premium/ProgressCtaCard";
import { ClienteInicioTasks } from "./ClienteInicioTasks";
import { ClienteInicioGoals } from "./ClienteInicioGoals";
import { ClienteInicioKpis } from "./ClienteInicioKpis";
import { ClienteInicioLevelCard } from "./ClienteInicioLevelCard";
import { ClienteInicioHero } from "./ClienteInicioHero";
import { ClienteInicioAlerts } from "./ClienteInicioAlerts";
import { ClienteInicioProgress } from "./ClienteInicioProgress";
import { triggerCelebration } from "@/components/CelebrationEffect";
import { useClienteChecklist, useClienteGamification, useClienteContentMutations } from "@/hooks/useClienteContent";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { useActiveGoals } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { useWhatsAppInstance, useWhatsAppContacts } from "@/hooks/useWhatsApp";
import { useClienteAgents } from "@/hooks/useClienteAgents";
import { useDailyMessages } from "@/hooks/useDailyMessages";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useAnnouncementViews } from "@/hooks/useAnnouncementViews";
import { useClienteTasks } from "@/hooks/useClienteTasks";
import { useAuth } from "@/contexts/AuthContext";

const adminKpiConfig = [
  { label: "Receita Estimada", icon: DollarSign, gradient: "from-emerald-500/10 to-emerald-500/5", iconColor: "text-emerald-500", path: "/cliente/crm" },
  { label: "Leads do Mês", icon: Users, gradient: "from-blue-500/10 to-blue-500/5", iconColor: "text-blue-500", path: "/cliente/crm" },
  { label: "Taxa de Conversão", icon: TrendingUp, gradient: "from-purple-500/10 to-purple-500/5", iconColor: "text-purple-500", path: "/cliente/crm" },
  { label: "Meta vs Realizado", icon: Target, gradient: "from-primary/10 to-primary/5", iconColor: "text-primary", path: "/cliente/plano-vendas" },
];

const userKpiConfig = [
  { label: "Meus Leads", icon: Users, gradient: "from-blue-500/10 to-blue-500/5", iconColor: "text-blue-500", path: "/cliente/crm" },
  { label: "Minhas Conversões", icon: TrendingUp, gradient: "from-emerald-500/10 to-emerald-500/5", iconColor: "text-emerald-500", path: "/cliente/crm" },
  { label: "Meu XP", icon: Trophy, gradient: "from-purple-500/10 to-purple-500/5", iconColor: "text-purple-500", path: "/cliente/gamificacao" },
  { label: "Tarefas Pendentes", icon: CheckSquare, gradient: "from-primary/10 to-primary/5", iconColor: "text-primary", path: "/cliente/checklist" },
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

const LEVELS = [
  { name: "Novato", minXp: 0 },
  { name: "Aprendiz", minXp: 500 },
  { name: "Profissional", minXp: 1500 },
  { name: "Especialista", minXp: 3500 },
  { name: "Mestre", minXp: 7000 },
  { name: "Lenda", minXp: 12000 },
];

function getLevelInfo(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      const next = LEVELS[i + 1];
      const progressInLevel = next ? ((xp - LEVELS[i].minXp) / (next.minXp - LEVELS[i].minXp)) * 100 : 100;
      return { level: i + 1, title: LEVELS[i].name, nextTitle: next?.name, xpToNext: next ? next.minXp - xp : 0, progress: Math.min(progressInLevel, 100) };
    }
  }
  return { level: 1, title: "Novato", nextTitle: "Aprendiz", xpToNext: 500, progress: 0 };
}


function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(value);
}

export default function ClienteInicio() {
  const { isAdmin } = useRoleAccess();
  const { user } = useAuth();
  const { data: announcements } = useAnnouncements();
  const { data: announcementViews } = useAnnouncementViews();
  const { data: myTasks } = useClienteTasks({ assigned_to: user?.id });
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();
  const { data: orgData, isLoading: orgLoading } = useOrgProfile();
  const { data: gamification } = useClienteGamification();
  const { toggleChecklistItem } = useClienteContentMutations();

  useEffect(() => {
    if (!orgLoading && orgData && (orgData as unknown as { onboarding_completed?: boolean }).onboarding_completed === false) {
      navigate("/cliente/onboarding", { replace: true });
    }
  }, [orgData, orgLoading, navigate]);

  const firstName = profile?.full_name?.split(" ")[0] || "";
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

  // Gamification data
  const xp = (gamification as unknown as { xp?: number } | null)?.xp ?? 0;
  const streakDays = gamification?.streak_days ?? 0;
  const levelInfo = getLevelInfo(xp);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = monthStart;

  const thisMonthLeads = useMemo(() => allLeads.filter(l => isAfter(new Date(l.created_at), monthStart)), [allLeads, monthStart]);
  const prevMonthLeads = useMemo(() => allLeads.filter(l => {
    const d = new Date(l.created_at);
    return isAfter(d, prevMonthStart) && !isAfter(d, prevMonthEnd);
  }), [allLeads, prevMonthStart, prevMonthEnd]);

  const wonThisMonth = useMemo(() => allLeads.filter(l => l.won_at && isAfter(new Date(l.won_at), monthStart)), [allLeads, monthStart]);
  const wonPrevMonth = useMemo(() => allLeads.filter(l => l.won_at && isAfter(new Date(l.won_at), prevMonthStart) && !isAfter(new Date(l.won_at), prevMonthEnd)), [allLeads, prevMonthStart, prevMonthEnd]);

  // User-specific leads
  const myLeads = useMemo(() => allLeads.filter(l => l.assigned_to === user?.id), [allLeads, user?.id]);
  const myWonLeads = useMemo(() => myLeads.filter(l => !!l.won_at), [myLeads]);
  const myPendingTasks = (myTasks ?? []).filter(t => t.status === "pending").length;

  const revenueThisMonth = wonThisMonth.reduce((s, l) => s + (Number(l.value) || 0), 0);
  const revenuePrevMonth = wonPrevMonth.reduce((s, l) => s + (Number(l.value) || 0), 0);
  const conversionRate = thisMonthLeads.length > 0 ? (wonThisMonth.length / thisMonthLeads.length) * 100 : 0;
  const prevConversionRate = prevMonthLeads.length > 0 ? (wonPrevMonth.length / prevMonthLeads.length) * 100 : 0;

  const primaryGoal = activeGoals?.[0];
  const primaryProgress = primaryGoal && goalProgress ? goalProgress[primaryGoal.id] : null;
  const goalPercent = primaryProgress?.percent ?? 0;

  const revenueTrend = revenuePrevMonth > 0 ? ((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth * 100) : 0;
  const leadsTrend = prevMonthLeads.length > 0 ? ((thisMonthLeads.length - prevMonthLeads.length) / prevMonthLeads.length * 100) : 0;
  const convTrend = conversionRate - prevConversionRate;

  // Role-based KPI values
  const kpiConfig = isAdmin ? adminKpiConfig : userKpiConfig;
  const kpiValues = isAdmin ? [
    { value: formatCurrency(revenueThisMonth), rawValue: revenueThisMonth, sublabel: revenueTrend !== 0 ? `${revenueTrend > 0 ? "+" : ""}${revenueTrend.toFixed(0)}% vs mês anterior` : "sem dados anteriores", trend: revenueTrend > 0 ? "up" as const : revenueTrend < 0 ? "down" as const : "neutral" as const },
    { value: String(thisMonthLeads.length), rawValue: thisMonthLeads.length, sublabel: leadsTrend !== 0 ? `${leadsTrend > 0 ? "+" : ""}${leadsTrend.toFixed(0)}% vs mês anterior` : `${thisMonthLeads.length} leads no CRM`, trend: leadsTrend > 0 ? "up" as const : leadsTrend < 0 ? "down" as const : "neutral" as const },
    { value: `${conversionRate.toFixed(1)}%`, rawValue: conversionRate, sublabel: convTrend !== 0 ? `${convTrend > 0 ? "+" : ""}${convTrend.toFixed(1)}pp` : "taxa do mês", trend: convTrend > 0 ? "up" as const : convTrend < 0 ? "down" as const : "neutral" as const },
    { value: `${Math.min(goalPercent, 100).toFixed(0)}%`, rawValue: Math.min(goalPercent, 100), sublabel: primaryGoal ? `${formatCurrency(primaryProgress?.currentValue ?? 0)} / ${formatCurrency(primaryGoal.target_value)}` : "sem meta ativa", trend: goalPercent >= 70 ? "up" as const : goalPercent >= 40 ? "neutral" as const : "down" as const },
  ] : [
    { value: String(myLeads.length), rawValue: myLeads.length, sublabel: `${myLeads.filter(l => !l.won_at && !l.lost_at).length} ativos`, trend: myLeads.length > 0 ? "up" as const : "neutral" as const },
    { value: String(myWonLeads.length), rawValue: myWonLeads.length, sublabel: `${myLeads.length > 0 ? ((myWonLeads.length / myLeads.length) * 100).toFixed(0) : 0}% de conversão`, trend: myWonLeads.length > 0 ? "up" as const : "neutral" as const },
    { value: `${xp.toLocaleString()}`, rawValue: xp, sublabel: `Nível ${levelInfo.level} · ${levelInfo.title}`, trend: "up" as const },
    { value: String(myPendingTasks), rawValue: myPendingTasks, sublabel: myPendingTasks === 0 ? "Tudo em dia! ✅" : `${myPendingTasks} pendente${myPendingTasks > 1 ? "s" : ""}`, trend: myPendingTasks === 0 ? "up" as const : myPendingTasks > 5 ? "down" as const : "neutral" as const },
  ];

  // Unread announcements for inline display
  const unreadAnnouncements = useMemo(() => {
    if (!announcements || !announcementViews) return [];
    const viewedIds = new Set((announcementViews as { announcement_id: string }[]).map((v) => v.announcement_id));
    return (announcements as { id: string; priority?: string; published_at?: string }[]).filter((a) =>
      a.status === "active" && a.published_at && !viewedIds.has(a.id)
    ).slice(0, 3);
  }, [announcements, announcementViews]);

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

  const hora = now.getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const greetingEmoji = hora < 12 ? <Sun className="w-6 h-6 text-amber-400" /> : hora < 18 ? <CloudSun className="w-6 h-6 text-orange-400" /> : <Moon className="w-6 h-6 text-indigo-400" />;
  const greeting = firstName ? `${saudacao}, ${firstName}!` : `${saudacao}!`;

  const pendingTasks = checklist.filter(t => !t.is_completed);
  const completedTasks = checklist.filter(t => t.is_completed);
  const taskProgress = checklist.length > 0 ? (completedTasks.length / checklist.length) * 100 : 0;

  const dailyPhrase = dailyMessage?.message || defaultPhrases[now.getDay()];

  const goalsDisplay = useMemo(() => {
    if (!activeGoals || !goalProgress) return [];
    return activeGoals.slice(0, 3).map(g => {
      const p = goalProgress[g.id];
      return { label: g.title, current: p?.currentValue ?? 0, target: g.target_value, percent: p?.percent ?? 0, metric: g.metric || "revenue" };
    });
  }, [activeGoals, goalProgress]);

  // Daily score combining checklist + goals + CRM activity (today)
  const todayLeadsCount = useMemo(() => allLeads.filter(l => l.created_at.startsWith(today)).length, [allLeads, today]);
  const dailyScore = useMemo(() => {
    const checklistScore = taskProgress * 0.4; // 40% weight
    const goalScore = Math.min(goalPercent, 100) * 0.35; // 35% weight
    const crmScore = Math.min(todayLeadsCount * 20, 100) * 0.25; // 25% weight — 5 leads/day = 100%
    return Math.round(checklistScore + goalScore + crmScore);
  }, [taskProgress, goalPercent, todayLeadsCount]);

  const handleToggleTask = useCallback((id: string, currentState: boolean) => {
    toggleChecklistItem.mutate(
      { id, is_completed: !currentState },
      {
        onSuccess: (result) => {
          if (result?.allDone) {
            triggerCelebration();
          }
        },
      }
    );
  }, [toggleChecklistItem]);

  return (
    <div className="w-full space-y-5">

      {/* Hero Section */}
      <ClienteInicioHero
        greeting={greeting}
        greetingEmoji={greetingEmoji}
        xp={xp}
        levelInfo={levelInfo}
        streakDays={streakDays}
        dailyPhrase={dailyPhrase}
        dailyMessageAuthor={dailyMessage?.author}
        pendingTasksCount={pendingTasks.length}
        thisMonthLeadsCount={thisMonthLeads.length}
        goalPercent={goalPercent}
        now={now}
      />

      {/* Insights + Announcement alerts */}
      <ClienteInicioAlerts insights={insights} unreadAnnouncements={unreadAnnouncements} />

      {/* KPIs with animated counters */}
      <ClienteInicioKpis kpiConfig={kpiConfig} kpiValues={kpiValues} leadsLoading={leadsLoading} />

      {/* Gamified Daily Progress Bar */}
      <ClienteInicioProgress
        dailyScore={dailyScore}
        taskProgress={taskProgress}
        goalPercent={goalPercent}
        todayLeadsCount={todayLeadsCount}
      />

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
          {/* Revenue Chart — Admin only */}
          {isAdmin && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 px-5 pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Receita Semanal</CardTitle>
                  <Badge variant="secondary" className="text-[10px] rounded-full">{format(now, "MMM/yyyy", { locale: ptBR })}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {revenueData.every(d => d.receita === 0) ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <BarChart3 className="w-8 h-8 text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground mb-3">Feche vendas no CRM para visualizar receita aqui</p>
                    <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg" onClick={() => navigate("/cliente/crm")}>
                      Ir para CRM <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>
          )}

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
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
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
                    </motion.button>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Interactive Tasks */}
          <ClienteInicioTasks
            pendingTasks={pendingTasks}
            completedTasks={completedTasks}
            taskProgress={taskProgress}
            handleToggleTask={handleToggleTask}
          />

          {/* Level / Streak Card */}
          <ClienteInicioLevelCard levelInfo={levelInfo} xp={xp} streakDays={streakDays} />

          {/* Monthly Goals */}
          <ClienteInicioGoals goalsDisplay={goalsDisplay} />
        </div>
      </div>
    </div>
  );
}
