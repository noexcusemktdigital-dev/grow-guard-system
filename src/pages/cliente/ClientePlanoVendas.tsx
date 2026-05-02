// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import type { Tables } from "@/integrations/supabase/types";
import type { SalesPlanHistoryItem } from "@/hooks/useSalesPlan";
import type { CrmTeam } from "@/hooks/useCrmTeams";
import type { TeamMember } from "@/hooks/useCrmTeam";
import { logger } from "@/lib/logger";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import {
  Target, Rocket, Activity, Lock, BarChart3, Clock,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { playSound } from "@/lib/sounds";
import { useSalesPlan, useSaveSalesPlan, useSalesPlanHistory, useArchiveSalesPlan } from "@/hooks/useSalesPlan";
import { useClienteScriptMutations } from "@/hooks/useClienteScripts";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { useActiveGoals, useHistoricGoals, useGoalMutations } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { useCrmTeams } from "@/hooks/useCrmTeams";
import { useCrmTeam } from "@/hooks/useCrmTeam";

import type { Answers } from "./ClientePlanoVendasData";
import { MESES_COMPLETOS } from "./ClientePlanoVendasData";
import { computeScores, generateInsights, getLeadsProjection, getRevenueProjection, generateActionPlan } from "./ClientePlanoVendasScoring";
import { ClientePlanoVendasDiagnostico } from "./ClientePlanoVendasDiagnostico";
import { ClientePlanoVendasHistorico } from "./ClientePlanoVendasHistorico";
import { ClientePlanoVendasMetas } from "./ClientePlanoVendasMetas";
import { ClientePlanoVendasMetaDialog, type MetaFormState } from "./ClientePlanoVendasMetaDialog";


export default function ClientePlanoVendas() {
  // ── Sales Plan from DB ──
  const { data: salesPlanData, isLoading: spLoading } = useSalesPlan();
  const saveSalesPlan = useSaveSalesPlan();
  const { data: planHistory, isLoading: historyLoading } = useSalesPlanHistory();
  const archiveSalesPlan = useArchiveSalesPlan();

  const [answers, setAnswers] = useState<Answers>({});
  const [completed, setCompleted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Sync from DB once loaded
  useEffect(() => {
    if (spLoading) return;
    if (salesPlanData) {
      const dbAnswers = (salesPlanData.answers || {}) as Answers;
      setAnswers(dbAnswers);
      const isComplete = Object.keys(dbAnswers).length > 5;
      setCompleted(isComplete);
      setShowWelcome(!isComplete);
    }
  }, [salesPlanData, spLoading]);

  // ── Metas state ──
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [novaMetaOpen, setNovaMetaOpen] = useState(false);
  const [novaMeta, setNovaMeta] = useState<MetaFormState>({ title: "", metric: "revenue", target_value: 0, scope: "company", team_id: "", assigned_to: "", priority: "media", mesRef: "" });
  const [targetDisplay, setTargetDisplay] = useState("");

  const { data: activeGoals, isLoading: goalsLoading } = useActiveGoals(scopeFilter);
  const { data: historicGoals } = useHistoricGoals();
  const { data: goalProgress } = useGoalProgress(activeGoals);
  const { createGoal, updateGoal, archiveGoal } = useGoalMutations();
  const [editingGoal, setEditingGoal] = useState<Tables<'goals'> | null>(null);
  const { data: teams } = useCrmTeams();
  const { data: members } = useCrmTeam();

  const isMonetaryMetric = (m: string) => ["revenue", "avg_ticket"].includes(m);

  // ── Diagnostic computed ──
  const { scoreMap, maxMap, radarData, percentage } = useMemo(() => computeScores(answers), [answers]);
  const insights = useMemo(() => generateInsights(answers, scoreMap, maxMap), [answers, scoreMap, maxMap]);
  const leadsProjection = useMemo(() => getLeadsProjection(percentage), [percentage]);
  const revenueProjection = useMemo(() => getRevenueProjection(answers, percentage), [answers, percentage]);
  const actionPlan = useMemo(() => generateActionPlan(scoreMap, maxMap, answers), [scoreMap, maxMap, answers]);

  // ── Scripts hooks ──
  const { createScript } = useClienteScriptMutations();
  const { data: orgId } = useUserOrgId();

  const handleChatComplete = async (chatAnswers: Record<string, unknown>) => {
    const ans = chatAnswers as Answers;
    setAnswers(ans);
    setCompleted(true);
    const { percentage: pct } = computeScores(ans);
    saveSalesPlan.mutate({ answers: ans, score: Math.round(pct) });




    // Auto-generate initial scripts (background)
    if (orgId) {
      const scriptStages = ["prospeccao", "diagnostico", "fechamento"];
      const context = {
        segment: ans.segmento,
        modeloNegocio: ans.modelo_negocio,
        produtosServicos: ans.produtos_servicos,
        diferenciais: ans.diferenciais,
        dorPrincipal: ans.dor_principal,
        ticketMedio: ans.ticket_medio,
        etapasFunil: typeof ans.etapas_funil === "string" ? (ans.etapas_funil as string).split(/→|->|,|\n/).map((s: string) => s.trim()).filter(Boolean) : [],
        tempoFechamento: ans.tempo_fechamento,
      };

      (async () => {
        let created = 0;
        for (const stage of scriptStages) {
          try {
            const { data, error } = await invokeEdge("generate-script", {
              body: { stage, briefing: {}, context, organization_id: orgId },
            });
            if (error) {
              logger.error(`Auto-script ${stage} error:`, error.message);
              continue;
            }
            if (data?.error) {
              logger.error(`Auto-script ${stage} error:`, data.error);
              continue;
            }
            if (data?.content) {
              await createScript.mutateAsync({
                title: data.title || `Script de ${stage}`,
                content: data.content,
                category: stage,
                tags: data.tags || [stage],
              });
              created++;
            }
          } catch (e) {
            logger.error(`Auto-script ${stage} error:`, e);
          }
        }
        if (created > 0) {
          toast({ title: `${created} scripts gerados automaticamente!`, description: "Acesse a seção de Scripts para revisá-los." });
        }
      })();
    }
  };

  const handleRestart = async () => {
    if (salesPlanData && Object.keys(salesPlanData.answers || {}).length > 5) {
      try {
        await archiveSalesPlan.mutateAsync({
          answers: salesPlanData.answers,
          score: salesPlanData.score ?? 0,
        });
      } catch (e) {
        logger.error("Archive error:", e);
      }
    }
    setAnswers({}); setCompleted(false);
    saveSalesPlan.mutate({ answers: {}, score: 0 });
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
      title: novaMeta.title,
      target_value: novaMeta.target_value,
      metric: novaMeta.metric,
      scope: novaMeta.scope,
      priority: novaMeta.priority,
      team_id: novaMeta.scope === "team" && novaMeta.team_id ? novaMeta.team_id : undefined,
      assigned_to: novaMeta.scope === "individual" && novaMeta.assigned_to ? novaMeta.assigned_to : undefined,
      period_start: periodStart,
      period_end: periodEndISO,
      status: "active",
    }, {
      onSuccess: () => {
        playSound("success");
        setNovaMeta({ title: "", metric: "revenue", target_value: 0, scope: "company", team_id: "", assigned_to: "", priority: "media", mesRef: "" });
        setTargetDisplay("");
        setNovaMetaOpen(false);
        toast({ title: "Meta criada com sucesso!" });
      },
    });
  };

  const handleEditMeta = () => {
    if (!editingGoal || !novaMeta.title || novaMeta.target_value <= 0 || !novaMeta.mesRef) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const [y, m] = novaMeta.mesRef.split("-").map(Number);
    const periodStart = new Date(y, m - 1, 1).toISOString();
    const periodEnd = new Date(y, m, 0, 23, 59, 59).toISOString();
    updateGoal.mutate({
      id: editingGoal.id,
      title: novaMeta.title,
      target_value: novaMeta.target_value,
      metric: novaMeta.metric,
      scope: novaMeta.scope,
      priority: novaMeta.priority,
      team_id: novaMeta.scope === "team" && novaMeta.team_id ? novaMeta.team_id : null,
      assigned_to: novaMeta.scope === "individual" && novaMeta.assigned_to ? novaMeta.assigned_to : null,
      period_start: periodStart,
      period_end: periodEnd,
    }, {
      onSuccess: () => {
        playSound("success");
        setNovaMeta({ title: "", metric: "revenue", target_value: 0, scope: "company", team_id: "", assigned_to: "", priority: "media", mesRef: "" });
        setTargetDisplay("");
        setNovaMetaOpen(false);
        setEditingGoal(null);
        toast({ title: "Meta atualizada com sucesso!" });
      },
    });
  };

  const openEditGoal = (goal: Record<string, unknown>) => {
    const g = goal as Record<string, unknown>;
    const mesRef = g.period_start ? (g.period_start as string).slice(0, 7) : "";
    setNovaMeta({
      title: (g.title as string) || "",
      metric: (g.metric as string) || "revenue",
      target_value: (g.target_value as number) || 0,
      scope: (g.scope as string) || "company",
      team_id: (g.team_id as string) || "",
      assigned_to: (g.assigned_to as string) || "",
      priority: (g.priority as string) || "media",
      mesRef,
    });
    setTargetDisplay(isMonetaryMetric((g.metric as string) || "revenue") ? ((g.target_value as number) || 0).toLocaleString("pt-BR") : "");
    setEditingGoal(g);
    setNovaMetaOpen(true);
  };

  /* ══════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════ */

  return (
    <div className="w-full space-y-6">
      {/* Welcome popup for first-time users */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Rocket className="w-5 h-5 text-primary" />
              Estruture seu Comercial
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              O <strong>Plano de Vendas</strong> é o primeiro passo para desbloquear todo o potencial da plataforma. Em poucos minutos você terá:
            </p>
            <ul className="space-y-2.5">
              {[
                { icon: Activity, text: "Diagnóstico completo do seu comercial" },
                { icon: Target, text: "Insights personalizados com plano de ação" },
                { icon: Target, text: "Projeções de crescimento de leads e receita" },
                { icon: Target, text: "Metas claras e acompanhamento em tempo real" },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Sem o Plano de Vendas, CRM, Chat, Agentes IA e outras funções ficam bloqueados.
              </p>
            </div>
          </div>
          <Button className="w-full font-semibold" onClick={() => setShowWelcome(false)}>
            <Rocket className="w-4 h-4 mr-2" /> Começar agora
          </Button>
        </DialogContent>
      </Dialog>

      <PageHeader
        title="Plano de Vendas"
        subtitle="Consultoria comercial interativa para diagnosticar e evoluir seu comercial"
        icon={<Target className="w-5 h-5 text-primary" />}
        actions={<FeatureTutorialButton slug="plano_vendas" />}
      />

      <Tabs defaultValue="diagnostico" className="w-full">
        <TabsList className="w-fit">
          <TabsTrigger value="diagnostico" className="gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Diagnóstico
          </TabsTrigger>
          <TabsTrigger value="metas" className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Metas
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostico" className="space-y-6 mt-4">
          <ClientePlanoVendasDiagnostico
            completed={completed}
            answers={answers}
            percentage={percentage}
            radarData={radarData}
            insights={insights}
            leadsProjection={leadsProjection}
            revenueProjection={revenueProjection}
            actionPlan={actionPlan}
            onChatComplete={handleChatComplete}
            onRestart={handleRestart}
            onShowWelcome={() => setShowWelcome(true)}
          />
        </TabsContent>

        <TabsContent value="historico" className="space-y-6 mt-4">
          <ClientePlanoVendasHistorico
            planHistory={planHistory as SalesPlanHistoryItem[]}
            historyLoading={historyLoading}
          />
        </TabsContent>

        <TabsContent value="metas" className="space-y-6 mt-4">
          <ClientePlanoVendasMetas
            activeGoals={activeGoals ?? []}
            historicGoals={historicGoals}
            goalProgress={goalProgress}
            goalsLoading={goalsLoading}
            scopeFilter={scopeFilter}
            setScopeFilter={setScopeFilter}
            onNewMeta={() => setNovaMetaOpen(true)}
            onEditMeta={openEditGoal}
            onArchiveMeta={(id) => archiveGoal.mutate(id)}
            isMonetaryMetric={isMonetaryMetric}
          />
        </TabsContent>
      </Tabs>

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
        teams={teams as CrmTeam[]}
        members={members as TeamMember[]}
      />
    </div>
  );
}
