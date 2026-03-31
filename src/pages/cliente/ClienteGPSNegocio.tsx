// @ts-nocheck
import { useState, useEffect } from "react";
import { Navigation, Sparkles, Clock, DollarSign, TrendingUp, Target, BarChart3, Users, Bot, BookOpen, Rocket, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActiveStrategy, useStrategyHistory, useSaveStrategy, useApproveStrategy, useGenerateStrategy } from "@/hooks/useMarketingStrategy";
import { useSalesPlan, useSaveSalesPlan } from "@/hooks/useSalesPlan";

import { useCrmFunnels, useCrmFunnelMutations } from "@/hooks/useCrmFunnels";
import { useClienteScriptMutations } from "@/hooks/useClienteScripts";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { toast } from "@/hooks/use-toast";
import { ChatBriefing } from "@/components/cliente/ChatBriefing";
import { InsufficientCreditsDialog, isInsufficientCreditsError } from "@/components/cliente/InsufficientCreditsDialog";
import { AGENTS, GPS_RAFAEL_STEPS, GPS_SOFIA_STEPS } from "@/components/cliente/briefingAgents";
import { StrategyDashboard, StrategyHistoryItem } from "./ClientePlanoMarketingStrategy";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

const STAGE_COLORS = ["#8b5cf6", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#f97316", "#6366f1", "#14b8a6"];

type Phase = "welcome" | "chat-rafael" | "transition" | "chat-sofia" | "generating" | "result";
type GeneratingStep = "marketing-core" | "marketing-growth" | "comercial";

function GPSWelcome({ onStart, hasPartialProgress, onResume }: { onStart: () => void; hasPartialProgress?: boolean; onResume?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
          <Navigation className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold">GPS do Negócio</h2>
        <p className="text-muted-foreground">
          O diagnóstico estratégico mais completo para o seu negócio. Dois especialistas vão analisar seu comercial e marketing para criar um plano de ação personalizado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {[
          { icon: Target, title: "Diagnóstico Comercial", desc: "Análise do seu processo de vendas, equipe, funil e metas com score de maturidade" },
          { icon: TrendingUp, title: "Projeções de Receita", desc: "Projeções de leads e faturamento para os próximos 6 meses com estratégias recomendadas" },
          { icon: Users, title: "ICP & Posicionamento", desc: "Cliente ideal detalhado, proposta de valor, tom de voz e análise de concorrência" },
          { icon: BarChart3, title: "Plano de Execução", desc: "Roadmap de 3 meses com ações vinculadas às ferramentas da plataforma" },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}>
            <Card className="h-full hover:border-amber-500/30 transition-colors">
              <CardContent className="p-5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-amber-600" />
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

      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> ~12 minutos</span>
          <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> 50 créditos</span>
        </div>

        <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold">R</div>
            <div className="text-left">
              <p className="text-xs font-semibold">Rafael</p>
              <p className="text-[10px] text-muted-foreground">Comercial</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">S</div>
            <div className="text-left">
              <p className="text-xs font-semibold">Sofia</p>
              <p className="text-[10px] text-muted-foreground">Marketing</p>
            </div>
          </div>
        </div>

        {hasPartialProgress && onResume && (
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

        <Button size="lg" onClick={onStart} className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/20">
          <Navigation className="w-4 h-4" /> {hasPartialProgress ? "Recomeçar do Início" : "Iniciar Diagnóstico"}
        </Button>
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
  const [phase, setPhase] = useState<Phase>("welcome");
  const [generatingStep, setGeneratingStep] = useState<GeneratingStep>("marketing");
  const [rafaelAnswers, setRafaelAnswers] = useState<Record<string, any>>({});
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: activeStrategy, isLoading } = useActiveStrategy();
  const { data: history } = useStrategyHistory();
  const { data: orgId } = useUserOrgId();
  const { data: wallet } = useClienteWallet();
  const { data: salesPlan, isLoading: isLoadingSalesPlan } = useSalesPlan();
  const saveStrategy = useSaveStrategy();
  const approveStrategy = useApproveStrategy();
  const generateStrategy = useGenerateStrategy();
  const saveSalesPlan = useSaveSalesPlan();
  const { data: existingFunnels } = useCrmFunnels();
  const { createFunnel } = useCrmFunnelMutations();
  const { createScript } = useClienteScriptMutations();

  const hasResult = !!activeStrategy?.strategy_result;
  const status = activeStrategy?.status || "pending";
  const generationCount = (history?.length ?? 0) + (activeStrategy ? 1 : 0);

  // Detect if Rafael completed but Sofia/generation hasn't — partial progress
  const hasPartialProgress = !!(
    salesPlan?.answers &&
    Object.keys(salesPlan.answers).length >= 3 &&
    !hasResult
  );

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

  const parseFunnelStages = (text: string) => {
    const parts = text.split(/→|->|,|\n/).map(s => s.trim()).filter(Boolean);
    return parts.map((name, i) => ({
      key: name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
      label: name,
      color: STAGE_COLORS[i % STAGE_COLORS.length],
      icon: "circle-dot",
    }));
  };

  const getDefaultFunnelStages = (modelo: string) => {
    const b2bStages = ["Prospecção", "Qualificação", "Reunião", "Proposta", "Negociação", "Fechamento", "Perdido"];
    const b2cStages = ["Novo Lead", "Primeiro Contato", "Apresentação", "Proposta", "Venda", "Perdido"];
    const stages = modelo === "b2b" ? b2bStages : modelo === "b2c" ? b2cStages : [...b2bStages.slice(0, -1), "Pós-venda", "Perdido"];
    return stages.map((name, i) => ({
      key: name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
      label: name,
      color: STAGE_COLORS[i % STAGE_COLORS.length],
      icon: "circle-dot",
    }));
  };

  const handleSofiaComplete = async (sofiaAnswers: Record<string, any>) => {
    if (!orgId) return;

    // Merge all answers
    const allAnswers = { ...rafaelAnswers, ...sofiaAnswers };
    setGeneratingStep("marketing-core");
    setPhase("generating");

    try {
      // 1. Sales plan already saved in handleRafaelComplete

      // 2. Auto-create CRM funnel from Rafael's answers
      const etapasText = rafaelAnswers.etapas_funil;
      if (!existingFunnels || existingFunnels.length === 0) {
        let funnelStages = [];
        if (typeof etapasText === "string" && etapasText.trim().length > 0) {
          funnelStages = parseFunnelStages(etapasText);
        } else {
          funnelStages = getDefaultFunnelStages(rafaelAnswers.modelo_negocio || "ambos");
        }
        if (funnelStages.length >= 2) {
          try {
            await createFunnel.mutateAsync({
              name: "Funil Principal",
              description: "Criado automaticamente pelo GPS do Negócio",
              stages: funnelStages,
              is_default: true,
            });
          } catch (e) { logger.error("Auto-funnel error:", e); }
        }
      }

      // 3. Generate strategy via AI — three sequential calls
      // Call 1: Marketing Core
      const coreResult = await generateStrategy.mutateAsync({ 
        answers: allAnswers, 
        organization_id: orgId,
        section: "marketing-core",
      });

      // Call 2: Marketing Growth
      setGeneratingStep("marketing-growth");
      const growthResult = await generateStrategy.mutateAsync({ 
        answers: allAnswers, 
        organization_id: orgId,
        section: "marketing-growth",
      });

      // Call 3: Comercial
      setGeneratingStep("comercial");
      const comercialResult = await generateStrategy.mutateAsync({ 
        answers: allAnswers, 
        organization_id: orgId,
        section: "comercial",
      });

      // Merge results
      const unifiedResult = {
        ...(coreResult.result || {}),
        ...(growthResult.result || {}),
        ...(comercialResult.result || {}),
      };
      
      await saveStrategy.mutateAsync({
        answers: allAnswers,
        score_percentage: (unifiedResult as any)?.diagnostico?.score_geral || 0,
        nivel: "gerado",
        strategy_result: unifiedResult,
        status: "pending",
      });

      // 4. Auto-generate scripts in background
      const context = {
        segment: rafaelAnswers.segmento,
        modeloNegocio: rafaelAnswers.modelo_negocio,
        produtosServicos: rafaelAnswers.produto,
        diferenciais: sofiaAnswers.diferencial,
        dorPrincipal: rafaelAnswers.dor_principal,
        ticketMedio: rafaelAnswers.ticket_medio,
        etapasFunil: typeof etapasText === "string" ? etapasText.split(/→|->|,|\n/).map(s => s.trim()).filter(Boolean) : [],
        tempoFechamento: rafaelAnswers.tempo_fechamento,
      };
      (async () => {
        let created = 0;
        for (const stage of ["prospeccao", "diagnostico", "fechamento"]) {
          try {
            const { data, error } = await supabase.functions.invoke("generate-script", {
              body: { stage, briefing: {}, context, organization_id: orgId },
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
      setPhase("result");
    } catch (err: unknown) {
      toast({ title: "Erro ao gerar estratégia", description: (err as Error).message, variant: "destructive" });
      setPhase("chat-sofia");
    }
  };

  const handleApprove = async () => {
    if (!activeStrategy?.id) return;
    try {
      await approveStrategy.mutateAsync(activeStrategy.id);
      toast({ title: "GPS aprovado!", description: "50 créditos foram consumidos. Todas as ferramentas foram desbloqueadas!" });
    } catch (err: unknown) {
      if (isInsufficientCreditsError(err)) {
        setShowCreditsDialog(true);
      } else {
        toast({ title: "Erro ao aprovar", description: (err as Error).message, variant: "destructive" });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="GPS do Negócio" subtitle="Carregando..." icon={<Navigation className="w-5 h-5 text-amber-500" />} />
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-xl bg-muted/50" />)}
        </div>
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
          <GPSWelcome key="welcome" onStart={() => setPhase("chat-rafael")} hasPartialProgress={hasPartialProgress} onResume={handleResumeFromSofia} />
        )}

        {phase === "chat-rafael" && (
          <motion.div key="rafael" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ChatBriefing
              agent={AGENTS.gps_rafael}
              steps={GPS_RAFAEL_STEPS}
              onComplete={handleRafaelComplete}
              onCancel={() => setPhase("welcome")}
            />
          </motion.div>
        )}

        {phase === "transition" && <TransitionScreen key="transition" />}

        {phase === "chat-sofia" && (
          <motion.div key="sofia" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ChatBriefing
              agent={AGENTS.gps_sofia}
              steps={GPS_SOFIA_STEPS}
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
                    {generatingStep === "marketing" 
                      ? "Etapa 1/2 — Analisando marketing, criando ICP, estratégias e plano de conteúdo..."
                      : "Etapa 2/2 — Gerando diagnóstico comercial, projeções de receita e estratégias de vendas..."
                    }
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className={`w-2 h-2 rounded-full ${generatingStep === "marketing" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                    <span className="text-xs text-muted-foreground">Marketing</span>
                    <div className="w-6 h-px bg-muted-foreground/30" />
                    <div className={`w-2 h-2 rounded-full ${generatingStep === "comercial" ? "bg-amber-500 animate-pulse" : "bg-muted-foreground/30"}`} />
                    <span className="text-xs text-muted-foreground">Comercial</span>
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
                {history.map((s) => <StrategyHistoryItem key={s.id} strategy={s} />)}
              </div>
            )}

            <StrategyDashboard
              result={activeStrategy?.strategy_result}
              onApprove={handleApprove}
              onRegenerate={() => { setRafaelAnswers({}); setPhase("welcome"); }}
              isApproving={approveStrategy.isPending}
              status={status}
              createdAt={activeStrategy?.created_at ?? ""}
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
    </div>
  );
}
