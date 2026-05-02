import { useState, useEffect } from "react";
import {
  Sparkles, Pencil, ArrowRight, ArrowLeft, RefreshCw, Save,
  GraduationCap, ChevronDown, ChevronUp
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { toast } from "@/hooks/use-toast";
import { InsufficientCreditsDialog, isInsufficientCreditsError } from "@/components/cliente/InsufficientCreditsDialog";
import { funnelStages, stageTutorials } from "./ScriptGeneratorData";
import { ScriptGeneratorBriefingStep } from "./ScriptGeneratorBriefingStep";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (script: { title: string; content: string; category: string; tags: string[] }) => void;
  initialStage?: string;
}

export default function ScriptGeneratorDialog({ open, onOpenChange, onSave, initialStage }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [stage, setStage] = useState(initialStage || "prospeccao");
  const [briefing, setBriefing] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [referenceLinks, setReferenceLinks] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState("");

  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");

  const [lastAutoContext, setLastAutoContext] = useState<Record<string, unknown> | null>(null);
  const [lastOrgId, setLastOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setMode("ai");
      setStage(initialStage || "prospeccao");
      setBriefing({});
      setGeneratedContent("");
      setGeneratedTitle("");
      setGeneratedTags([]);
      setShowTutorial(true);
      setReferenceLinks([]);
      setAdditionalContext("");
      setManualTitle("");
      setManualContent("");
      setLastAutoContext(null);
      setLastOrgId(null);
    }
  }, [open, initialStage]);

  const handleGenerate = async (autoContext: Record<string, unknown>, orgId: string | null) => {
    setLastAutoContext(autoContext);
    setLastOrgId(orgId);
    setIsGenerating(true);
    try {
      const { data, error } = await invokeEdge("generate-script", {
        body: {
          stage,
          briefing,
          context: autoContext,
          mode: "generate",
          referenceLinks,
          additionalContext,
          organization_id: orgId,
        },
      });

      if (error) throw await extractEdgeFunctionError(error);
      if (data?.error) {
        if (data.error.includes("INSUFFICIENT_CREDITS") || data.error.includes("Créditos insuficientes")) {
          setShowCreditsDialog(true);
          return;
        }
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }

      setGeneratedContent(data.content);
      setGeneratedTitle(data.title || "");
      setGeneratedTags(data.tags || []);
      setStep(3);
    } catch (e: unknown) {
      if (isInsufficientCreditsError(e)) {
        setShowCreditsDialog(true);
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        const isFetchError = msg.includes("Failed to send") || msg.includes("FunctionsRelayError") || msg.includes("fetch");
        toast({ title: "Erro ao gerar script", description: isFetchError ? "Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente." : msg, variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (mode === "manual") {
      if (!manualTitle.trim()) return;
      onSave({ title: manualTitle, content: manualContent, category: stage, tags: [] });
    } else {
      onSave({ title: generatedTitle, content: generatedContent, category: stage, tags: generatedTags });
    }
    onOpenChange(false);
  };

  const selectedStageData = funnelStages.find(s => s.key === stage)!;
  const tutorial = stageTutorials[stage];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {step === 1 && "Novo Script"}
              {step === 2 && (
                <>
                  <selectedStageData.icon className={`w-5 h-5 ${selectedStageData.color}`} />
                  {selectedStageData.label} — Briefing
                </>
              )}
              {step === 3 && (
                <>
                  <Sparkles className="w-5 h-5 text-primary" />
                  Script Gerado
                </>
              )}
            </DialogTitle>

            {mode === "ai" && (
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3].map(s => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      s <= step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            )}
          </DialogHeader>

          {/* STEP 1: Choose stage + mode */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Label className="text-xs font-medium">Etapa do Funil</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {funnelStages.map(s => (
                    <button
                      key={s.key}
                      onClick={() => setStage(s.key)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-all ${
                        stage === s.key
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                      <span className="font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Collapsible open={showTutorial} onOpenChange={setShowTutorial}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-2 w-full p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-left">
                    <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium flex-1">{tutorial.title}</span>
                    {showTutorial ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-4 rounded-lg border bg-muted/30 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">🎯 Objetivo</p>
                      <p className="text-xs text-muted-foreground">{tutorial.objetivo}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">💡 Dicas Essenciais</p>
                      <ul className="space-y-1">
                        {tutorial.dicas.map((d, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span> {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">📝 Exemplos de Abertura</p>
                      {tutorial.exemplos.map((ex, i) => (
                        <div key={i} className="p-2 bg-background/50 rounded border text-[10px] font-mono mb-1.5 leading-relaxed">
                          {ex}
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div>
                <Label className="text-xs font-medium">Como deseja criar?</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => setMode("ai")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all ${
                      mode === "ai"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Sparkles className="w-6 h-6 text-primary" />
                    <span className="text-sm font-semibold">Gerar com a nossa IA</span>
                    <span className="text-[10px] text-muted-foreground">
                      Responda perguntas e a nossa IA cria o script com base no seu negócio
                    </span>
                  </button>
                  <button
                    onClick={() => setMode("manual")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all ${
                      mode === "manual"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Pencil className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm font-semibold">Criar manual</span>
                    <span className="text-[10px] text-muted-foreground">
                      Escreva o conteúdo do script
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(mode === "ai" ? 2 : 3)} className="gap-1">
                  {mode === "ai" ? "Próximo" : "Criar"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Briefing (AI mode only) */}
          {step === 2 && mode === "ai" && (
            <ScriptGeneratorBriefingStep
              stage={stage}
              briefing={briefing}
              setBriefing={setBriefing}
              referenceLinks={referenceLinks}
              setReferenceLinks={setReferenceLinks}
              additionalContext={additionalContext}
              setAdditionalContext={setAdditionalContext}
              isGenerating={isGenerating}
              onBack={() => setStep(1)}
              onGenerate={handleGenerate}
            />
          )}

          {/* STEP 3: Preview / Manual edit */}
          {step === 3 && (
            <div className="space-y-4">
              {mode === "manual" ? (
                <>
                  <div>
                    <Label className="text-xs">Título *</Label>
                    <Input
                      value={manualTitle}
                      onChange={e => setManualTitle(e.target.value)}
                      placeholder="Ex: Script de prospecção WhatsApp"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Conteúdo</Label>
                    <Textarea
                      value={manualContent}
                      onChange={e => setManualContent(e.target.value)}
                      rows={10}
                      className="mt-1 font-mono text-sm"
                      placeholder="Digite o script..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-xs">Título</Label>
                    <Input
                      value={generatedTitle}
                      onChange={e => setGeneratedTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  {generatedTags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {generatedTags.map(t => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Conteúdo</Label>
                    <Textarea
                      value={generatedContent}
                      onChange={e => setGeneratedContent(e.target.value)}
                      rows={14}
                      className="mt-1 font-mono text-xs leading-relaxed"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(mode === "ai" ? 2 : 1)} className="gap-1">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </Button>
                <div className="flex gap-2">
                  {mode === "ai" && (
                    <Button variant="outline" onClick={() => handleGenerate(lastAutoContext || {}, lastOrgId)} disabled={isGenerating} className="gap-1">
                      <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                      Regenerar
                    </Button>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={mode === "manual" ? !manualTitle.trim() : !generatedContent.trim()}
                    className="gap-1"
                  >
                    <Save className="w-4 h-4" /> Salvar Script
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <InsufficientCreditsDialog
        open={showCreditsDialog}
        onOpenChange={setShowCreditsDialog}
        actionLabel="gerar este script"
        creditCost={20}
      />
    </>
  );
}
