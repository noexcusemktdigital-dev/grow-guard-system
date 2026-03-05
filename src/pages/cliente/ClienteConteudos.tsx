import { useState, useMemo, useEffect, useRef } from "react";
import {
  FileText, Check, Sparkles, Copy, ArrowLeft, ArrowRight,
  Layers, Video, AlignLeft, Image, BookOpen, Clock,
  RotateCcw, Target, Lightbulb, FolderOpen, ChevronDown, ChevronRight,
  Download, ExternalLink, Hash,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import {
  useContentHistory, useGenerateContent, useApproveContent,
  useApproveBatch, useContentQuota, type ContentItem,
} from "@/hooks/useClienteContentV2";
import { useStrategyData } from "@/hooks/useStrategyData";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { StrategyBanner } from "@/components/cliente/StrategyBanner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  { value: "educar", label: "Educar o público" },
  { value: "autoridade", label: "Gerar autoridade" },
  { value: "engajamento", label: "Engajar a audiência" },
  { value: "quebrar_objecoes", label: "Quebrar objeções" },
  { value: "promover", label: "Promover produto/serviço" },
  { value: "leads", label: "Gerar leads" },
];

const PLATAFORMAS = ["Instagram", "LinkedIn", "TikTok", "YouTube", "Blog"];

const loadingPhrases = [
  "Analisando sua estratégia...",
  "Distribuindo formatos no funil...",
  "Criando conteúdos estratégicos...",
  "Gerando headlines criativas...",
  "Estruturando legendas completas...",
  "Finalizando lote de conteúdos...",
];

const TOTAL_STEPS = 4;

