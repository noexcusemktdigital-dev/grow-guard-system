import { useState, useMemo } from "react";
import {
  FileText, Check, Sparkles, Copy, ArrowLeft, ArrowRight,
  Layers, Video, AlignLeft, BookOpen, Clock, Filter,
  CheckCircle2, RotateCcw, Image, Play, Palette,
  Target, MessageSquare, Hash, Lightbulb, Eye,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useActiveStrategy } from "@/hooks/useMarketingStrategy";
import {
  useContentHistory, useGenerateContent, useApproveContent,
  useApproveBatch, useContentQuota, type ContentItem,
} from "@/hooks/useClienteContentV2";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* ── Constants ── */
const FORMATOS = [
  { value: "carrossel", label: "Carrossel", icon: Layers },
  { value: "post_unico", label: "Post Único", icon: AlignLeft },
  { value: "roteiro_video", label: "Roteiro de Vídeo", icon: Video },
  { value: "story", label: "Story", icon: Image },
  { value: "artigo", label: "Artigo", icon: BookOpen },
  { value: "post_educativo", label: "Post Educativo", icon: Lightbulb },
  { value: "post_autoridade", label: "Post Autoridade", icon: Target },
];

const OBJETIVOS = [
  { value: "educar", label: "Educar" },
  { value: "autoridade", label: "Autoridade" },
  { value: "engajamento", label: "Engajamento" },
  { value: "leads", label: "Gerar Leads" },
  { value: "vender", label: "Vender" },
  { value: "quebrar_objecoes", label: "Quebrar Objeções" },
];

const PLATAFORMAS = ["Instagram", "LinkedIn", "TikTok", "YouTube"];
const TONS = ["educativo", "institucional", "direto", "provocativo"];

const loadingPhrases = [
  "Analisando sua estratégia...",
  "Distribuindo formatos no funil...",
  "Criando conteúdos estratégicos...",
  "Gerando headlines criativas...",
  "Estruturando legendas completas...",
  "Finalizando lote de conteúdos...",
];

