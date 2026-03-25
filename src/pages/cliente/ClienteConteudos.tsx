import { useState, useEffect } from "react";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import { FileText, Check, Sparkles, FolderOpen, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  useContentHistory, useGenerateContent, useApproveContent,
  useApproveBatch, useContentQuota, useDeleteContent, CREDIT_COST_APPROVE_CONTENT,
} from "@/hooks/useClienteContentV2";
import { useStrategyData } from "@/hooks/useStrategyData";
import { useNavigate } from "react-router-dom";
import { StrategyBanner } from "@/components/cliente/StrategyBanner";
import { ApprovalDashboard } from "@/components/cliente/ApprovalDashboard";
import { InsufficientCreditsDialog, isInsufficientCreditsError } from "@/components/cliente/InsufficientCreditsDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Refactored components
import { ContentWizard } from "@/components/cliente/content/ContentWizard";
import { ContentVisualCard } from "@/components/cliente/content/ContentVisualCard";
import { BatchFolderView } from "@/components/cliente/content/BatchFolderView";
import { ContentDetailSheet } from "@/components/cliente/content/ContentDetailSheet";
import { OBJETIVOS, loadingPhrases } from "@/components/cliente/content/ContentTypes";

const TOTAL_STEPS = 4;

export default function ClienteConteudos() {
  const navigate = useNavigate();
  const strategy = useStrategyData();
  const { data: history } = useContentHistory();
  const quota = useContentQuota();
  const generateMutation = useGenerateContent();
  const approveMutation = useApproveContent();
  const approveBatchMutation = useApproveBatch();
  const deleteMutation = useDeleteContent();

  const hasStrategy = strategy.hasStrategy;
  const maxPerBatch = Math.min(quota.remaining, 30);

  // Wizard state
  const [quantidade, setQuantidade] = useState(Math.min(maxPerBatch, 8));
  const [formatDist, setFormatDist] = useState<Record<string, number>>({});
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [tema, setTema] = useState("");
  const [plataforma, setPlataforma] = useState("Instagram");

  // Results
  const [generatedContents, setGeneratedContents] = useState<any[]>([]);
  const [generatedIds, setGeneratedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [isResultScreen, setIsResultScreen] = useState(false);

  // Dialogs
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [confirmApproveAll, setConfirmApproveAll] = useState(false);
  const [expandedContent, setExpandedContent] = useState<any>(null);

  // Pre-fill platform from strategy
  useEffect(() => {
    if (hasStrategy && strategy.canalPrioritario) {
      setPlataforma(strategy.canalPrioritario);
    }
  }, [hasStrategy, strategy.canalPrioritario]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setLoadingIdx(0);
    const interval = setInterval(() => setLoadingIdx(p => (p + 1) % loadingPhrases.length), 3000);

    try {
      const formatos = Object.entries(formatDist).map(([tipo, qtd]) => ({ tipo, qtd }));
      const strategyPayload = hasStrategy ? {
        icp: strategy.icp, propostaValor: strategy.propostaValor,
        tomComunicacao: strategy.tomComunicacao, pilares: strategy.pilares,
        calendarioSemanal: strategy.calendarioSemanal, funil: strategy.funil,
        analiseConcorrencia: strategy.analiseConcorrencia, benchmarks: strategy.benchmarks,
        answers: strategy.answers,
      } : null;

      const res = await generateMutation.mutateAsync({
        quantidade, formatos, objetivos,
        tema: tema || undefined, plataforma,
        tom: hasStrategy ? strategy.tomPrincipal || undefined : undefined,
        publico: hasStrategy ? strategy.publicoAlvo || undefined : undefined,
        estrategia: strategyPayload,
      });
      setGeneratedContents(res.conteudos);
      setGeneratedIds((res.dbRecords as any[]).map((r: any) => r.id));
      setIsResultScreen(true);
      toast({ title: `${res.conteudos.length} conteúdos gerados com sucesso!` });
    } catch (err: any) {
      toast({ title: "Erro ao gerar", description: err?.message, variant: "destructive" });
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleApproveOne = async (idx: number) => {
    const id = generatedIds[idx];
    if (!id) return;
    try {
      await approveMutation.mutateAsync(id);
      toast({ title: "Conteúdo aprovado!", description: `${CREDIT_COST_APPROVE_CONTENT} créditos debitados.` });
    } catch (err: any) {
      if (isInsufficientCreditsError(err)) setShowCreditsDialog(true);
      else toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
  };

  const handleApproveAll = async () => {
    setConfirmApproveAll(false);
    try {
      await approveBatchMutation.mutateAsync(generatedIds);
      toast({ title: "Lote aprovado!", description: `${generatedIds.length * CREDIT_COST_APPROVE_CONTENT} créditos debitados.` });
    } catch (err: any) {
      if (isInsufficientCreditsError(err)) setShowCreditsDialog(true);
      else toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
  };

  const handleDeleteGenerated = (idx: number) => {
    const id = generatedIds[idx];
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setGeneratedContents(prev => prev.filter((_, i) => i !== idx));
        setGeneratedIds(prev => prev.filter((_, i) => i !== idx));
        toast({ title: "Conteúdo removido." });
      },
      onError: (err: any) => toast({ title: "Erro", description: err?.message, variant: "destructive" }),
    });
  };

  const handleDeleteHistory = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: "Conteúdo removido." }),
      onError: (err: any) => toast({ title: "Erro", description: err?.message, variant: "destructive" }),
    });
  };

  const resetWizard = () => {
    setIsResultScreen(false);
    setQuantidade(Math.min(Math.min(quota.remaining, 30), 8));
    setFormatDist({});
    setObjetivos([]);
    setTema("");
    setGeneratedContents([]);
    setGeneratedIds([]);
  };

  const copyContent = (c: any) => {
    let text = c.titulo + "\n\n";
    if (c.legenda) text += c.legenda + "\n\n";
    // Smart copy: include all carousel slides
    const parsed = c.conteudo_principal;
    if (Array.isArray(parsed)) {
      text += parsed.map((s: any, i: number) => `[Slide ${i + 1}] ${s.titulo || ""}\n${s.texto || s.content || ""}`).join("\n\n") + "\n\n";
    }
    if (c.hashtags?.length) text += c.hashtags.map((h: string) => `#${h.replace(/^#/, "")}`).join(" ");
    navigator.clipboard.writeText(text);
    toast({ title: "Conteúdo copiado!" });
  };

  const downloadPdf = async (c: any, idx: number) => {
    try {
      const el = document.getElementById(`content-card-${idx}`);
      if (!el) return;
      const html2pdf = (await import("html2pdf.js")).default;
      html2pdf().set({ margin: 8, filename: `${c.titulo || "conteudo"}.pdf`, html2canvas: { scale: 2 } }).from(el).save();
    } catch {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    }
  };

  const contextInfo = hasStrategy ? {
    tom: strategy.tomPrincipal || undefined,
    publico: strategy.publicoAlvo || undefined,
    plataforma,
  } : { plataforma };

  return (
    <div className="space-y-6">
      <PageHeader title="Geração de Conteúdo" subtitle="Gere lotes estratégicos de conteúdos alinhados com seu plano" actions={<FeatureTutorialButton slug="conteudos" />} />

      <StrategyBanner toolName="a geração de conteúdo" dataUsed="Pilares, ICP e tom de voz" />

      <ApprovalDashboard />

      <div className="flex flex-wrap items-center gap-3">
        {hasStrategy && (
          <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
            <Check className="w-3.5 h-3.5" /> Estratégia conectada
          </Badge>
        )}
        <Badge variant="outline" className="gap-1.5">
          <FileText className="w-3.5 h-3.5" /> {quota.creditBalance} créditos · até {quota.remaining} conteúdos ({quota.costPerContent} créditos cada)
        </Badge>
      </div>

      <Tabs defaultValue="criar">
        <TabsList>
          <TabsTrigger value="criar"><Sparkles className="w-4 h-4 mr-1" /> Criar Lote</TabsTrigger>
          <TabsTrigger value="meus"><FolderOpen className="w-4 h-4 mr-1" /> Meus Conteúdos</TabsTrigger>
        </TabsList>

        {/* ── TAB: CRIAR ── */}
        <TabsContent value="criar" className="mt-4">
          {!isResultScreen ? (
            <ContentWizard
              quotaRemaining={quota.remaining}
              quotaMax={quota.max}
              creditBalance={quota.creditBalance}
              costPerContent={quota.costPerContent}
              hasStrategy={hasStrategy}
              strategy={strategy}
              isGenerating={isGenerating}
              loadingIdx={loadingIdx}
              quantidade={quantidade}
              onGenerate={handleGenerate}
              onQuantidadeChange={setQuantidade}
              formatDist={formatDist}
              onFormatDistChange={setFormatDist}
              objetivos={objetivos}
              onObjetivosChange={setObjetivos}
              tema={tema}
              onTemaChange={setTema}
              plataforma={plataforma}
              onPlataformaChange={setPlataforma}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-xl font-bold">{generatedContents.length} Conteúdos Gerados</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetWizard}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Novo Lote
                  </Button>
                  <Button size="sm" onClick={() => setConfirmApproveAll(true)} disabled={approveBatchMutation.isPending}>
                    <Check className="w-4 h-4 mr-1" /> Aprovar Tudo ({generatedIds.length * CREDIT_COST_APPROVE_CONTENT} créditos)
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedContents.map((c, i) => (
                  <ContentVisualCard key={i} content={c} index={i}
                    onCopy={() => copyContent(c)}
                    onPdf={() => downloadPdf(c, i)}
                    onPost={() => navigate(`/cliente/redes-sociais?content_id=${generatedIds[i]}`)}
                    onApprove={() => handleApproveOne(i)}
                    onDelete={() => handleDeleteGenerated(i)}
                    onExpand={() => setExpandedContent(c)}
                    approving={approveMutation.isPending}
                    showContext={contextInfo}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── TAB: MEUS CONTEÚDOS ── */}
        <TabsContent value="meus" className="mt-4 space-y-4">
          <BatchFolderView history={history || []} navigate={navigate} onDelete={handleDeleteHistory} />
        </TabsContent>
      </Tabs>

      {/* Confirm Approve All */}
      <AlertDialog open={confirmApproveAll} onOpenChange={setConfirmApproveAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar todos os conteúdos?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso consumirá <strong>{generatedIds.length * CREDIT_COST_APPROVE_CONTENT} créditos</strong> da sua carteira.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveAll}>Confirmar Aprovação</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Expanded Content Detail */}
      <ContentDetailSheet
        open={!!expandedContent}
        onOpenChange={open => !open && setExpandedContent(null)}
        content={expandedContent}
        onCopy={() => {
          if (expandedContent) {
            copyContent(expandedContent);
          }
        }}
        onPost={() => setExpandedContent(null)}
      />

      <InsufficientCreditsDialog
        open={showCreditsDialog}
        onOpenChange={setShowCreditsDialog}
        actionLabel="este conteúdo"
        creditCost={200}
      />
    </div>
  );
}
