// @ts-nocheck
import { useState, useEffect } from "react";
import { Navigation, Sparkles, Clock, DollarSign, TrendingUp, Target, BarChart3, Users, Bot, BookOpen, Rocket, CheckCircle2, ArrowRight, Trophy, MessageCircle, Globe, Send, Image, Video, PenTool } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveStrategy, useStrategyHistory, useSaveStrategy, useApproveStrategy, useGenerateStrategy } from "@/hooks/useMarketingStrategy";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useSalesPlan, useSaveSalesPlan } from "@/hooks/useSalesPlan";

import { useClienteScriptMutations } from "@/hooks/useClienteScripts";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { useActiveGoals, useHistoricGoals, useGoalMutations } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { useCrmTeams } from "@/hooks/useCrmTeams";
import { useCrmTeam } from "@/hooks/useCrmTeam";
import { toast } from "@/hooks/use-toast";
import { playSound } from "@/lib/sounds";
import { ChatBriefing } from "@/components/cliente/ChatBriefing";
import { AdaptiveChatBriefing } from "@/components/cliente/AdaptiveChatBriefing";
import { InsufficientCreditsDialog, isInsufficientCreditsError } from "@/components/cliente/InsufficientCreditsDialog";
import { AGENTS, GPS_RAFAEL_STEPS, GPS_SOFIA_STEPS } from "@/components/cliente/briefingAgents";
import { StrategyDashboard, StrategyHistoryItem } from "./ClientePlanoMarketingStrategy";
import { ClientePlanoVendasMetaDialog, type MetaFormState } from "./ClientePlanoVendasMetaDialog";
import { MESES_COMPLETOS } from "./ClientePlanoVendasData";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { logger } from "@/lib/logger";


type Phase = "welcome" | "chat-rafael" | "transition" | "chat-sofia" | "generating" | "result";
type GeneratingStep = "marketing-core" | "marketing-growth" | "comercial";

