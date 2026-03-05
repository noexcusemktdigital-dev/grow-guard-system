import { useState } from "react";
import {
  FileText, Check, Sparkles, Copy, ArrowLeft, ArrowRight,
  Layers, Video, AlignLeft, List, MessageSquare,
  Target, Lightbulb, Hash, BookOpen, Clock, Filter,
  CheckCircle2, RotateCcw, Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useActiveStrategy } from "@/hooks/useMarketingStrategy";
import { useContentHistory, useGenerateContent, useApproveContent, type ContentItem } from "@/hooks/useClienteContentV2";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ── Constants ── */
const FORMATOS = [
  { value: "carrossel", label: "Carrossel", icon: Layers, desc: "Slides para redes sociais" },
  { value: "post_unico", label: "Post Único", icon: AlignLeft, desc: "Imagem + legenda" },
  { value: "roteiro_video", label: "Roteiro de Vídeo", icon: Video, desc: "Hook, desenvolvimento, CTA" },
  { value: "thread", label: "Thread", icon: List, desc: "Sequência de posts conectados" },
  { value: "artigo_curto", label: "Artigo Curto", icon: BookOpen, desc: "Texto para blog ou LinkedIn" },
];

const OBJETIVOS = [
  { value: "gerar_leads", label: "Gerar leads" },
  { value: "educar", label: "Educar" },
  { value: "autoridade", label: "Autoridade" },
  { value: "divulgar_servico", label: "Divulgar serviço" },
  { value: "engajamento", label: "Engajamento" },
];

const CTAS = [
  { value: "comentar", label: "Comentar" },
  { value: "whatsapp", label: "Chamar no WhatsApp" },
  { value: "orcamento", label: "Pedir orçamento" },
  { value: "acessar_link", label: "Acessar link" },
];

const loadingPhrases = [
  "Analisando sua estratégia...",
  "Estruturando o conteúdo...",
  "Criando headlines criativas...",
  "Gerando legenda completa...",
  "Finalizando hashtags...",
];

