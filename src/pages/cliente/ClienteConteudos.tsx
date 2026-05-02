// @ts-nocheck

import { useState, useEffect } from "react";
import type { ContentItem } from "@/hooks/useClienteContentV2";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import { FileText, Check, Sparkles, FolderOpen, RotateCcw, Video, Clapperboard } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useMemberPermissions } from "@/hooks/useMemberPermissions";
import {
  useContentHistory, useGenerateContent, useApproveContent,
  useApproveBatch, useContentQuota, useDeleteContent, CREDIT_COST_APPROVE_CONTENT,
} from "@/hooks/useClienteContentV2";
import { useStrategyData } from "@/hooks/useStrategyData";
import { useNavigate } from "react-router-dom";
import { StrategyBanner } from "@/components/cliente/StrategyBanner";

import { InsufficientCreditsDialog, isInsufficientCreditsError } from "@/components/cliente/InsufficientCreditsDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ContentWizard } from "@/components/cliente/content/ContentWizard";
import { ContentVisualCard } from "@/components/cliente/content/ContentVisualCard";
import { BatchFolderView } from "@/components/cliente/content/BatchFolderView";
import { ContentDetailSheet } from "@/components/cliente/content/ContentDetailSheet";
import { OBJETIVOS, loadingPhrases } from "@/components/cliente/content/ContentTypes";
import { RecordingTutorial } from "@/components/cliente/content/RecordingTutorial";

const TOTAL_STEPS = 4;