function GPSWelcome({ onStart, hasPartialProgress, onResume, hasFullProgress, onRetryGeneration }: { onStart?: () => void; hasPartialProgress?: boolean; onResume?: () => void; hasFullProgress?: boolean; onRetryGeneration?: () => void }) {
  const { data: subscription } = useClienteSubscription();
  const isTrial = subscription?.plan === "trial" || subscription?.status === "trialing";

  const benefits = [

    { icon: Target, title: "Descubra por que você está perdendo vendas", desc: "Vamos mapear os gargalos reais do seu processo comercial e mostrar exatamente onde estão as oportunidades perdidas.", color: "text-rose-500", bg: "bg-rose-500/10" },

    { icon: TrendingUp, title: "Saiba onde investir primeiro", desc: "Com base no seu negócio, a IA define as prioridades certas — sem desperdiçar tempo ou dinheiro nas ações erradas.", color: "text-amber-500", bg: "bg-amber-500/10" },

    { icon: Users, title: "Conheça seu cliente ideal de verdade", desc: "Perfil detalhado de quem compra de você, como falar com ele e como se destacar da concorrência.", color: "text-sky-500", bg: "bg-sky-500/10" },

    { icon: Rocket, title: "Um plano de ação pronto para executar", desc: "Roadmap de 90 dias conectado às ferramentas da plataforma. Você sabe o quê, como e quando fazer.", color: "text-violet-500", bg: "bg-violet-500/10" },

  ];

  const tools = [

    { icon: Users, label: "CRM" },

    { icon: MessageCircle, label: "WhatsApp" },

    { icon: Bot, label: "Agentes IA" },

    { icon: PenTool, label: "Scripts" },

    { icon: Send, label: "Disparos" },

    { icon: Globe, label: "Tráfego Pago" },

  ];

  return (

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl mx-auto">

      {/* Hero */}

      <div className="text-center space-y-4">

        <motion.div

          initial={{ scale: 0.8, opacity: 0 }}

          animate={{ scale: 1, opacity: 1 }}

          transition={{ delay: 0.1 }}

          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20"

        >

          <Navigation className="w-10 h-10 text-white" />

        </motion.div>

        <div className="space-y-2">

          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs font-medium">Passo obrigatório</Badge>

          <h2 className="text-2xl font-bold">Antes de tudo, precisamos entender seu negócio</h2>

          <p className="text-muted-foreground text-sm max-w-xl mx-auto">

            O GPS do Negócio é o coração da plataforma. Em ~12 minutos, dois especialistas de IA vão analisar seu comercial e marketing — e personalizar todas as ferramentas para a sua realidade.

          </p>

        </div>

      </div>

      {/* Ferramentas bloqueadas */}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>

        <Card className="border-amber-500/20 bg-amber-500/5">

          <CardContent className="p-4">

            <div className="flex items-center gap-2 mb-3">

              <Trophy className="w-4 h-4 text-amber-500" />

              <p className="text-sm font-semibold">Complete o GPS e desbloqueie todas as ferramentas</p>

            </div>

            <div className="flex flex-wrap gap-2">

              {tools.map((t, i) => (

                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">

                  <t.icon className="w-3 h-3" />

                  {t.label}

                </div>

              ))}

            </div>

          </CardContent>

        </Card>

      </motion.div>

      {/* Benefícios */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {benefits.map((item, i) => (

          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>

            <Card className="h-full hover:border-amber-500/30 transition-colors">

              <CardContent className="p-5 flex gap-4">

                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>

                  <item.icon className={`w-5 h-5 ${item.color}`} />

                </div>

                <div>

                  <h3 className="font-semibold text-sm">{item.title}</h3>

                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>

                </div>

              </CardContent>

            </Card>

          </motion.div>

        ))}

      </div>

      {/* Agentes + CTA */}

      <div className="text-center space-y-4">

        <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">

          <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 flex-1 justify-center">

            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold">R</div>

            <div className="text-left">

              <p className="text-xs font-semibold">Rafael</p>

              <p className="text-[10px] text-muted-foreground">Comercial</p>

            </div>

          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />

          <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 flex-1 justify-center">

            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">S</div>

            <div className="text-left">

              <p className="text-xs font-semibold">Sofia</p>

              <p className="text-[10px] text-muted-foreground">Marketing</p>

            </div>

          </div>

        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">

          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> ~12 minutos</span>

          {isTrial ? (
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> Gratuito no seu trial</span>
          ) : (
            <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> 50 créditos</span>
          )}

        </div>

        {hasFullProgress && onRetryGeneration && (

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">

            <Card className="border-emerald-500/30 bg-emerald-500/5">

              <CardContent className="p-4 flex items-center gap-3">

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shrink-0">

                  <CheckCircle2 className="w-5 h-5" />

                </div>

                <div className="flex-1">

                  <p className="text-sm font-semibold">Todas as informações já preenchidas!</p>

                  <p className="text-xs text-muted-foreground">Gere o resultado agora sem precisar responder novamente.</p>

                </div>

                <Button size="sm" onClick={onRetryGeneration} className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white shrink-0">

                  <Rocket className="w-3.5 h-3.5" /> Gerar Resultado

                </Button>

              </CardContent>

            </Card>

          </motion.div>

        )}

        {hasPartialProgress && !hasFullProgress && onResume && (

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">

            <Card className="border-violet-500/30 bg-violet-500/5">

              <CardContent className="p-4 flex items-center gap-3">

                <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0">S</div>

                <div className="flex-1">

                  <p className="text-sm font-semibold">Etapa comercial já concluída!</p>

                  <p className="text-xs text-muted-foreground">Continue de onde parou com a Sofia (marketing).</p>

                </div>

                <Button size="sm" onClick={onResume} className="gap-1.5 bg-violet-500 hover:bg-violet-600 text-white shrink-0">

                  <ArrowRight className="w-3.5 h-3.5" /> Continuar

                </Button>

              </CardContent>

            </Card>

          </motion.div>

        )}

        {onStart ? (
          <Button size="lg" onClick={onStart} className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/20 px-8">
            <Navigation className="w-4 h-4" />
            {hasPartialProgress || hasFullProgress ? "Recomeçar do Início" : "Iniciar meu diagnóstico"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Apenas administradores podem gerar o GPS do Negócio.</p>
        )}

        <p className="text-xs text-muted-foreground">Feito uma vez. Válido para sempre. Você pode refazer quando quiser.</p>

      </div>

    </motion.div>

  );

}

function TransitionScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-6 py-20">
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
        <div className="w-16 h-16 rounded-full bg-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-violet-500/30">S</div>
      </motion.div>
      <div className="text-center">
        <p className="font-semibold text-lg">Passando para a Sofia...</p>
        <p className="text-sm text-muted-foreground mt-1">Agora vamos focar na estratégia de marketing! 🎯</p>
      </div>
    </motion.div>
  );
}