export default function ClienteConteudos() {
  const navigate = useNavigate();
  const strategy = useStrategyData();
  const { data: history } = useContentHistory();
  const quota = useContentQuota();
  const generateMutation = useGenerateContent();
  const approveMutation = useApproveContent();
  const approveBatchMutation = useApproveBatch();

  const hasStrategy = strategy.hasStrategy;
  const maxContents = quota.max;

  // Wizard state — always 4 steps
  const [step, setStep] = useState(1);
  const [quantidade, setQuantidade] = useState(Math.min(maxContents, 8));
  const [formatDist, setFormatDist] = useState<Record<string, number>>({});
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [tema, setTema] = useState("");
  const [plataforma, setPlataforma] = useState("Instagram");

  // Results
  const [generatedContents, setGeneratedContents] = useState<any[]>([]);
  const [generatedIds, setGeneratedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);

  // Pre-fill platform from strategy
  useEffect(() => {
    if (hasStrategy && strategy.canalPrioritario) {
      setPlataforma(strategy.canalPrioritario);
    }
  }, [hasStrategy, strategy.canalPrioritario]);

  const formatTotal = Object.values(formatDist).reduce((a, b) => a + b, 0);

  const updateFormatDist = (fmt: string, val: number) => {
    setFormatDist(prev => {
      const next = { ...prev };
      if (val <= 0) delete next[fmt]; else next[fmt] = val;
      return next;
    });
  };

  const toggleObjetivo = (v: string) => {
    setObjetivos(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  };

  const canAdvance = () => {
    if (step === 1) return quantidade > 0 && quantidade <= quota.remaining && formatTotal === quantidade;
    if (step === 2) return objetivos.length > 0;
    if (step === 3) return true; // tema optional
    if (step === 4) return !!plataforma;
    return false;
  };

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
      } : null;

      const res = await generateMutation.mutateAsync({
        quantidade,
        formatos,
        objetivos,
        tema: tema || undefined,
        plataforma,
        tom: hasStrategy ? strategy.tomPrincipal || undefined : undefined,
        publico: hasStrategy ? strategy.publicoAlvo || undefined : undefined,
        estrategia: strategyPayload,
      });
      setGeneratedContents(res.conteudos);
      setGeneratedIds((res.dbRecords as any[]).map((r: any) => r.id));
      setStep(TOTAL_STEPS + 1);
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
    setGeneratedContents([]);
    setGeneratedIds([]);
  };

  const copyContent = (c: any) => {
    let text = c.titulo + "\n\n";
    if (c.legenda) text += c.legenda + "\n\n";
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

  const isResultScreen = step === TOTAL_STEPS + 1;

  // ── STEP RENDERERS ──

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Quantos conteúdos e em quais formatos?</h3>
        <p className="text-sm text-muted-foreground">
          Seu plano permite <strong>{quota.max}</strong> conteúdos/mês · Restam <strong className="text-primary">{quota.remaining}</strong>
        </p>
      </div>
      <div className="space-y-3">
        <Slider value={[quantidade]} onValueChange={([v]) => { setQuantidade(v); setFormatDist({}); }} min={1} max={quota.remaining} step={1} />
        <div className="text-center text-4xl font-bold text-primary">{quantidade}</div>
      </div>
      <div>
        <p className="text-sm font-medium mb-3">
          Distribuição de formatos: <strong className={formatTotal === quantidade ? "text-primary" : "text-destructive"}>{formatTotal}/{quantidade}</strong>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FORMATOS.map(f => {
            const Icon = f.icon;
            const val = formatDist[f.value] || 0;
            return (
              <div key={f.value} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
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
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Qual é o objetivo desses conteúdos?</h3>
        <p className="text-sm text-muted-foreground">A IA distribui os objetivos proporcionalmente entre os conteúdos.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OBJETIVOS.map(o => (
          <button key={o.value} onClick={() => toggleObjetivo(o.value)}
            className={`p-4 rounded-xl border-2 text-left text-sm font-medium transition-all ${objetivos.includes(o.value) ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-1">Existe algum tema específico?</h3>
        <p className="text-sm text-muted-foreground">
          {hasStrategy ? "Opcional — se vazio, a IA usa os pilares da sua estratégia." : "Opcional — descreva um tema ou assunto específico."}
        </p>
      </div>
      {hasStrategy && strategy.pilares.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Seus pilares estratégicos:</p>
          <div className="flex flex-wrap gap-2">
            {strategy.pilares.map((p: any, i: number) => {
              const name = typeof p === "string" ? p : p.nome || p.pilar || p.name || JSON.stringify(p);
              return (
                <button key={i} onClick={() => setTema(name)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${tema === name ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}>
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <Textarea
        placeholder="Ex: marketing para médicos, crédito para empresas, implantes dentários..."
        value={tema}
        onChange={e => setTema(e.target.value)}
        rows={3}
      />
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Onde esses conteúdos serão publicados?</h3>
        <p className="text-sm text-muted-foreground">Isso ajusta o estilo e formato do conteúdo.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PLATAFORMAS.map(p => (
          <button key={p} onClick={() => setPlataforma(p)}
            className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${plataforma === p ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Review summary */}
      <div className="p-4 rounded-xl bg-muted/30 border space-y-2">
        <p className="text-sm font-semibold">Resumo do lote</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>📊 {quantidade} conteúdos</span>
          <span>📱 {plataforma}</span>
          <span>🎯 {objetivos.map(o => OBJETIVOS.find(x => x.value === o)?.label).join(", ")}</span>
          {tema && <span>📝 {tema}</span>}
        </div>
        {hasStrategy && (
          <div className="pt-2 border-t mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span className="text-primary font-medium col-span-2">✓ Dados importados da estratégia:</span>
            {strategy.personaName && <span>👤 {strategy.personaName}</span>}
            {strategy.tomPrincipal && <span>🎯 Tom: {strategy.tomPrincipal}</span>}
            {strategy.pilares.length > 0 && <span>📐 {strategy.pilares.length} pilares</span>}
            {strategy.dores.length > 0 && <span>💢 {strategy.dores.length} dores</span>}
          </div>
        )}
      </div>
    </div>
  );

  const renderSteps = [renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div className="space-y-6">
      <PageHeader title="Geração de Conteúdo" subtitle="Gere lotes estratégicos de conteúdos alinhados com seu plano" />

      <StrategyBanner toolName="a geração de conteúdo" dataUsed="Pilares, ICP e tom de voz" />

      <div className="flex flex-wrap items-center gap-3">
        {hasStrategy && (
          <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
            <Check className="w-3.5 h-3.5" /> Estratégia conectada
          </Badge>
        )}
        <Badge variant="outline" className="gap-1.5">
          <FileText className="w-3.5 h-3.5" /> {quota.used}/{quota.max} conteúdos este mês
        </Badge>
      </div>

      <Tabs defaultValue="criar">
        <TabsList>
          <TabsTrigger value="criar"><Sparkles className="w-4 h-4 mr-1" /> Criar Lote</TabsTrigger>
          <TabsTrigger value="meus"><FolderOpen className="w-4 h-4 mr-1" /> Meus Conteúdos</TabsTrigger>
        </TabsList>

        {/* ── TAB: CRIAR ── */}
        <TabsContent value="criar" className="mt-4">
          {quota.remaining <= 0 && step <= TOTAL_STEPS && (
            <Card className="border-destructive">
              <CardContent className="py-6 text-center space-y-2">
                <p className="font-semibold text-destructive">Limite de conteúdos atingido este mês</p>
                <p className="text-sm text-muted-foreground">Seu plano permite {quota.max} conteúdos/mês. Faça upgrade para gerar mais.</p>
              </CardContent>
            </Card>
          )}

          {quota.remaining > 0 && step <= TOTAL_STEPS && !isGenerating && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Passo {step} de {TOTAL_STEPS}</CardTitle>
                  <div className="flex gap-1">
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                      <div key={i} className={`h-2 w-8 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                    {renderSteps[step - 1]()}
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-between mt-8">
                  <Button variant="ghost" onClick={() => step === 1 ? resetWizard() : setStep(s => s - 1)} disabled={step === 1}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                  {step < TOTAL_STEPS ? (
                    <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
                      Próximo <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={handleGenerate} disabled={!canAdvance()}>
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

          {/* Results */}
          {isResultScreen && generatedContents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-xl font-bold">{generatedContents.length} Conteúdos Gerados</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetWizard}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Novo Lote
                  </Button>
                  <Button size="sm" onClick={handleApproveAll} disabled={approveBatchMutation.isPending}>
                    <Check className="w-4 h-4 mr-1" /> Aprovar Tudo
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
                    approving={approveMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── TAB: MEUS CONTEÚDOS (pastas de lotes) ── */}
        <TabsContent value="meus" className="mt-4 space-y-4">
          <BatchFolderView history={history || []} navigate={navigate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VISUAL CONTENT CARD — renders content in social-media style
   ══════════════════════════════════════════════════════════════ */

function ContentVisualCard({ content: c, index, onCopy, onPdf, onPost, onApprove, approving }: {
  content: any; index: number;
  onCopy: () => void; onPdf: () => void; onPost: () => void; onApprove: () => void; approving: boolean;
}) {
  const formato = (c.formato || "").toLowerCase();

  return (
    <Card id={`content-card-${index}`} className="overflow-hidden group hover:shadow-lg transition-shadow">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Badge className="text-xs">{c.formato}</Badge>
        <Badge variant="outline" className="text-xs">{c.objetivo}</Badge>
      </div>

      <CardContent className="space-y-3 pt-0">
        {/* Title */}
        <h3 className="text-lg font-bold leading-tight">{c.titulo}</h3>

        {/* Content body — format-specific visual */}
        {formato.includes("carrossel") && <CarrosselVisual content={c.conteudo_principal} />}
        {formato.includes("post") && <PostVisual content={c.conteudo_principal} />}
        {(formato.includes("video") || formato.includes("vídeo") || formato.includes("roteiro")) && <VideoVisual content={c.conteudo_principal} />}
        {formato.includes("story") && <StoryVisual content={c.conteudo_principal} />}
        {formato.includes("artigo") && <ArtigoVisual content={c.conteudo_principal} />}
        {!formato.includes("carrossel") && !formato.includes("post") && !formato.includes("video") && !formato.includes("vídeo") && !formato.includes("roteiro") && !formato.includes("story") && !formato.includes("artigo") && (
          <GenericVisual content={c.conteudo_principal} />
        )}

        {/* Caption */}
        {c.legenda && (
          <div className="rounded-lg bg-muted/40 p-3 text-sm whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
            {c.legenda}
          </div>
        )}

        {/* Hashtags */}
        {c.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {c.hashtags.map((h: string, j: number) => (
              <span key={j} className="text-xs text-primary font-medium">#{h.replace(/^#/, "")}</span>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onCopy}>
            <Copy className="w-4 h-4 mr-1" /> Copiar
          </Button>
          <Button variant="outline" size="sm" onClick={onPdf}>
            <Download className="w-4 h-4 mr-1" /> Baixar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onPost}>
            <ExternalLink className="w-4 h-4 mr-1" /> Gerar Postagem
          </Button>
          <Button size="sm" onClick={onApprove} disabled={approving} className="ml-auto">
            <Check className="w-4 h-4 mr-1" /> Aprovar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Carrossel: slides empilhados ── */
function CarrosselVisual({ content }: { content: any }) {
  if (!Array.isArray(content)) return <GenericVisual content={content} />;
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
      {content.map((slide: any, i: number) => (
        <div key={i} className="flex-none w-48 snap-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border p-4 space-y-1">
          <span className="text-xs font-bold text-primary/60">{i + 1}/{content.length}</span>
          {slide.titulo && <p className="font-bold text-sm leading-tight">{slide.titulo}</p>}
          <p className="text-xs text-muted-foreground leading-snug line-clamp-4">{slide.texto || slide.content || ""}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Post Único / Educativo / Autoridade ── */
function PostVisual({ content }: { content: any }) {
  if (!content || typeof content !== "object") return <GenericVisual content={content} />;
  return (
    <div className="rounded-xl bg-gradient-to-br from-primary/8 to-transparent border p-5 space-y-3">
      {content.headline && (
        <p className="text-xl font-extrabold leading-tight">{content.headline}</p>
      )}
      {content.texto && (
        <p className="text-sm text-muted-foreground leading-relaxed">{content.texto}</p>
      )}
      {content.dica_pratica && (
        <div className="rounded-lg bg-primary/10 p-3">
          <p className="text-xs font-semibold text-primary mb-1">💡 Dica Prática</p>
          <p className="text-sm">{content.dica_pratica}</p>
        </div>
      )}
      {content.dado_autoridade && (
        <div className="rounded-lg bg-primary/10 p-3">
          <p className="text-xs font-semibold text-primary mb-1">📊 Dado de Autoridade</p>
          <p className="text-sm">{content.dado_autoridade}</p>
        </div>
      )}
      {content.cta && (
        <Badge className="text-xs">{content.cta}</Badge>
      )}
    </div>
  );
}

/* ── Vídeo: hook em destaque + roteiro colapsado ── */
function VideoVisual({ content }: { content: any }) {
  if (!content || typeof content !== "object") return <GenericVisual content={content} />;
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-gradient-to-r from-primary/15 to-primary/5 border-2 border-primary/20 p-5 text-center">
        <p className="text-xs font-bold text-primary mb-1">🎬 HOOK</p>
        <p className="text-lg font-extrabold leading-tight">"{content.hook}"</p>
      </div>
      <div className="space-y-2">
        {content.desenvolvimento && (
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Desenvolvimento</p>
            <p className="text-sm">{content.desenvolvimento}</p>
          </div>
        )}
        {content.conclusao && (
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Conclusão</p>
            <p className="text-sm">{content.conclusao}</p>
          </div>
        )}
        {content.texto_tela && (
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Texto na tela</p>
            <p className="text-sm">{content.texto_tela}</p>
          </div>
        )}
      </div>
      {content.cta && (
        <Badge className="text-xs">{content.cta}</Badge>
      )}
    </div>
  );
}

/* ── Story: frames horizontais ── */
function StoryVisual({ content }: { content: any }) {
  if (!Array.isArray(content)) return <GenericVisual content={content} />;
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
      {content.map((frame: any, i: number) => (
        <div key={i} className="flex-none w-32 h-56 snap-center rounded-2xl bg-gradient-to-b from-primary/15 to-primary/5 border p-3 flex flex-col justify-between">
          <span className="text-xs font-bold text-primary/60">{i + 1}</span>
          <div>
            <p className="text-xs font-bold leading-tight">{frame.texto || frame.content || ""}</p>
            {frame.acao && <p className="text-[10px] text-muted-foreground mt-1">{frame.acao}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Artigo ── */
function ArtigoVisual({ content }: { content: any }) {
  if (!content || typeof content !== "object") return <GenericVisual content={content} />;
  return (
    <div className="rounded-xl border p-5 space-y-3">
      {content.titulo && <p className="text-xl font-extrabold">{content.titulo}</p>}
      {content.introducao && <p className="text-sm text-muted-foreground italic">{content.introducao}</p>}
      {(content.secoes || []).map((s: any, i: number) => (
        <div key={i}>
          <p className="font-semibold text-sm text-primary">{s.subtitulo}</p>
          <p className="text-sm text-muted-foreground">{s.texto}</p>
        </div>
      ))}
      {content.conclusao && (
        <div className="border-t pt-3">
          <p className="text-sm font-medium">{content.conclusao}</p>
        </div>
      )}
    </div>
  );
}

/* ── Fallback ── */
function GenericVisual({ content }: { content: any }) {
  if (!content) return <p className="text-sm text-muted-foreground">Conteúdo não disponível</p>;
  if (typeof content === "string") return <p className="text-sm whitespace-pre-wrap">{content}</p>;
  return <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-3 rounded-lg overflow-auto max-h-48">{JSON.stringify(content, null, 2)}</pre>;
}

/* ══════════════════════════════════════════════════════════════
   BATCH FOLDER VIEW — groups history by creation date (batches)
   ══════════════════════════════════════════════════════════════ */

function BatchFolderView({ history, navigate }: { history: ContentItem[]; navigate: (path: string) => void }) {
  // Group by batch (items created within 2 minutes of each other)
  const batches = useMemo(() => {
    if (!history.length) return [];
    const sorted = [...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const groups: { date: string; items: ContentItem[] }[] = [];
    let current: ContentItem[] = [];
    let anchor = new Date(sorted[0].created_at).getTime();

    for (const item of sorted) {
      const t = new Date(item.created_at).getTime();
      if (Math.abs(anchor - t) > 2 * 60 * 1000) {
        if (current.length) groups.push({ date: current[0].created_at, items: current });
        current = [item];
        anchor = t;
      } else {
        current.push(item);
      }
    }
    if (current.length) groups.push({ date: current[0].created_at, items: current });
    return groups;
  }, [history]);

  if (batches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum conteúdo gerado ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {batches.map((batch, bi) => (
        <BatchFolder key={bi} batch={batch} navigate={navigate} />
      ))}
    </div>
  );
}

function BatchFolder({ batch, navigate }: { batch: { date: string; items: ContentItem[] }; navigate: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  const dateStr = new Date(batch.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const copyItem = (item: ContentItem) => {
    const r = item.result as any;
    let text = item.title + "\n\n";
    if (r?.legenda) text += r.legenda + "\n\n";
    if (r?.hashtags?.length) text += r.hashtags.map((h: string) => `#${h.replace(/^#/, "")}`).join(" ");
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors text-left">
          {open ? <ChevronDown className="w-5 h-5 text-primary shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}
          <FolderOpen className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-sm">Lote {dateStr}</span>
            <span className="text-xs text-muted-foreground ml-2">— {batch.items.length} conteúdo{batch.items.length > 1 ? "s" : ""}</span>
          </div>
          <div className="flex gap-1">
            {[...new Set(batch.items.map(i => i.format))].filter(Boolean).map(f => (
              <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
            ))}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 pl-8">
          {batch.items.map(item => {
            const r = item.result as any;
            if (!r) return null;
            const formato = (item.format || r.formato || "").toLowerCase();

            return (
              <Card key={item.id} className="overflow-hidden">
                <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                  {item.format && <Badge className="text-[10px]">{item.format}</Badge>}
                  {item.objective && <Badge variant="outline" className="text-[10px]">{item.objective}</Badge>}
                  <Badge variant={item.status === "approved" ? "default" : "secondary"} className="text-[10px] ml-auto">
                    {item.status === "approved" ? "Aprovado" : "Pendente"}
                  </Badge>
                </div>
                <CardContent className="space-y-2 pt-1">
                  <h4 className="font-bold text-sm">{item.title}</h4>

                  {/* Compact visual */}
                  {formato.includes("carrossel") && Array.isArray(r.conteudo_principal) && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {(r.conteudo_principal as any[]).slice(0, 4).map((s: any, si: number) => (
                        <div key={si} className="flex-none w-28 rounded-lg bg-primary/5 border p-2">
                          <span className="text-[10px] font-bold text-primary/50">{si + 1}</span>
                          {s.titulo && <p className="text-[11px] font-bold leading-tight">{s.titulo}</p>}
                        </div>
                      ))}
                      {(r.conteudo_principal as any[]).length > 4 && (
                        <div className="flex-none w-28 rounded-lg bg-muted/50 border p-2 flex items-center justify-center text-xs text-muted-foreground">
                          +{(r.conteudo_principal as any[]).length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {(formato.includes("post") || formato.includes("educativo") || formato.includes("autoridade")) && r.conteudo_principal?.headline && (
                    <p className="text-sm font-extrabold">{r.conteudo_principal.headline}</p>
                  )}

                  {(formato.includes("video") || formato.includes("vídeo") || formato.includes("roteiro")) && r.conteudo_principal?.hook && (
                    <div className="rounded-lg bg-primary/10 p-2 text-center">
                      <p className="text-xs font-bold">🎬 "{r.conteudo_principal.hook}"</p>
                    </div>
                  )}

                  {r.legenda && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.legenda}</p>
                  )}

                  <div className="flex gap-2 pt-1 border-t">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => copyItem(item)}>
                      <Copy className="w-3 h-3 mr-1" /> Copiar
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(`/cliente/redes-sociais?content_id=${item.id}`)}>
                      <ExternalLink className="w-3 h-3 mr-1" /> Postagem
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