export default function ClienteConteudos() {
  const navigate = useNavigate();
  const { data: activeStrategy } = useActiveStrategy();
  const { data: history } = useContentHistory();
  const quota = useContentQuota();
  const generateMutation = useGenerateContent();
  const approveMutation = useApproveContent();
  const approveBatchMutation = useApproveBatch();

  const hasStrategy = !!activeStrategy?.strategy_result;
  const maxContents = quota.max;

  // Wizard state
  const [step, setStep] = useState(1);
  const [quantidade, setQuantidade] = useState(Math.min(maxContents, 8));
  const [formatDist, setFormatDist] = useState<Record<string, number>>({});
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [tema, setTema] = useState("");
  const [plataforma, setPlataforma] = useState("Instagram");
  const [tom, setTom] = useState("");
  const [publico, setPublico] = useState(() => {
    const a = activeStrategy?.answers as any;
    return a?.step_3 || a?.publico || "";
  });

  // Results
  const [generatedContents, setGeneratedContents] = useState<any[]>([]);
  const [generatedIds, setGeneratedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // History
  const [filterFormat, setFilterFormat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewingContent, setViewingContent] = useState<ContentItem | null>(null);

  const totalSteps = 8;
  const formatTotal = Object.values(formatDist).reduce((a, b) => a + b, 0);

  const updateFormatDist = (fmt: string, val: number) => {
    setFormatDist(prev => {
      const next = { ...prev };
      if (val <= 0) { delete next[fmt]; } else { next[fmt] = val; }
      return next;
    });
  };

  const toggleObjetivo = (v: string) => {
    setObjetivos(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  };

  const canAdvance = () => {
    if (step === 1) return quantidade > 0 && quantidade <= quota.remaining;
    if (step === 2) return formatTotal === quantidade;
    if (step === 3) return objetivos.length > 0;
    if (step === 4) return true; // tema is optional
    if (step === 5) return !!plataforma;
    if (step === 6) return true; // tom is optional
    if (step === 7) return true; // publico is optional
    if (step === 8) return true; // review
    return false;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setLoadingIdx(0);
    const interval = setInterval(() => setLoadingIdx(p => (p + 1) % loadingPhrases.length), 3000);

    try {
      const formatos = Object.entries(formatDist).map(([tipo, qtd]) => ({ tipo, qtd }));
      const res = await generateMutation.mutateAsync({
        quantidade,
        formatos,
        objetivos,
        tema: tema || undefined,
        plataforma,
        tom: tom || undefined,
        publico: publico || undefined,
        estrategia: activeStrategy || null,
      });
      setGeneratedContents(res.conteudos);
      setGeneratedIds((res.dbRecords as any[]).map((r: any) => r.id));
      setStep(9); // results screen
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
      toast({ title: "Conteúdo aprovado!", description: "200 créditos debitados." });
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
  };

  const handleApproveAll = async () => {
    try {
      await approveBatchMutation.mutateAsync(generatedIds);
      toast({ title: "Lote aprovado!", description: `${generatedIds.length * 200} créditos debitados.` });
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
  };

  const resetWizard = () => {
    setStep(1);
    setQuantidade(Math.min(maxContents, 8));
    setFormatDist({});
    setObjetivos([]);
    setTema("");
    setPlataforma("Instagram");
    setTom("");
    setGeneratedContents([]);
    setGeneratedIds([]);
    setExpandedCard(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const filteredHistory = useMemo(() => (history || []).filter(c => {
    if (filterFormat !== "all" && c.format !== filterFormat) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return true;
  }), [history, filterFormat, filterStatus]);

  return (
    <div className="space-y-6">
      <PageHeader title="Geração de Conteúdo" subtitle="Gere lotes estratégicos de conteúdos alinhados com seu plano" />

      <div className="flex flex-wrap items-center gap-3">
        {hasStrategy && (
          <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Estratégia conectada
          </Badge>
        )}
        <Badge variant="outline" className="gap-1.5">
          <FileText className="w-3.5 h-3.5" /> {quota.used}/{quota.max} conteúdos este mês
        </Badge>
      </div>

      <Tabs defaultValue="criar">
        <TabsList>
          <TabsTrigger value="criar"><Sparkles className="w-4 h-4 mr-1" /> Criar Lote</TabsTrigger>
          <TabsTrigger value="historico"><Clock className="w-4 h-4 mr-1" /> Histórico</TabsTrigger>
        </TabsList>

        {/* ── TAB: CRIAR ── */}
        <TabsContent value="criar" className="mt-4">
          {quota.remaining <= 0 && step <= 8 && (
            <Card className="border-destructive">
              <CardContent className="py-6 text-center space-y-2">
                <p className="font-semibold text-destructive">Limite de conteúdos atingido este mês</p>
                <p className="text-sm text-muted-foreground">Seu plano permite {quota.max} conteúdos/mês. Faça upgrade para gerar mais.</p>
              </CardContent>
            </Card>
          )}

          {quota.remaining > 0 && step <= 8 && !isGenerating && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Bloco {step} de {totalSteps}</CardTitle>
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

                    {/* Block 1: Quantidade */}
                    {step === 1 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Quantos conteúdos deseja gerar?</h3>
                          <p className="text-sm text-muted-foreground">
                            Seu plano permite <strong>{quota.max}</strong> conteúdos/mês.
                            Você já usou <strong>{quota.used}</strong>. Restam <strong>{quota.remaining}</strong>.
                          </p>
                        </div>
                        <div className="space-y-3">
                          <Slider
                            value={[quantidade]}
                            onValueChange={([v]) => setQuantidade(v)}
                            min={1}
                            max={quota.remaining}
                            step={1}
                          />
                          <div className="text-center text-3xl font-bold text-primary">{quantidade}</div>
                        </div>
                      </div>
                    )}

                    {/* Block 2: Formatos */}
                    {step === 2 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Distribua os formatos</h3>
                          <p className="text-sm text-muted-foreground">
                            Total deve ser igual a {quantidade}. Atual: <strong className={formatTotal === quantidade ? "text-primary" : "text-destructive"}>{formatTotal}</strong>
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {FORMATOS.map(f => {
                            const Icon = f.icon;
                            const val = formatDist[f.value] || 0;
                            return (
                              <div key={f.value} className="flex items-center gap-3 p-3 rounded-xl border">
                                <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium flex-1">{f.label}</span>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateFormatDist(f.value, Math.max(0, val - 1))} disabled={val <= 0}>-</Button>
                                  <span className="w-6 text-center font-bold">{val}</span>
                                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateFormatDist(f.value, val + 1)} disabled={formatTotal >= quantidade}>+</Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Block 3: Objetivos */}
                    {step === 3 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Quais objetivos o lote deve cobrir?</h3>
                          <p className="text-sm text-muted-foreground">Selecione um ou mais. A IA distribui proporcionalmente (40% educação, 30% autoridade, 20% engajamento, 10% oferta).</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {OBJETIVOS.map(o => (
                            <button
                              key={o.value}
                              onClick={() => toggleObjetivo(o.value)}
                              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                                objetivos.includes(o.value)
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

                    {/* Block 4: Tema */}
                    {step === 4 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Algum tema específico?</h3>
                          <p className="text-sm text-muted-foreground">Opcional — se vazio, a IA usa os pilares da sua estratégia</p>
                        </div>
                        <Textarea
                          placeholder="Ex: marketing para médicos, crédito para empresas, implantes dentários..."
                          value={tema}
                          onChange={e => setTema(e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}

                    {/* Block 5: Plataforma */}
                    {step === 5 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Onde os conteúdos serão publicados?</h3>
                          <p className="text-sm text-muted-foreground">Isso influencia o estilo e formato do conteúdo</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {PLATAFORMAS.map(p => (
                            <button
                              key={p}
                              onClick={() => setPlataforma(p)}
                              className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${
                                plataforma === p ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Block 6: Tom */}
                    {step === 6 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Qual tom de comunicação?</h3>
                          <p className="text-sm text-muted-foreground">Opcional — define o estilo da linguagem</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {TONS.map(t => (
                            <button
                              key={t}
                              onClick={() => setTom(tom === t ? "" : t)}
                              className={`px-4 py-2 rounded-full border text-sm font-medium capitalize transition-all ${
                                tom === t ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Block 7: Público */}
                    {step === 7 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Público principal</h3>
                          <p className="text-sm text-muted-foreground">
                            {hasStrategy ? "Pré-preenchido pela estratégia. Edite se desejar." : "Descreva seu público-alvo"}
                          </p>
                        </div>
                        <Input
                          placeholder="Ex: empresários, médicos, donos de pequenas empresas"
                          value={publico}
                          onChange={e => setPublico(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Block 8: Revisão */}
                    {step === 8 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Revisão do lote</h3>
                          <p className="text-sm text-muted-foreground">Confirme antes de gerar</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <ReviewItem label="Quantidade" value={`${quantidade} conteúdos`} />
                          <ReviewItem label="Formatos" value={Object.entries(formatDist).map(([k, v]) => `${v}x ${FORMATOS.find(f => f.value === k)?.label || k}`).join(", ")} />
                          <ReviewItem label="Objetivos" value={objetivos.map(o => OBJETIVOS.find(x => x.value === o)?.label || o).join(", ")} />
                          <ReviewItem label="Plataforma" value={plataforma} />
                          {tema && <ReviewItem label="Tema" value={tema} />}
                          {tom && <ReviewItem label="Tom" value={tom} />}
                          {publico && <ReviewItem label="Público" value={publico} />}
                          <ReviewItem label="Estratégia" value={hasStrategy ? "Conectada ✓" : "Sem estratégia"} />
                        </div>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>

                {/* Nav */}
                <div className="flex justify-between mt-8">
                  <Button variant="ghost" onClick={() => step === 1 ? resetWizard() : setStep(s => s - 1)} disabled={step === 1}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                  {step < 8 ? (
                    <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
                      Próximo <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                      <Sparkles className="w-4 h-4 mr-1" /> Gerar {quantidade} Conteúdos
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
                <p className="text-sm text-muted-foreground">Gerando {quantidade} conteúdos estratégicos...</p>
              </CardContent>
            </Card>
          )}

          {/* Results Grid */}
          {step === 9 && generatedContents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-xl font-bold">{generatedContents.length} Conteúdos Gerados</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetWizard}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Novo Lote
                  </Button>
                  <Button size="sm" onClick={handleApproveAll} disabled={approveBatchMutation.isPending}>
                    <Check className="w-4 h-4 mr-1" /> Aprovar Tudo ({generatedContents.length * 200} créditos)
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedContents.map((c, i) => (
                  <Card key={i} className="overflow-hidden hover:border-primary/40 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-tight">{c.titulo}</CardTitle>
                        <div className="flex gap-1 shrink-0">
                          <Badge variant="secondary" className="text-xs">{c.formato}</Badge>
                          <Badge variant="outline" className="text-xs">{c.objetivo}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Preview */}
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {typeof c.legenda === "string" ? c.legenda.slice(0, 150) + "..." : ""}
                      </p>

                      {/* Expanded detail */}
                      {expandedCard === i && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 border-t pt-3">
                          <ContentMainDisplay content={c.conteudo_principal} format={c.formato} />

                          {c.legenda && (
                            <div className="p-3 rounded-lg bg-muted/50 border">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-primary">Legenda</p>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(c.legenda)}><Copy className="w-3 h-3" /></Button>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{c.legenda}</p>
                            </div>
                          )}

                          {c.headlines?.length > 0 && (
                            <div className="p-3 rounded-lg bg-muted/50 border">
                              <p className="text-xs font-bold text-primary mb-1">Headlines</p>
                              {c.headlines.map((h: string, j: number) => (
                                <p key={j} className="text-sm">{j + 1}. {h}</p>
                              ))}
                            </div>
                          )}

                          {c.hashtags?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {c.hashtags.map((h: string, j: number) => (
                                <Badge key={j} variant="secondary" className="text-xs">#{h.replace(/^#/, "")}</Badge>
                              ))}
                            </div>
                          )}

                          {c.embasamento && (
                            <p className="text-xs text-muted-foreground italic">{c.embasamento}</p>
                          )}
                        </motion.div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button variant="ghost" size="sm" onClick={() => setExpandedCard(expandedCard === i ? null : i)}>
                          <Eye className="w-4 h-4 mr-1" /> {expandedCard === i ? "Fechar" : "Ver mais"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(c.legenda || c.titulo)}>
                          <Copy className="w-4 h-4 mr-1" /> Copiar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate("/cliente/redes-sociais")}>
                          <Palette className="w-4 h-4 mr-1" /> Gerar Arte
                        </Button>
                        {(c.formato || "").toLowerCase().includes("video") && (
                          <Button variant="ghost" size="sm">
                            <Play className="w-4 h-4 mr-1" /> Gerar Vídeo
                          </Button>
                        )}
                        <Button size="sm" onClick={() => handleApproveOne(i)} disabled={approveMutation.isPending}>
                          <Check className="w-4 h-4 mr-1" /> Aprovar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                {FORMATOS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredHistory.map(item => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => setViewingContent(viewingContent?.id === item.id ? null : item)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <div className="flex gap-2 mt-1">
                          {item.format && <Badge variant="secondary" className="text-xs">{item.format}</Badge>}
                          {item.objective && <Badge variant="outline" className="text-xs">{item.objective}</Badge>}
                          <Badge variant={item.status === "approved" ? "default" : "outline"} className="text-xs">
                            {item.status === "approved" ? "Aprovado" : "Pendente"}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>

                    {viewingContent?.id === item.id && item.result && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 border-t pt-3 space-y-2">
                        <ContentMainDisplay content={item.result.conteudo_principal} format={item.format || ""} />
                        {item.result.legenda && <p className="text-sm whitespace-pre-wrap">{item.result.legenda}</p>}
                      </motion.div>
                    )}
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

/* ── Helper Components ── */
function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function ContentMainDisplay({ content, format }: { content: any; format: string }) {
  if (!content) return <p className="text-sm text-muted-foreground">Conteúdo não disponível</p>;

  if (Array.isArray(content)) {
    return (
      <div className="space-y-2">
        {content.map((slide: any, i: number) => (
          <div key={i} className="p-2 rounded-lg bg-muted/50 border">
            <p className="text-xs font-bold text-primary mb-0.5">
              {slide.slide_numero ? `Slide ${slide.slide_numero}` : slide.frame_numero ? `Frame ${slide.frame_numero}` : `${i + 1}`}
            </p>
            {slide.titulo && <p className="font-semibold text-sm">{slide.titulo}</p>}
            <p className="text-sm">{slide.texto || slide.content || slide.acao || JSON.stringify(slide)}</p>
          </div>
        ))}
      </div>
    );
  }

  if (typeof content === "object") {
    if (content.hook) {
      return (
        <div className="space-y-2">
          {[
            { label: "Hook", text: content.hook },
            { label: "Desenvolvimento", text: content.desenvolvimento },
            { label: "Conclusão", text: content.conclusao },
            { label: "CTA", text: content.cta },
            content.texto_tela && { label: "Texto na tela", text: content.texto_tela },
          ].filter(Boolean).map((item: any, i) => (
            <div key={i} className="p-2 rounded-lg bg-muted/50 border">
              <p className="text-xs font-bold text-primary">{item.label}</p>
              <p className="text-sm">{item.text}</p>
            </div>
          ))}
        </div>
      );
    }

    if (content.headline) {
      return (
        <div className="space-y-2">
          <div className="p-2 rounded-lg bg-muted/50 border">
            <p className="text-xs font-bold text-primary">Headline</p>
            <p className="font-semibold text-sm">{content.headline}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 border">
            <p className="text-xs font-bold text-primary">Texto</p>
            <p className="text-sm whitespace-pre-wrap">{content.texto}</p>
          </div>
          {content.dica_pratica && (
            <div className="p-2 rounded-lg bg-muted/50 border">
              <p className="text-xs font-bold text-primary">Dica Prática</p>
              <p className="text-sm">{content.dica_pratica}</p>
            </div>
          )}
          {content.dado_autoridade && (
            <div className="p-2 rounded-lg bg-muted/50 border">
              <p className="text-xs font-bold text-primary">Dado de Autoridade</p>
              <p className="text-sm">{content.dado_autoridade}</p>
            </div>
          )}
          <div className="p-2 rounded-lg bg-muted/50 border">
            <p className="text-xs font-bold text-primary">CTA</p>
            <p className="text-sm">{content.cta}</p>
          </div>
        </div>
      );
    }

    if (content.secoes) {
      return (
        <div className="space-y-2">
          <div className="p-2 rounded-lg bg-muted/50 border">
            <p className="font-semibold text-sm">{content.titulo}</p>
            <p className="text-sm mt-1">{content.introducao}</p>
          </div>
          {(content.secoes || []).map((s: any, i: number) => (
            <div key={i} className="p-2 rounded-lg bg-muted/50 border">
              <p className="text-xs font-bold text-primary">{s.subtitulo}</p>
              <p className="text-sm">{s.texto}</p>
            </div>
          ))}
          <div className="p-2 rounded-lg bg-muted/50 border">
            <p className="text-xs font-bold text-primary">Conclusão</p>
            <p className="text-sm">{content.conclusao}</p>
          </div>
        </div>
      );
    }

    return <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{JSON.stringify(content, null, 2)}</pre>;
  }

  return <p className="text-sm whitespace-pre-wrap">{String(content)}</p>;
}