export default function ClienteConteudos() {
  const { data: activeStrategy } = useActiveStrategy();
  const { data: history } = useContentHistory();
  const generateMutation = useGenerateContent();
  const approveMutation = useApproveContent();

  // Stepper
  const [step, setStep] = useState(1);
  const [tema, setTema] = useState("");
  const [formato, setFormato] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [cta, setCta] = useState("");
  const [ctaCustom, setCtaCustom] = useState("");

  // Result
  const [result, setResult] = useState<any>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);

  // History
  const [viewingContent, setViewingContent] = useState<ContentItem | null>(null);
  const [filterFormat, setFilterFormat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const hasStrategy = !!activeStrategy?.strategy_result;
  const totalSteps = 5;
  const ctaFinal = cta === "custom" ? ctaCustom : cta;

  const canAdvance = () => {
    if (step === 1) return tema.trim().length > 0;
    if (step === 2) return formato !== "";
    if (step === 3) return objetivo !== "";
    if (step === 4) return true; // optional
    if (step === 5) return ctaFinal !== "";
    return false;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setLoadingIdx(0);
    const interval = setInterval(() => setLoadingIdx(p => (p + 1) % loadingPhrases.length), 2500);

    try {
      const res = await generateMutation.mutateAsync({
        tema,
        formato: FORMATOS.find(f => f.value === formato)?.label || formato,
        objetivo: OBJETIVOS.find(o => o.value === objetivo)?.label || objetivo,
        mensagem_principal: mensagem,
        cta: CTAS.find(c => c.value === cta)?.label || ctaCustom || cta,
        estrategia: activeStrategy || null,
      });
      setResult(res.result);
      setResultId((res.dbRecord as any)?.id || null);
      setStep(6); // result screen
      toast({ title: "Conteúdo gerado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar", description: err?.message, variant: "destructive" });
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!resultId) return;
    try {
      await approveMutation.mutateAsync(resultId);
      toast({ title: "Conteúdo aprovado!", description: "200 créditos debitados." });
    } catch (err: any) {
      toast({ title: "Erro ao aprovar", description: err?.message, variant: "destructive" });
    }
  };

  const handleRegenerate = () => {
    setResult(null);
    setResultId(null);
    setStep(5);
  };

  const resetWizard = () => {
    setStep(1);
    setTema("");
    setFormato("");
    setObjetivo("");
    setMensagem("");
    setCta("");
    setCtaCustom("");
    setResult(null);
    setResultId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const filteredHistory = (history || []).filter(c => {
    if (filterFormat !== "all" && c.format !== filterFormat) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return true;
  });

  // ── RENDER ──
  return (
    <div className="space-y-6">
      <PageHeader title="Geração de Conteúdo" subtitle="Crie conteúdos estratégicos alinhados com sua marca" />

      {hasStrategy && (
        <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> Estratégia conectada
        </Badge>
      )}

      <Tabs defaultValue="criar">
        <TabsList>
          <TabsTrigger value="criar"><Sparkles className="w-4 h-4 mr-1" /> Criar Conteúdo</TabsTrigger>
          <TabsTrigger value="historico"><Clock className="w-4 h-4 mr-1" /> Histórico</TabsTrigger>
        </TabsList>

        {/* ── TAB: CRIAR ── */}
        <TabsContent value="criar" className="mt-4">
          {step <= 5 && !isGenerating && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Etapa {step} de {totalSteps}
                  </CardTitle>
                  <div className="flex gap-1">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                      <div key={i} className={`h-2 w-8 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

                    {/* Step 1: Tema */}
                    {step === 1 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Sobre qual tema você deseja criar o conteúdo?</h3>
                          <p className="text-sm text-muted-foreground">Descreva o assunto principal do conteúdo</p>
                        </div>
                        <Input
                          placeholder="Ex: consórcio para empresários, planejamento financeiro, como captar clientes..."
                          value={tema}
                          onChange={e => setTema(e.target.value)}
                          className="text-base"
                        />
                      </div>
                    )}

                    {/* Step 2: Formato */}
                    {step === 2 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Qual formato de conteúdo?</h3>
                          <p className="text-sm text-muted-foreground">Selecione o formato ideal para sua mensagem</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {FORMATOS.map(f => {
                            const Icon = f.icon;
                            const selected = formato === f.value;
                            return (
                              <button
                                key={f.value}
                                onClick={() => setFormato(f.value)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                  selected
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                    : "border-border hover:border-primary/40"
                                }`}
                              >
                                <Icon className={`w-6 h-6 mb-2 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                                <p className="font-medium">{f.label}</p>
                                <p className="text-xs text-muted-foreground">{f.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Objetivo */}
                    {step === 3 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Qual o objetivo deste conteúdo?</h3>
                          <p className="text-sm text-muted-foreground">Selecione o resultado esperado</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {OBJETIVOS.map(o => (
                            <button
                              key={o.value}
                              onClick={() => setObjetivo(o.value)}
                              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                                objetivo === o.value
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/40"
                              }`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 4: Mensagem */}
                    {step === 4 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Qual ideia principal você quer transmitir?</h3>
                          <p className="text-sm text-muted-foreground">Opcional — a IA pode criar com base no tema e estratégia</p>
                        </div>
                        <Textarea
                          placeholder="Ex: empresas não quebram por falta de clientes, mas por falta de processo."
                          value={mensagem}
                          onChange={e => setMensagem(e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}

                    {/* Step 5: CTA */}
                    {step === 5 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Qual ação o leitor deve tomar?</h3>
                          <p className="text-sm text-muted-foreground">Selecione ou escreva um CTA personalizado</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {CTAS.map(c => (
                            <button
                              key={c.value}
                              onClick={() => { setCta(c.value); setCtaCustom(""); }}
                              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                                cta === c.value
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/40"
                              }`}
                            >
                              {c.label}
                            </button>
                          ))}
                          <button
                            onClick={() => setCta("custom")}
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                              cta === "custom"
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            Personalizado
                          </button>
                        </div>
                        {cta === "custom" && (
                          <Input
                            placeholder="Ex: Agende sua consultoria gratuita"
                            value={ctaCustom}
                            onChange={e => setCtaCustom(e.target.value)}
                          />
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Nav buttons */}
                <div className="flex justify-between mt-8">
                  <Button variant="ghost" onClick={() => step === 1 ? resetWizard() : setStep(s => s - 1)} disabled={step === 1}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                  {step < 5 ? (
                    <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
                      Próximo <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={handleGenerate} disabled={!canAdvance() || isGenerating}>
                      <Sparkles className="w-4 h-4 mr-1" /> Gerar Conteúdo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {isGenerating && (
            <Card>
              <CardContent className="py-16 text-center space-y-4">
                <div className="animate-spin mx-auto w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
                <p className="text-lg font-medium animate-pulse">{loadingPhrases[loadingIdx]}</p>
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {step === 6 && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{result.titulo}</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRegenerate}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Regenerar
                  </Button>
                  <Button size="sm" onClick={handleApprove} disabled={approveMutation.isPending}>
                    <Check className="w-4 h-4 mr-1" /> Aprovar (200 créditos)
                  </Button>
                </div>
              </div>

              {/* Conteúdo Principal */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> Conteúdo Principal</CardTitle></CardHeader>
                <CardContent>
                  <ContentMainDisplay content={result.conteudo_principal} format={formato} />
                </CardContent>
              </Card>

              {/* Legenda */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Legenda</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.legenda)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{result.legenda}</p>
                </CardContent>
              </Card>

              {/* Headlines */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Headlines Alternativas</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(result.headlines || []).map((h: string, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <span className="text-sm">{i + 1}. {h}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(h)}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Engajamento + Hashtags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4" /> Pergunta para Engajamento</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm italic">"{result.pergunta_engajamento}"</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Hash className="w-4 h-4" /> Hashtags</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {(result.hashtags || []).map((h: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">#{h.replace(/^#/, "")}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Embasamento */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" /> Embasamento</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{result.embasamento}</p>
                </CardContent>
              </Card>

              <Button variant="outline" onClick={resetWizard} className="mt-4">
                <Sparkles className="w-4 h-4 mr-1" /> Criar novo conteúdo
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ── TAB: HISTÓRICO ── */}
        <TabsContent value="historico" className="mt-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Select value={filterFormat} onValueChange={setFilterFormat}>
              <SelectTrigger className="w-[160px]"><Filter className="w-4 h-4 mr-1" /><SelectValue placeholder="Formato" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os formatos</SelectItem>
                {FORMATOS.map(f => <SelectItem key={f.value} value={f.label}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Nenhum conteúdo gerado ainda.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map(item => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => {
                    setViewingContent(item);
                    setResult(item.result);
                    setResultId(item.id);
                    setFormato(FORMATOS.find(f => f.label === item.format)?.value || "post_unico");
                    setStep(6);
                  }}
                >
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <div className="flex gap-2 mt-1">
                        {item.format && <Badge variant="secondary" className="text-xs">{item.format}</Badge>}
                        <Badge variant={item.status === "approved" ? "default" : "outline"} className="text-xs">
                          {item.status === "approved" ? "Aprovado" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Content Display by Format ── */
function ContentMainDisplay({ content, format }: { content: any; format: string }) {
  if (!content) return <p className="text-sm text-muted-foreground">Conteúdo não disponível</p>;

  // Carrossel: array of slides
  if (Array.isArray(content)) {
    return (
      <div className="space-y-3">
        {content.map((slide: any, i: number) => (
          <div key={i} className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs font-bold text-primary mb-1">Slide {slide.slide_numero || slide.numero || i + 1}</p>
            {slide.titulo && <p className="font-semibold text-sm">{slide.titulo}</p>}
            <p className="text-sm mt-1">{slide.texto || slide.content || JSON.stringify(slide)}</p>
          </div>
        ))}
      </div>
    );
  }

  // Object with specific structure
  if (typeof content === "object") {
    // Video
    if (content.hook) {
      return (
        <div className="space-y-3">
          {[
            { label: "Hook [0-3s]", text: content.hook },
            { label: "Desenvolvimento", text: content.desenvolvimento },
            { label: "Conclusão", text: content.conclusao },
            { label: "CTA", text: content.cta },
            content.texto_tela && { label: "Texto na tela", text: content.texto_tela },
            content.legenda_video && { label: "Legenda do vídeo", text: content.legenda_video },
          ].filter(Boolean).map((item: any, i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs font-bold text-primary mb-1">{item.label}</p>
              <p className="text-sm">{item.text}</p>
            </div>
          ))}
        </div>
      );
    }

    // Post
    if (content.headline) {
      return (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs font-bold text-primary mb-1">Headline</p>
            <p className="font-semibold">{content.headline}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs font-bold text-primary mb-1">Texto Principal</p>
            <p className="text-sm whitespace-pre-wrap">{content.texto}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs font-bold text-primary mb-1">CTA</p>
            <p className="text-sm">{content.cta}</p>
          </div>
        </div>
      );
    }

    // Artigo
    if (content.secoes) {
      return (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs font-bold text-primary mb-1">Título</p>
            <p className="font-semibold">{content.titulo}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs font-bold text-primary mb-1">Introdução</p>
            <p className="text-sm">{content.introducao}</p>
          </div>
          {(content.secoes || []).map((s: any, i: number) => (
            <div key={i} className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs font-bold text-primary mb-1">{s.subtitulo}</p>
              <p className="text-sm">{s.texto}</p>
            </div>
          ))}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs font-bold text-primary mb-1">Conclusão</p>
            <p className="text-sm">{content.conclusao}</p>
          </div>
        </div>
      );
    }

    // Fallback: pretty-print
    return <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{JSON.stringify(content, null, 2)}</pre>;
  }

  // String fallback
  return <p className="text-sm whitespace-pre-wrap">{String(content)}</p>;
}
