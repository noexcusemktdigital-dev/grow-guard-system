// @ts-nocheck
import { useMemo, useState, useCallback } from "react";
import { format, subHours } from "date-fns";
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
import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";

// PERF-WARN-01: recharts deferred — charts chunk loads only when revenue data exists.
const RevenueChart = lazy(() => import("./ClienteInicioRevenueChart"));
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
import { useClienteContentMutations } from "@/hooks/useClienteContent";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useInicioData } from "@/hooks/useInicioData";
import { AssessoriaTeamBanner } from "@/components/shared/AssessoriaTeamBanner";

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
  const navigate = useNavigate();
  const { toggleChecklistItem } = useClienteContentMutations();

  // Single consolidated request — replaces 13 parallel hooks.
  const { data: inicio, isLoading: inicioLoading } = useInicioData();

  const profile = inicio?.profile ?? null;
  const orgData = inicio?.org ?? null;
  const gamification = inicio?.gamification ?? null;
  const summary = inicio?.leads_summary ?? null;
  const activeGoals = inicio?.active_goals ?? [];
  const goalProgress = inicio?.goal_progress ?? {};
  const checklistItems = inicio?.checklist_today ?? [];
  const announcementsUnread = inicio?.announcements_unread ?? [];
  const dailyMessage = inicio?.daily_message ?? null;

  const firstName = profile?.full_name?.split(" ")[0] || "";
  const today = format(new Date(), "yyyy-MM-dd");
  const checklist = checklistItems;

  // Gamification data
  const xp = gamification?.xp ?? 0;
  const streakDays = gamification?.streak_days ?? 0;
  const levelInfo = getLevelInfo(xp);

  const now = new Date();

  const revenueThisMonth = summary?.revenue_this_month ?? 0;
  const revenuePrevMonth = summary?.revenue_prev_month ?? 0;
  const thisMonthCount = summary?.this_month ?? 0;
  const prevMonthCount = summary?.prev_month ?? 0;
  const wonThisMonthCount = summary?.won_this_month ?? 0;
  const wonPrevMonthCount = summary?.won_prev_month ?? 0;
  const myLeadsCount = summary?.my_count ?? 0;
  const myWonCount = summary?.my_won ?? 0;
  const myPendingTasks = inicio?.my_pending_tasks ?? 0;
  const todayLeadsCount = summary?.today_count ?? 0;

  const conversionRate = thisMonthCount > 0 ? (wonThisMonthCount / thisMonthCount) * 100 : 0;
  const prevConversionRate = prevMonthCount > 0 ? (wonPrevMonthCount / prevMonthCount) * 100 : 0;

  const primaryGoal = activeGoals[0] ?? null;
  const primaryProgressRaw = primaryGoal ? goalProgress[primaryGoal.id] : null;
  const goalPercent = primaryProgressRaw?.percent ?? 0;

  // Synthesize fields downstream cards still expect.
  const primaryProgress = useMemo(() => {
    if (!primaryGoal || !primaryProgressRaw) return null;
    const periodStart = new Date(primaryGoal.period_start);
    const periodEnd = new Date(primaryGoal.period_end);
    const totalDays = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
    const daysLeft = Math.max(0, totalDays - daysElapsed);
    const pacePerDay = daysElapsed > 0 ? primaryProgressRaw.currentValue / daysElapsed : 0;
    const requiredPacePerDay = daysLeft > 0 ? primaryProgressRaw.remaining / daysLeft : 0;
    const status = primaryProgressRaw.percent >= 100
      ? "batida"
      : pacePerDay >= requiredPacePerDay
        ? "no_ritmo"
        : "abaixo";
    return {
      ...primaryProgressRaw,
      pacePerDay,
      requiredPacePerDay,
      daysLeft,
      status,
    };
  }, [primaryGoal, primaryProgressRaw, now]);

  const revenueTrend = revenuePrevMonth > 0 ? ((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth * 100) : 0;
  const leadsTrend = prevMonthCount > 0 ? ((thisMonthCount - prevMonthCount) / prevMonthCount * 100) : 0;
  const convTrend = conversionRate - prevConversionRate;

  // Role-based KPI values
  const kpiConfig = isAdmin ? adminKpiConfig : userKpiConfig;
  const kpiValues = isAdmin ? [
    { value: formatCurrency(revenueThisMonth), rawValue: revenueThisMonth, sublabel: revenueTrend !== 0 ? `${revenueTrend > 0 ? "+" : ""}${revenueTrend.toFixed(0)}% vs mês anterior` : "sem dados anteriores", trend: revenueTrend > 0 ? "up" as const : revenueTrend < 0 ? "down" as const : "neutral" as const },
    { value: String(thisMonthCount), rawValue: thisMonthCount, sublabel: leadsTrend !== 0 ? `${leadsTrend > 0 ? "+" : ""}${leadsTrend.toFixed(0)}% vs mês anterior` : `${thisMonthCount} leads no CRM`, trend: leadsTrend > 0 ? "up" as const : leadsTrend < 0 ? "down" as const : "neutral" as const },
    { value: `${conversionRate.toFixed(1)}%`, rawValue: conversionRate, sublabel: convTrend !== 0 ? `${convTrend > 0 ? "+" : ""}${convTrend.toFixed(1)}pp` : "taxa do mês", trend: convTrend > 0 ? "up" as const : convTrend < 0 ? "down" as const : "neutral" as const },
    { value: `${Math.min(goalPercent, 100).toFixed(0)}%`, rawValue: Math.min(goalPercent, 100), sublabel: primaryGoal ? `${formatCurrency(primaryProgressRaw?.currentValue ?? 0)} / ${formatCurrency(primaryGoal.target_value)}` : "sem meta ativa", trend: goalPercent >= 70 ? "up" as const : goalPercent >= 40 ? "neutral" as const : "down" as const },
  ] : [
    { value: String(myLeadsCount), rawValue: myLeadsCount, sublabel: `${myLeadsCount - myWonCount} ativos`, trend: myLeadsCount > 0 ? "up" as const : "neutral" as const },
    { value: String(myWonCount), rawValue: myWonCount, sublabel: `${myLeadsCount > 0 ? ((myWonCount / myLeadsCount) * 100).toFixed(0) : 0}% de conversão`, trend: myWonCount > 0 ? "up" as const : "neutral" as const },
    { value: `${xp.toLocaleString()}`, rawValue: xp, sublabel: `Nível ${levelInfo.level} · ${levelInfo.title}`, trend: "up" as const },
    { value: String(myPendingTasks), rawValue: myPendingTasks, sublabel: myPendingTasks === 0 ? "Tudo em dia! ✅" : `${myPendingTasks} pendente${myPendingTasks > 1 ? "s" : ""}`, trend: myPendingTasks === 0 ? "up" as const : myPendingTasks > 5 ? "down" as const : "neutral" as const },
  ];

  const revenueData = summary?.weekly_revenue ?? [];

  const insights = useMemo(() => {
    const items: { label: string; type: "urgent" | "warning" | "info"; path: string; icon: React.ElementType }[] = [];
    const without48 = summary?.leads_without_contact_48h ?? 0;
    if (without48 > 0) {
      items.push({ label: `${without48} leads sem contato há +48h`, type: "urgent", path: "/cliente/crm", icon: AlertTriangle });
    }
    if (primaryProgress && goalPercent < 100) {
      items.push({ label: `Meta mensal em ${goalPercent.toFixed(0)}%`, type: goalPercent < 50 ? "urgent" : "warning", path: "/cliente/plano-vendas", icon: Target });
    }
    const unread = inicio?.wa_unread_conversations ?? 0;
    if (unread > 0) {
      items.push({ label: `${unread} conversas aguardando resposta`, type: "warning", path: "/cliente/chat", icon: MessageCircle });
    }
    return items;
  }, [summary, goalPercent, primaryProgress, inicio]);

  const isWAConnected = inicio?.wa_status === "connected";
  const hasAgents = (inicio?.active_agents_count ?? 0) > 0;
  const hasGoals = activeGoals.length > 0;

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
    return activeGoals.slice(0, 3).map(g => {
      const p = goalProgress[g.id];
      return { label: g.title, current: p?.currentValue ?? 0, target: g.target_value, percent: p?.percent ?? 0, metric: g.metric || "revenue" };
    });
  }, [activeGoals, goalProgress]);

  // Daily score combining checklist + goals + CRM activity (today)
  const dailyScore = useMemo(() => {
    const checklistScore = taskProgress * 0.4;
    const goalScore = Math.min(goalPercent, 100) * 0.35;
    const crmScore = Math.min(todayLeadsCount * 20, 100) * 0.25;
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
        thisMonthLeadsCount={thisMonthCount}
        goalPercent={goalPercent}
        now={now}
      />

      {/* Insights + Announcement alerts */}
      <ClienteInicioAlerts insights={insights} unreadAnnouncements={announcementsUnread} />

      {/* KPIs with animated counters */}
      <ClienteInicioKpis kpiConfig={kpiConfig} kpiValues={kpiValues} leadsLoading={inicioLoading} />

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
                  <Suspense fallback={<div className="h-48 flex items-center justify-center"><span className="text-xs text-muted-foreground">Carregando gráfico...</span></div>}>
                    <RevenueChart data={revenueData} formatCurrency={formatCurrency} />
                  </Suspense>
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
