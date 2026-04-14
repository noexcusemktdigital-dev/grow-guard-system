// @ts-nocheck
import { useState } from "react";
import { Sparkles, Clock, DollarSign, Megaphone } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActiveStrategy, useStrategyHistory, useSaveStrategy, useApproveStrategy, useGenerateStrategy } from "@/hooks/useMarketingStrategy";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { toast } from "@/hooks/use-toast";
import { ChatBriefing } from "@/components/cliente/ChatBriefing";
import { InsufficientCreditsDialog, isInsufficientCreditsError } from "@/components/cliente/InsufficientCreditsDialog";
import { AGENTS, SOFIA_STEPS } from "@/components/cliente/briefingAgents";

import { StrategyDashboard, StrategyHistoryItem } from "./ClientePlanoMarketingStrategy";

/* ═══════════════ MAIN PAGE ═══════════════ */

export default function ClientePlanoMarketing() {
  const [showChat, setShowChat] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);

  const { data: activeStrategy, isLoading } = useActiveStrategy();
  const { data: history } = useStrategyHistory();
  const { data: orgId } = useUserOrgId();
  const { data: wallet } = useClienteWallet();
  const saveStrategy = useSaveStrategy();
  const approveStrategy = useApproveStrategy();
  const generateStrategy = useGenerateStrategy();

  const hasResult = !!activeStrategy?.strategy_result;
  const status = activeStrategy?.status || "pending";
  const generationCount = (history?.length ?? 0) + (activeStrategy ? 1 : 0);

  const handleChatComplete = async (answers: Record<string, any>) => {
    if (!orgId) return;
    setIsGenerating(true);
    try {
      const aiResult = await generateStrategy.mutateAsync({ answers, organization_id: orgId });
      await saveStrategy.mutateAsync({
        answers,
        score_percentage: Math.round(Number(aiResult.result?.diagnostico?.score_geral || 0)),
        nivel: "gerado",
        strategy_result: aiResult.result,
        status: "pending",
      });
      toast({ title: "Estratégia gerada!", description: "Revise o resultado e aprove para finalizar." });
    } catch (err: unknown) {
      toast({ title: "Erro ao gerar estratégia", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setShowChat(false);
    }
  };

  const handleApprove = async () => {
    if (!activeStrategy?.id) return;
    try {
      await approveStrategy.mutateAsync(activeStrategy.id);
      toast({ title: "Estratégia aprovada!", description: "50 créditos foram consumidos." });
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
        <PageHeader title="Plano de Marketing" subtitle="Carregando..." icon={<Megaphone className="w-5 h-5 text-primary" />} />
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-xl bg-muted/50" />)}
        </div>
      </div>
    );
  }

  if (showChat || isGenerating) {
    return (
      <div className="space-y-4">
        <PageHeader title="Plano de Marketing" subtitle="Responda as perguntas para gerar seu plano" icon={<Megaphone className="w-5 h-5 text-primary" />} />
        {isGenerating ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center gap-4">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-10 h-10 text-primary" />
              </motion.div>
              <div className="text-center">
                <p className="font-semibold">Gerando sua estratégia completa...</p>
                <p className="text-sm text-muted-foreground">Isso pode levar até 40 segundos — estamos analisando concorrência, definindo tom de voz, criando calendário editorial e muito mais.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ChatBriefing agent={AGENTS.sofia} steps={SOFIA_STEPS} onComplete={handleChatComplete} onCancel={() => setShowChat(false)} />
        )}
      </div>
    );
  }

  if (hasResult) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <PageHeader title="Plano de Marketing" subtitle="Dashboard estratégico personalizado" icon={<Megaphone className="w-5 h-5 text-primary" />} />
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
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Estratégias anteriores</p>
            {history.map((s) => <StrategyHistoryItem key={s.id} strategy={s} />)}
          </div>
        )}

        <StrategyDashboard
          result={activeStrategy?.strategy_result}
          onApprove={handleApprove}
          onRegenerate={() => setShowChat(true)}
          isApproving={approveStrategy.isPending}
          status={status}
          createdAt={activeStrategy?.created_at ?? ""}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Plano de Marketing" subtitle="Crie seu plano de marketing personalizado com a nossa IA" icon={<Megaphone className="w-5 h-5 text-primary" />} />

      <Card className="border-dashed">
        <CardContent className="p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Crie seu Plano de Marketing</h3>
            <p className="text-sm text-muted-foreground max-w-lg mt-1">
              Responda perguntas estratégicas e a nossa IA vai gerar um plano completo com diagnóstico, radar 6D,
              análise de concorrência, tom de voz, calendário editorial, projeções de crescimento, benchmarks do setor e roadmap de execução.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~7 minutos</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> 50 créditos</span>
            <span className="flex items-center gap-1">Saldo: {wallet?.balance ?? 0}</span>
          </div>
          <Button size="lg" onClick={() => setShowChat(true)} className="gap-2 mt-2">
            <Sparkles className="w-4 h-4" /> Iniciar Diagnóstico
          </Button>

          {(history?.length ?? 0) > 0 && (
            <div className="w-full mt-6 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Estratégias anteriores ({history?.length})</p>
              {history?.map((s) => <StrategyHistoryItem key={s.id} strategy={s} />)}
            </div>
          )}
        </CardContent>
      </Card>
      <InsufficientCreditsDialog
        open={showCreditsDialog}
        onOpenChange={setShowCreditsDialog}
        actionLabel="esta estratégia"
        creditCost={300}
      />
    </div>
  );
}