export default function ClienteGPSNegocio() {
  const { isAdmin } = useRoleAccess();
  const [phase, setPhase] = useState<Phase>("welcome");
  const [generatingStep, setGeneratingStep] = useState<GeneratingStep>("marketing-core");
  const [rafaelAnswers, setRafaelAnswers] = useState<Record<string, any>>({});
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showUnlockCelebration, setShowUnlockCelebration] = useState(false);

  const { data: activeStrategy, isLoading } = useActiveStrategy();
  const { data: history } = useStrategyHistory();
  const { data: orgId } = useUserOrgId();
  const { update: updateOrg } = useOrgProfile();
  const { data: wallet } = useClienteWallet();
  const { data: salesPlan, isLoading: isLoadingSalesPlan } = useSalesPlan();
  const saveStrategy = useSaveStrategy();
  const approveStrategy = useApproveStrategy();
  const generateStrategy = useGenerateStrategy();
  const saveSalesPlan = useSaveSalesPlan();
  const { createScript } = useClienteScriptMutations();

  // ── Metas state ──
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [novaMetaOpen, setNovaMetaOpen] = useState(false);
  const [novaMeta, setNovaMeta] = useState<MetaFormState>({ title: "", metric: "revenue", target_value: 0, scope: "company", team_id: "", assigned_to: "", priority: "media", mesRef: "" });
  const [targetDisplay, setTargetDisplay] = useState("");
  const [editingGoal, setEditingGoal] = useState<any>(null);

  const { data: activeGoals, isLoading: goalsLoading } = useActiveGoals(scopeFilter);
  const { data: historicGoals } = useHistoricGoals();
  const { data: goalProgress } = useGoalProgress(activeGoals);
  const { createGoal, updateGoal, archiveGoal } = useGoalMutations();
  const { data: teams } = useCrmTeams();
  const { data: members } = useCrmTeam();
  const isMonetaryMetric = (m: string) => ["revenue", "avg_ticket"].includes(m);

  const hasResult = !!activeStrategy?.strategy_result;
  const status = activeStrategy?.status || "pending";
  const generationCount = (history?.length ?? 0) + (activeStrategy ? 1 : 0);

  // Detect if Rafael completed but Sofia/generation hasn't — partial progress
  const salesPlanKeys = salesPlan?.answers ? Object.keys(salesPlan.answers).length : 0;
  const hasFullProgress = !!(salesPlanKeys >= 10 && !hasResult);
  const hasPartialProgress = !!(salesPlanKeys >= 3 && !hasResult);

  // Auto-detect phase on load
  useEffect(() => {
    if (isLoading || isLoadingSalesPlan) return;
    if (hasResult) {
      setPhase("result");
    }
  }, [isLoading, isLoadingSalesPlan, hasResult]);

  const handleRafaelComplete = (answers: Record<string, any>) => {
    setRafaelAnswers(answers);
    // Persist immediately so progress survives page reload
    saveSalesPlan.mutate({ answers, score: 0 });
    setPhase("transition");
    setTimeout(() => setPhase("chat-sofia"), 2500);
  };

  const handleResumeFromSofia = () => {
    if (salesPlan?.answers) {
      setRafaelAnswers(salesPlan.answers);
      setPhase("chat-sofia");
    }
  };


  // CODE-002 fix: runGeneration declared first — handleSofiaComplete and
  // handleRetryGeneration both call it, so it must not be a forward reference.
  const runGeneration = async (allAnswers: Record<string, any>) => {
    if (!orgId) return;
    setGeneratingStep("marketing-core");
    setPhase("generating");

    try {
      // 1. Sales plan already saved in handleRafaelComplete

      // 2. Generate strategy via AI — full generation (3 parallel calls no backend)

      setGeneratingStep("marketing-core");

      const gpsResult = await generateStrategy.mutateAsync({

        answers: allAnswers,

        organization_id: orgId,

      });

      const unifiedResult = (gpsResult as any).result || gpsResult || {};

      await saveStrategy.mutateAsync({
        answers: allAnswers,
        score_percentage: Math.round(Number((unifiedResult as any)?.diagnostico_gps?.score_geral || (unifiedResult as any)?.diagnostico?.score_geral || 0)),
        nivel: "gerado",
        strategy_result: unifiedResult,
        status: "pending",
      });

      // 4. Auto-generate scripts in background
      const context = {
        segment: rafaelAnswers.segmento,
        modeloNegocio: rafaelAnswers.modelo_negocio,
        produtosServicos: rafaelAnswers.produto,
        diferenciais: allAnswers.diferencial,
        dorPrincipal: rafaelAnswers.dor_principal,
        ticketMedio: rafaelAnswers.ticket_medio,
        etapasFunil: typeof rafaelAnswers.etapas_funil === "string" ? rafaelAnswers.etapas_funil.split(/→|->|,|\n/).map((s: string) => s.trim()).filter(Boolean) : [],
        tempoFechamento: rafaelAnswers.tempo_fechamento,
      };
      (async () => {
        let created = 0;
        for (const stage of ["prospeccao", "diagnostico", "fechamento"]) {
          try {
            const { data, error } = await invokeEdge("generate-script", {
              body: { stage, briefing: {}, context, organization_id: orgId, from_gps: true },
            });
            if (error || data?.error) continue;
            if (data?.content) {
              await createScript.mutateAsync({ title: data.title || `Script de ${stage}`, content: data.content, category: stage, tags: data.tags || [stage] });
              created++;
            }
          } catch (e) { logger.error(`Auto-script ${stage}:`, e); }
        }
        if (created > 0) toast({ title: `${created} scripts gerados automaticamente!` });
      })();

      toast({ title: "GPS do Negócio gerado!", description: "Revise o resultado e aprove para finalizar." });

      try {
        await updateOrg.mutateAsync({ onboarding_completed: true } as Record<string, unknown>);
      } catch (e) {
        logger.error("Erro ao marcar onboarding_completed:", e);
      }

      setPhase("result");
    } catch (err: unknown) {
      toast({ title: "Erro ao gerar estratégia", description: (err as Error).message, variant: "destructive" });
      setPhase("chat-sofia");
    }
  };

  const handleSofiaComplete = async (sofiaAnswers: Record<string, any>) => {
    if (!orgId) return;

    // Merge all answers — use salesPlan.answers as base fallback for retry scenarios
    const baseAnswers = Object.keys(rafaelAnswers).length > 0 ? rafaelAnswers : (salesPlan?.answers || {});
    const allAnswers = { ...baseAnswers, ...sofiaAnswers };

    // Persist merged answers immediately before generation
    saveSalesPlan.mutate({ answers: allAnswers, score: 0 });

    runGeneration(allAnswers);
  };

  const handleRetryGeneration = () => {
    if (!salesPlan?.answers) return;
    setRafaelAnswers(salesPlan.answers);
    runGeneration(salesPlan.answers);
  };

  const handleApprove = async () => {
    if (!activeStrategy?.id) return;
    try {
      await approveStrategy.mutateAsync(activeStrategy.id);
      playSound("success");
      setShowUnlockCelebration(true);
    } catch (err: unknown) {
      if (isInsufficientCreditsError(err)) {
        setShowCreditsDialog(true);
      } else {
        toast({ title: "Erro ao aprovar", description: (err as Error).message, variant: "destructive" });
      }
    }
  };

  // ── Metas handlers ──
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
    const periodEnd = new Date(y, m, 0, 23, 59, 59);
    const now = new Date();
    if (periodEnd < now) {
      const confirmed = window.confirm(
        `O período selecionado (${MESES_COMPLETOS[m - 1]} ${y}) já passou. A meta será enviada diretamente para o histórico. Deseja continuar?`
      );
      if (!confirmed) return;
    }
    const periodStart = new Date(y, m - 1, 1).toISOString();
    const periodEndISO = periodEnd.toISOString();
    createGoal.mutate({
      title: novaMeta.title, target_value: novaMeta.target_value, metric: novaMeta.metric,
      scope: novaMeta.scope, priority: novaMeta.priority,
      team_id: novaMeta.scope === "team" && novaMeta.team_id ? novaMeta.team_id : undefined,
      assigned_to: novaMeta.scope === "individual" && novaMeta.assigned_to ? novaMeta.assigned_to : undefined,
      period_start: periodStart, period_end: periodEndISO, status: "active",
    }, {
      onSuccess: () => {
        playSound("success");
        setNovaMeta({ title: "", metric: "revenue", target_value: 0, scope: "company", team_id: "", assigned_to: "", priority: "media", mesRef: "" });
        setTargetDisplay(""); setNovaMetaOpen(false);
        toast({ title: "Meta criada com sucesso!" });
      },
    });
  };

  const handleEditMeta = () => {
    if (!editingGoal || !novaMeta.title || novaMeta.target_value <= 0 || !novaMeta.mesRef) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" }); return;
    }
    const [y, m] = novaMeta.mesRef.split("-").map(Number);
    updateGoal.mutate({
      id: editingGoal.id, title: novaMeta.title, target_value: novaMeta.target_value,
      metric: novaMeta.metric, scope: novaMeta.scope, priority: novaMeta.priority,
      team_id: novaMeta.scope === "team" && novaMeta.team_id ? novaMeta.team_id : null,
      assigned_to: novaMeta.scope === "individual" && novaMeta.assigned_to ? novaMeta.assigned_to : null,
      period_start: new Date(y, m - 1, 1).toISOString(),
      period_end: new Date(y, m, 0, 23, 59, 59).toISOString(),
    }, {
      onSuccess: () => {
        playSound("success");
        setNovaMeta({ title: "", metric: "revenue", target_value: 0, scope: "company", team_id: "", assigned_to: "", priority: "media", mesRef: "" });
        setTargetDisplay(""); setNovaMetaOpen(false); setEditingGoal(null);
        toast({ title: "Meta atualizada com sucesso!" });
      },
    });
  };

  const openEditGoal = (goal: Record<string, unknown>) => {
    const g = goal as Record<string, unknown>;
    const mesRef = g.period_start ? (g.period_start as string).slice(0, 7) : "";
    setNovaMeta({
      title: (g.title as string) || "", metric: (g.metric as string) || "revenue",
      target_value: (g.target_value as number) || 0, scope: (g.scope as string) || "company",
      team_id: (g.team_id as string) || "", assigned_to: (g.assigned_to as string) || "",
      priority: (g.priority as string) || "media", mesRef,
    });
    setTargetDisplay(isMonetaryMetric((g.metric as string) || "revenue") ? ((g.target_value as number) || 0).toLocaleString("pt-BR") : "");
    setEditingGoal(g); setNovaMetaOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="GPS do Negócio"
        subtitle={
          phase === "result" ? "Seu diagnóstico estratégico completo" :
          phase === "generating" ? "Gerando seu diagnóstico..." :
          "Diagnóstico estratégico unificado de marketing e vendas"
        }
        icon={<Navigation className="w-5 h-5 text-amber-500" />}
      />

      <AnimatePresence mode="wait">
        {phase === "welcome" && (
          <GPSWelcome key="welcome" onStart={isAdmin ? () => setPhase("chat-rafael") : undefined} hasPartialProgress={hasPartialProgress} onResume={handleResumeFromSofia} hasFullProgress={hasFullProgress} onRetryGeneration={handleRetryGeneration} />
        )}

        {phase === "chat-rafael" && (
          <motion.div key="rafael" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdaptiveChatBriefing
              agent={AGENTS.gps_rafael}
              section="comercial"
              onComplete={handleRafaelComplete}
              onCancel={() => setPhase("welcome")}
            />
          </motion.div>
        )}

        {phase === "transition" && <TransitionScreen key="transition" />}

        {phase === "chat-sofia" && (
          <motion.div key="sofia" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdaptiveChatBriefing
              agent={AGENTS.gps_sofia}
              section="marketing"
              initialAnswers={rafaelAnswers}
              onComplete={handleSofiaComplete}
              onCancel={() => setPhase("chat-rafael")}
            />
          </motion.div>
        )}

        {phase === "generating" && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card>
              <CardContent className="p-12 flex flex-col items-center gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                  <Navigation className="w-10 h-10 text-amber-500" />
                </motion.div>
                <div className="text-center">
                  <p className="font-semibold">Gerando seu GPS do Negócio...</p>
                  <p className="text-sm text-muted-foreground">
                    {"Analisando seu negócio e gerando diagnóstico completo..."}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">Processando</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "result" && hasResult && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{generationCount} geração(ões)</Badge>
                {(history?.length ?? 0) > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Histórico ({history?.length})
                  </Button>
                )}
              </div>
            </div>

            {showHistory && history && history.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-sm font-semibold text-muted-foreground">Estratégias anteriores</p>
                {history.map((s) => <StrategyHistoryItem key={s.id} strategy={s as any} />)}
              </div>
            )}

            <StrategyDashboard
              result={activeStrategy?.strategy_result}
              onApprove={isAdmin ? handleApprove : undefined}
              onRegenerate={() => { setRafaelAnswers({}); setPhase("welcome"); }}
              isApproving={approveStrategy.isPending}
              status={status}
              createdAt={activeStrategy?.created_at ?? ""}
              metasProps={{
                activeGoals: activeGoals ?? [],
                historicGoals,
                goalProgress,
                goalsLoading,
                scopeFilter,
                setScopeFilter,
                onNewMeta: () => setNovaMetaOpen(true),
                onEditMeta: openEditGoal,
                onArchiveMeta: (id: string) => archiveGoal.mutate(id),
                isMonetaryMetric,
              }}
              metasDialog={
                <ClientePlanoVendasMetaDialog
                  open={novaMetaOpen}
                  onOpenChange={(o) => { setNovaMetaOpen(o); if (!o) setEditingGoal(null); }}
                  editingGoal={editingGoal}
                  novaMeta={novaMeta}
                  setNovaMeta={setNovaMeta}
                  targetDisplay={targetDisplay}
                  setTargetDisplay={setTargetDisplay}
                  onAdd={handleAddMeta}
                  onEdit={handleEditMeta}
                  isCreating={createGoal.isPending}
                  isUpdating={updateGoal.isPending}
                  isMonetaryMetric={isMonetaryMetric}
                  teams={teams as any}
                  members={members as any}
                />
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      <InsufficientCreditsDialog
        open={showCreditsDialog}
        onOpenChange={setShowCreditsDialog}
        actionLabel="este diagnóstico"
        creditCost={50}
      />

      {/* Unlock Celebration Dialog */}
      <AnimatePresence>
        {showUnlockCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUnlockCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-card border border-border rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl text-center space-y-6"
            >
              {/* Confetti dots */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: [0, (Math.random() - 0.5) * 200],
                    y: [0, (Math.random() - 0.5) * 200],
                  }}
                  transition={{ duration: 1.5, delay: 0.2 + i * 0.08 }}
                  className={`absolute top-1/3 left-1/2 w-2 h-2 rounded-full ${
                    ["bg-amber-400", "bg-emerald-400", "bg-sky-400", "bg-violet-400", "bg-rose-400", "bg-primary"][i % 6]
                  }`}
                />
              ))}

              {/* Trophy */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>

              <div className="space-y-2">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold"
                >
                  GPS Aprovado! 🎯
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-muted-foreground"
                >
                  Todas as ferramentas da plataforma foram desbloqueadas!
                </motion.p>
              </div>

              {/* Unlocked tools grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-3 sm:grid-cols-4 gap-3"
              >
                {[
                  { icon: Users, label: "CRM", color: "text-sky-500" },
                  { icon: MessageCircle, label: "Conversas", color: "text-emerald-500" },
                  { icon: Bot, label: "Agentes IA", color: "text-violet-500" },
                  { icon: BookOpen, label: "Scripts", color: "text-amber-500" },
                  { icon: Video, label: "Roteiros", color: "text-rose-500" },
                  { icon: Image, label: "Postagem", color: "text-pink-500" },
                  { icon: Globe, label: "Sites", color: "text-cyan-500" },
                  { icon: DollarSign, label: "Tráfego", color: "text-orange-500" },
                ].map((tool, i) => (
                  <motion.div
                    key={tool.label}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.08, type: "spring", damping: 15 }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 border border-border/50"
                  >
                    <tool.icon className={`w-5 h-5 ${tool.color}`} />
                    <span className="text-[10px] font-medium text-muted-foreground">{tool.label}</span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <Button
                  size="lg"
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                  onClick={() => setShowUnlockCelebration(false)}
                >
                  <Rocket className="w-4 h-4" /> Explorar ferramentas
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