export default function ClienteConteudos() {
  const navigate = useNavigate();
  const strategy = useStrategyData();
  const { permissions, isAdmin } = useMemberPermissions();
  const canGenerate = isAdmin || permissions.can_generate_content;
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
  const [duracao, setDuracao] = useState("30s");

  // Results
  const [generatedContents, setGeneratedContents] = useState<ContentItem[]>([]);
  const [generatedIds, setGeneratedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [isResultScreen, setIsResultScreen] = useState(false);

  // Dialogs
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [confirmApproveAll, setConfirmApproveAll] = useState(false);
  const [expandedContent, setExpandedContent] = useState<ContentItem | null>(null);
  const [recordingScript, setRecordingScript] = useState<ContentItem | null>(null);

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
        icp: strategy.icp,
        propostaValor: strategy.propostaValor,
        tomComunicacao: strategy.tomComunicacao,
        pilares: strategy.pilares,
        calendarioSemanal: strategy.calendarioSemanal,
        funil: strategy.funil,
        analiseConcorrencia: strategy.analiseConcorrencia,
        benchmarks: strategy.benchmarks,
        answers: strategy.answers,
        // Novos dados das perguntas enriquecidas do GPS
        dorPrincipal: strategy.salesPlanDorPrincipal,
        diferenciais: strategy.salesPlanDiferenciais,
        segmento: strategy.salesPlanSegmento,
        modeloNegocio: strategy.salesPlanModeloNegocio,
        ticketMedio: strategy.salesPlanTicketMedio,
        objecoes: strategy.salesPlanAnswers?.objecoes || "",
        maiorPerda: strategy.salesPlanAnswers?.maior_perda || "",
        momentoNegocio: strategy.salesPlanAnswers?.momento_negocio || "",
        publicoAlvo: strategy.salesPlanAnswers?.publico || "",
        canaisPrincipais: strategy.salesPlanAnswers?.canais_aquisicao || [],
      } : null;

      const res = await generateMutation.mutateAsync({
        quantidade, formatos, objetivos,
        tema: tema || undefined, plataforma,
        tom: hasStrategy ? strategy.tomPrincipal || undefined : undefined,
        publico: hasStrategy ? strategy.publicoAlvo || undefined : undefined,
        estrategia: strategyPayload,
      });
      setGeneratedContents(res.conteudos);
      setGeneratedIds(((res.dbRecords as { id: string }[]) || []).map((r) => r.id));
      setIsResultScreen(true);
      toast({ title: `${res.conteudos.length} roteiros gerados com sucesso!` });
    } catch (err: unknown) {
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
      toast({ title: "Roteiro aprovado!", description: `${CREDIT_COST_APPROVE_CONTENT} créditos debitados.` });
    } catch (err: unknown) {
      if (isInsufficientCreditsError(err)) setShowCreditsDialog(true);
      else toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
  };

  const handleApproveAll = async () => {
    setConfirmApproveAll(false);
    try {
      const result = await approveBatchMutation.mutateAsync(generatedIds);
      const approved = (result as Record<string, unknown>)?.approved ?? generatedIds.length;
      const skipped = (result as Record<string, unknown>)?.skipped ?? 0;

      if (approved === 0) {
        toast({ title: "Todos já aprovados!", description: "Nenhum crédito debitado." });
      } else {
        toast({
          title: "Lote aprovado!",
          description: `${approved * CREDIT_COST_APPROVE_CONTENT} créditos debitados.${skipped > 0 ? ` ${skipped} já estavam aprovados.` : ""}`,
        });
      }
    } catch (err: unknown) {
      if (isInsufficientCreditsError(err)) setShowCreditsDialog(true);
      else toast({ title: "Erro", description: (err as Error)?.message, variant: "destructive" });
    }
  };

  const handleDeleteGenerated = (idx: number) => {
    const id = generatedIds[idx];
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setGeneratedContents(prev => prev.filter((_, i) => i !== idx));
        setGeneratedIds(prev => prev.filter((_, i) => i !== idx));
        toast({ title: "Roteiro removido." });
      },
      onError: (err: unknown) => toast({ title: "Erro", description: err instanceof Error ? err.message : String(err), variant: "destructive" }),
    });
  };

  const handleDeleteHistory = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: "Roteiro removido." }),
      onError: (err: unknown) => toast({ title: "Erro", description: err instanceof Error ? err.message : String(err), variant: "destructive" }),
    });
  };

  const resetWizard = () => {
    setIsResultScreen(false);
    setQuantidade(Math.min(Math.min(quota.remaining, 30), 8));
    setFormatDist({});
    setObjetivos([]);
    setTema("");
    setDuracao("30s");
    setGeneratedContents([]);
    setGeneratedIds([]);
  };

  const copyContent = (c: Record<string, unknown>) => {
    let text = c.titulo + "\n\n";
    if (c.legenda) text += c.legenda + "\n\n";
    const parsed = c.conteudo_principal;
    if (typeof parsed === "object" && parsed) {
      if (parsed.hook) text += `[HOOK] ${parsed.hook}\n\n`;
      if (parsed.desenvolvimento) text += `[DESENVOLVIMENTO] ${parsed.desenvolvimento}\n\n`;
      if (parsed.texto_tela) text += `[TEXTO DE TELA] ${parsed.texto_tela}\n\n`;
      if (parsed.conclusao) text += `[CONCLUSÃO] ${parsed.conclusao}\n\n`;
      if (parsed.cta) text += `[CTA] ${parsed.cta}\n\n`;
    }
    if (c.hashtags?.length) text += c.hashtags.map((h: string) => `#${h.replace(/^#/, "")}`).join(" ");
    navigator.clipboard.writeText(text);
    toast({ title: "Roteiro copiado!" });
  };

  const downloadPdf = async (c: Record<string, unknown>, idx: number) => {
    try {
      const el = document.getElementById(`content-card-${idx}`);
      if (!el) return;
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let y = 0;
      while (y < imgH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, -y, imgW, imgH);
        y += pageH;
      }
      pdf.save(`${c.titulo || "roteiro"}.pdf`);
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
      <PageHeader title="Roteiros" subtitle="Gere roteiros estratégicos de vídeo alinhados com seu plano" actions={<FeatureTutorialButton slug="conteudos" />} />

      <StrategyBanner toolName="a geração de roteiros" dataUsed="Pilares, ICP e tom de voz" />

      <div className="flex flex-wrap items-center gap-3">
        {hasStrategy && (
          <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
            <Check className="w-3.5 h-3.5" /> Estratégia conectada
          </Badge>
        )}
        <Badge variant="outline" className="gap-1.5">
          <Video className="w-3.5 h-3.5" /> {quota.creditBalance} créditos · até {quota.remaining} roteiros ({quota.costPerContent} créditos cada)
        </Badge>
      </div>

      <Tabs defaultValue="criar">
        <TabsList>
          <TabsTrigger value="criar"><Sparkles className="w-4 h-4 mr-1" /> Criar Lote</TabsTrigger>
          <TabsTrigger value="meus"><FolderOpen className="w-4 h-4 mr-1" /> Meus Roteiros</TabsTrigger>
        </TabsList>

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
              duracao={duracao}
              onDuracaoChange={setDuracao}
              canGeneratePermission={canGenerate}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-xl font-bold">{generatedContents.length} Roteiros Gerados</h2>
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
                    onPost={() => navigate(`/cliente/postagem`)}
                    onApprove={() => handleApproveOne(i)}
                    onDelete={() => handleDeleteGenerated(i)}
                    onExpand={() => setExpandedContent(c)}
                    onRecord={() => setRecordingScript({ ...c, plataforma })}
                    approving={approveMutation.isPending}
                    isApproved={c.status === "approved" || (history || []).find((h: { id?: string; status?: string }) => h.id === generatedIds[i])?.status === "approved"}
                    showContext={contextInfo}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="meus" className="mt-4 space-y-4">
          <BatchFolderView history={history || []} navigate={navigate} onDelete={handleDeleteHistory} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmApproveAll} onOpenChange={setConfirmApproveAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar todos os roteiros?</AlertDialogTitle>
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

      <ContentDetailSheet
        open={!!expandedContent}
        onOpenChange={open => !open && setExpandedContent(null)}
        content={expandedContent}
        onCopy={() => { if (expandedContent) copyContent(expandedContent); }}
        onPost={() => setExpandedContent(null)}
      />

      <RecordingTutorial
        open={!!recordingScript}
        onOpenChange={(open) => !open && setRecordingScript(null)}
        format={recordingScript?.plataforma || recordingScript?.format || "reels"}
        script={recordingScript}
      />

      <InsufficientCreditsDialog
        open={showCreditsDialog}
        onOpenChange={setShowCreditsDialog}
        actionLabel="este roteiro"
        creditCost={CREDIT_COST_APPROVE_CONTENT}
      />
    </div>
  );
}
