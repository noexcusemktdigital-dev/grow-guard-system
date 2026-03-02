import { useState } from "react";
import {
  Sparkles, Pencil, ArrowRight, ArrowLeft, Loader2, RefreshCw, Save,
  Crosshair, ShieldQuestion, Handshake, Target, Ban, Info
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCrmProducts } from "@/hooks/useCrmProducts";
import { useCrmFunnels } from "@/hooks/useCrmFunnels";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const funnelStages = [
  { key: "prospeccao", label: "Prospecção", icon: Crosshair, color: "text-blue-400" },
  { key: "diagnostico", label: "Diagnóstico", icon: ShieldQuestion, color: "text-cyan-400" },
  { key: "negociacao", label: "Negociação", icon: Handshake, color: "text-purple-400" },
  { key: "fechamento", label: "Fechamento", icon: Target, color: "text-emerald-400" },
  { key: "objecoes", label: "Quebra de Objeções", icon: Ban, color: "text-amber-400" },
];

const briefingQuestions: Record<string, { key: string; label: string; placeholder: string }[]> = {
  prospeccao: [
    { key: "Canal principal", label: "Qual o canal principal de prospecção?", placeholder: "Ex: WhatsApp, ligação, email, LinkedIn" },
    { key: "Dor do cliente", label: "Qual a principal dor do cliente?", placeholder: "Ex: Perda de clientes, baixa conversão, processo manual" },
    { key: "Tipo de contato", label: "Como é o primeiro contato?", placeholder: "Ex: Cold call, indicação, inbound" },
  ],
  diagnostico: [
    { key: "Perguntas de qualificação", label: "Quais perguntas você faz para qualificar?", placeholder: "Ex: Orçamento, necessidade, prazo, decisor" },
    { key: "Critérios de qualificação", label: "Qual framework de qualificação?", placeholder: "Ex: BANT, SPIN, GPCT, MEDDIC" },
    { key: "Tempo médio", label: "Quanto tempo dura uma reunião de diagnóstico?", placeholder: "Ex: 30min, 1h" },
  ],
  negociacao: [
    { key: "Diferencial competitivo", label: "Qual o diferencial competitivo?", placeholder: "Ex: Atendimento, tecnologia, preço, exclusividade" },
    { key: "Faixa de preço", label: "Qual a faixa de preço?", placeholder: "Ex: R$500-2000/mês, ticket médio de R$5000" },
    { key: "Política de desconto", label: "Existe política de desconto?", placeholder: "Ex: Até 10% para pagamento anual" },
  ],
  fechamento: [
    { key: "Urgência", label: "Qual a urgência típica de fechamento?", placeholder: "Ex: 7 dias, 30 dias, sem prazo definido" },
    { key: "Período de teste", label: "Oferece período de teste?", placeholder: "Ex: 7 dias grátis, demonstração, POC" },
    { key: "Formalização", label: "Como é a formalização?", placeholder: "Ex: Contrato digital, proposta + aceite, pedido de compra" },
  ],
  objecoes: [
    { key: "Objeções comuns", label: "Quais as 3 objeções mais comuns?", placeholder: "Ex: Preço alto, já uso outro, preciso pensar" },
    { key: "Concorrente principal", label: "Quem é o concorrente principal?", placeholder: "Ex: Empresa X, solução Y, fazer internamente" },
    { key: "Argumento matador", label: "Qual seu melhor argumento contra objeções?", placeholder: "Ex: ROI comprovado, cases de sucesso, garantia" },
  ],
};

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

  // Manual mode fields
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");

  // Auto context
  const { data: products } = useCrmProducts();
  const { data: funnels } = useCrmFunnels();

  const autoContext = {
    products: products?.map(p => ({ name: p.name, price: p.price })) || [],
    segment: "",
    channels: [] as string[],
    teamSize: "",
  };

  const hasContext = autoContext.products.length > 0 || autoContext.segment || autoContext.channels.length > 0;

  const reset = () => {
    setStep(1);
    setMode("ai");
    setStage(initialStage || "prospeccao");
    setBriefing({});
    setGeneratedContent("");
    setGeneratedTitle("");
    setGeneratedTags([]);
    setManualTitle("");
    setManualContent("");
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-script", {
        body: { stage, briefing, context: autoContext, mode: "generate" },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }

      setGeneratedContent(data.content);
      setGeneratedTitle(data.title || "");
      setGeneratedTags(data.tags || []);
      setStep(3);
    } catch (e: any) {
      toast({ title: "Erro ao gerar script", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (mode === "manual") {
      if (!manualTitle.trim()) return;
      onSave({ title: manualTitle, content: manualContent, category: stage, tags: [] });
    } else {
      onSave({
        title: generatedTitle,
        content: generatedContent,
        category: stage,
        tags: generatedTags,
      });
    }
    handleOpenChange(false);
  };

  const selectedStage = funnelStages.find(s => s.key === stage)!;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 1 && "Novo Script"}
            {step === 2 && (
              <>
                <selectedStage.icon className={`w-5 h-5 ${selectedStage.color}`} />
                {selectedStage.label} — Briefing
              </>
            )}
            {step === 3 && (
              <>
                <Sparkles className="w-5 h-5 text-primary" />
                Script Gerado
              </>
            )}
          </DialogTitle>

          {/* Step indicator */}
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
                  <span className="text-sm font-semibold">Gerar com IA</span>
                  <span className="text-[10px] text-muted-foreground">
                    Responda algumas perguntas e a IA cria o script
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
          <div className="space-y-5">
            {/* Auto context preview */}
            {hasContext && (
              <div className="p-3 rounded-lg bg-muted/50 border space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Info className="w-3 h-3" />
                  Contexto automático do Plano de Vendas
                </div>
                {autoContext.segment && (
                  <p className="text-xs">Segmento: <span className="font-medium">{autoContext.segment}</span></p>
                )}
                {autoContext.products.length > 0 && (
                  <p className="text-xs">
                    Produtos: {autoContext.products.map(p => p.name).join(", ")}
                  </p>
                )}
                {autoContext.channels.length > 0 && (
                  <p className="text-xs">
                    Canais: {autoContext.channels.join(", ")}
                  </p>
                )}
                {autoContext.teamSize && (
                  <p className="text-xs">
                    Equipe: {autoContext.teamSize}
                  </p>
                )}
              </div>
            )}

            {/* Briefing questions */}
            <div className="space-y-3">
              {briefingQuestions[stage]?.map(q => (
                <div key={q.key}>
                  <Label className="text-xs">{q.label}</Label>
                  <Input
                    className="mt-1"
                    placeholder={q.placeholder}
                    value={briefing[q.key] || ""}
                    onChange={e => setBriefing(prev => ({ ...prev, [q.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            {/* Extra context fields if no auto-context */}
            {!hasContext && (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-[10px] text-muted-foreground">
                  Preencha o Plano de Vendas para contexto automático, ou informe abaixo:
                </p>
                <div>
                  <Label className="text-xs">Segmento do negócio</Label>
                  <Input
                    className="mt-1"
                    placeholder="Ex: Tecnologia SaaS, Consultoria, E-commerce"
                    value={briefing["Segmento"] || ""}
                    onChange={e => setBriefing(prev => ({ ...prev, Segmento: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Produto/Serviço principal</Label>
                  <Input
                    className="mt-1"
                    placeholder="Ex: Software de gestão, consultoria financeira"
                    value={briefing["Produto"] || ""}
                    onChange={e => setBriefing(prev => ({ ...prev, Produto: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating} className="gap-1">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Gerar Script
                  </>
                )}
              </Button>
            </div>
          </div>
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
                  <Button variant="outline" onClick={handleGenerate} disabled={isGenerating} className="gap-1">
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
  );
}
