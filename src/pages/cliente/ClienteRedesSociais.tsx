import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { usePostHistory, useGeneratePost, useApprovePost, PostItem } from "@/hooks/useClientePosts";
import { useVisualIdentity } from "@/hooks/useVisualIdentity";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import {
  Share2, Plus, ArrowLeft, Image, Video, Check, RefreshCw, Download,
  Sparkles, Loader2, Upload, X, Clock, Eye, Type, Film, Smartphone,
  Monitor, LayoutGrid, Square, RectangleVertical, Palette, Box
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { StrategyBanner } from "@/components/cliente/StrategyBanner";

type MainView = "history" | "wizard";
type PostType = "art" | "video";

/* ── Art constants ── */
const ART_FORMATS = [
  { value: "feed", label: "1:1", desc: "Feed padrão", icon: Square, ratio: "1080×1080" },
  { value: "portrait", label: "4:5", desc: "Feed otimizado", icon: RectangleVertical, ratio: "1080×1350" },
  { value: "story", label: "9:16", desc: "Story / Reels", icon: Smartphone, ratio: "1080×1920" },
];

const POST_TYPES = [
  { value: "post_unico", label: "Post único", desc: "Imagem única para feed" },
  { value: "capa_carrossel", label: "Capa carrossel", desc: "Primeira imagem do carrossel" },
  { value: "slide_carrossel", label: "Slide carrossel", desc: "Slide interno do carrossel" },
  { value: "story", label: "Story", desc: "Arte para story" },
];

const ELEMENT_SUGGESTIONS = [
  "Notebook com gráfico", "Smartphone", "Prédio corporativo", "Casa moderna",
  "Pessoa sorrindo", "Mesa de trabalho", "Xícara de café", "Chave de carro",
];

/* ── Video constants ── */
const VIDEO_FORMATS = [
  { value: "story", label: "Reels / TikTok", desc: "9:16 vertical", icon: Smartphone },
  { value: "feed", label: "Feed", desc: "1:1 quadrado", icon: Square },
  { value: "banner", label: "YouTube", desc: "16:9 horizontal", icon: Monitor },
];

const VIDEO_DURATIONS = [
  { value: "5s", label: "5 segundos", frames: 3 },
  { value: "8s", label: "8 segundos", frames: 5 },
];

const MOVEMENT_SUGGESTIONS = [
  "Digitando no notebook", "Entregando chave", "Apertando mãos",
  "Analisando gráfico", "Abrindo porta", "Sorrindo para câmera",
];

const LOADING_PHRASES = [
  "Analisando referências visuais…",
  "Construindo prompt otimizado…",
  "Aplicando identidade visual…",
  "Gerando imagem com IA…",
  "Finalizando composição…",
  "Quase pronto…",
];

export default function ClienteRedesSociais() {
  const [view, setView] = useState<MainView>("history");
  const [postType, setPostType] = useState<PostType>("art");
  const [artStep, setArtStep] = useState(1); // 1-7
  const [videoStep, setVideoStep] = useState(1); // 1-6

  // Art state
  const [artFormat, setArtFormat] = useState("portrait");
  const [tipoPostagem, setTipoPostagem] = useState("post_unico");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [cta, setCta] = useState("");
  const [cena, setCena] = useState("");
  const [elementosVisuais, setElementosVisuais] = useState("");
  const [manualColors, setManualColors] = useState("");
  const [manualStyle, setManualStyle] = useState("");
  const [brandName, setBrandName] = useState("");

  // Video state
  const [videoFormat, setVideoFormat] = useState("story");
  const [videoDuration, setVideoDuration] = useState("5s");
  const [videoCena, setVideoCena] = useState("");
  const [videoMovimento, setVideoMovimento] = useState("");
  const [videoMensagem, setVideoMensagem] = useState("");
  const [videoCta, setVideoCta] = useState("");

  // Shared
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ post: PostItem; result_url: string | null; result_data: any } | null>(null);
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: orgId } = useUserOrgId();
  const { data: posts, isLoading: postsLoading } = usePostHistory();
  const { data: visualIdentity } = useVisualIdentity();
  const generatePost = useGeneratePost();
  const approvePost = useApprovePost();

  const totalArtSteps = 7;
  const totalVideoSteps = 6;

  const resetWizard = () => {
    setView("history");
    setPostType("art");
    setArtStep(1);
    setVideoStep(1);
    setArtFormat("portrait");
    setTipoPostagem("post_unico");
    setHeadline("");
    setSubheadline("");
    setCta("");
    setCena("");
    setElementosVisuais("");
    setManualColors("");
    setManualStyle("");
    setBrandName("");
    setVideoFormat("story");
    setVideoDuration("5s");
    setVideoCena("");
    setVideoMovimento("");
    setVideoMensagem("");
    setVideoCta("");
    setReferenceUrls([]);
    setGeneratedResult(null);
    setLoadingPhraseIdx(0);
    setIsGenerating(false);
  };

  const handleUploadRef = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !orgId) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `references/${orgId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("social-arts").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("social-arts").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
    }
    setReferenceUrls((prev) => [...prev, ...newUrls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (postType === "art") {
      if (!headline.trim()) {
        toast({ title: "Insira a headline da arte", variant: "destructive" });
        return;
      }
      if (referenceUrls.length < 3) {
        toast({ title: "Envie pelo menos 3 imagens de referência", variant: "destructive" });
        return;
      }
    } else {
      if (!videoCena.trim()) {
        toast({ title: "Descreva a cena do vídeo", variant: "destructive" });
        return;
      }
    }

    setIsGenerating(true);
    setLoadingPhraseIdx(0);
    const interval = setInterval(() => {
      setLoadingPhraseIdx((i) => Math.min(i + 1, LOADING_PHRASES.length - 1));
    }, 4000);

    try {
      const iv = visualIdentity
        ? { palette: visualIdentity.palette, fonts: visualIdentity.fonts, style: visualIdentity.style, tone: visualIdentity.tone, logo_url: visualIdentity.logo_url }
        : undefined;

      const result = await generatePost.mutateAsync({
        type: postType,
        format: postType === "art" ? artFormat : videoFormat,
        duration: postType === "video" ? videoDuration : undefined,
        input_text: postType === "art" ? headline : videoCena,
        reference_image_urls: referenceUrls,
        identidade_visual: iv,
        // Structured fields
        tipo_postagem: postType === "art" ? tipoPostagem : undefined,
        headline: postType === "art" ? headline : undefined,
        subheadline: postType === "art" ? subheadline || undefined : undefined,
        cta: postType === "art" ? cta || undefined : videoCta || undefined,
        cena: postType === "art" ? cena || undefined : videoCena,
        elementos_visuais: postType === "art" ? elementosVisuais || undefined : undefined,
        movimento: postType === "video" ? videoMovimento || undefined : undefined,
        mensagem: postType === "video" ? videoMensagem || undefined : undefined,
        manual_colors: !visualIdentity && manualColors ? manualColors : undefined,
        manual_style: !visualIdentity && manualStyle ? manualStyle : undefined,
        brand_name: brandName || undefined,
      });
      setGeneratedResult(result);
    } catch (err: any) {
      toast({ title: "Erro na geração", description: err.message, variant: "destructive" });
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!generatedResult) return;
    try {
      await approvePost.mutateAsync({ postId: generatedResult.post.id, type: postType });
      resetWizard();
    } catch (err: any) {
      toast({ title: "Erro ao aprovar", description: err.message, variant: "destructive" });
    }
  };

  /* ── Shared upload component ── */
  const RefUploader = ({ required, min }: { required?: boolean; min?: number }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Upload className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Referências visuais</p>
        {required && <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>}
      </div>
      <div className="flex flex-wrap gap-2">
        {referenceUrls.map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-border group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              onClick={() => setReferenceUrls((prev) => prev.filter((_, j) => j !== i))}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ))}
        <button
          className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors gap-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          <span className="text-[10px]">Upload</span>
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadRef} />
      {min && (
        <p className={`text-xs ${referenceUrls.length >= min ? "text-green-600" : "text-muted-foreground"}`}>
          {referenceUrls.length >= min
            ? `✓ ${referenceUrls.length} referências anexadas`
            : `Envie pelo menos ${min} imagens (${referenceUrls.length}/${min})`}
        </p>
      )}
    </div>
  );

  /* ── Step progress bar ── */
  const StepProgress = ({ current, total }: { current: number; total: number }) => (
    <div className="flex items-center gap-1.5 mb-4">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i + 1 <= current ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-2">{current}/{total}</span>
    </div>
  );

  /* ── Selectable card ── */
  const SelectCard = ({ selected, onClick, children, className }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-primary bg-primary/5" : ""} ${className || ""}`}
      onClick={onClick}
    >
      {children}
    </Card>
  );

  // ══════════════════════ HISTORY ══════════════════════
  if (view === "history" && !isGenerating && !generatedResult) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Postagens"
          subtitle="Gere artes e vídeos para redes sociais"
          icon={<Share2 className="w-5 h-5 text-primary" />}
          actions={<Button onClick={() => setView("wizard")}><Plus className="w-4 h-4 mr-1" /> Nova Postagem</Button>}
        />
        <StrategyBanner toolName="suas postagens" dataUsed="Tom de voz, persona e estilo visual" />
        {postsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : !posts?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <Share2 className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">Nenhuma postagem gerada ainda</p>
              <Button onClick={() => setView("wizard")} size="sm"><Plus className="w-4 h-4 mr-1" /> Criar primeira postagem</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Card key={p.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                {p.result_url ? (
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <img src={p.result_url} alt="" className="w-full h-full object-cover" />
                    <Badge className="absolute top-2 right-2 text-[10px]" variant={p.status === "approved" ? "default" : "secondary"}>
                      {p.status === "approved" ? "Aprovado" : "Pendente"}
                    </Badge>
                  </div>
                ) : (
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {p.type === "video" ? <Video className="w-8 h-8 text-muted-foreground/40" /> : <Image className="w-8 h-8 text-muted-foreground/40" />}
                  </div>
                )}
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{p.type === "video" ? "Vídeo" : "Arte"}</Badge>
                    {p.format && <span>{p.format}</span>}
                    <span className="ml-auto">{format(new Date(p.created_at), "dd/MM/yy")}</span>
                  </div>
                  <p className="text-sm line-clamp-2">{p.input_text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════ GENERATING / RESULT ══════════════════════
  if (isGenerating || generatedResult) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Resultado"
          subtitle={generatedResult ? "Revise e aprove seu criativo" : "Gerando…"}
          icon={<Sparkles className="w-5 h-5 text-primary" />}
          backButton={!isGenerating ? <Button variant="ghost" size="icon" onClick={() => { setGeneratedResult(null); }}><ArrowLeft className="w-4 h-4" /></Button> : undefined}
        />
        {isGenerating ? (
          <Card>
            <CardContent className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingPhraseIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-sm text-muted-foreground font-medium"
                >
                  {LOADING_PHRASES[loadingPhraseIdx]}
                </motion.p>
              </AnimatePresence>
            </CardContent>
          </Card>
        ) : generatedResult ? (
          <div className="space-y-4">
            {generatedResult.result_url && (
              <Card className="overflow-hidden">
                <img src={generatedResult.result_url} alt="Resultado" className="w-full max-h-[500px] object-contain bg-muted" />
              </Card>
            )}
            {!generatedResult.result_url && generatedResult.result_data?.frameUrls && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {generatedResult.result_data.frameUrls.map((url: string, i: number) => (
                  <Card key={i} className="overflow-hidden">
                    <img src={url} alt={`Frame ${i + 1}`} className="w-full aspect-[9/16] object-cover" />
                    <CardContent className="p-2 text-center">
                      <span className="text-xs text-muted-foreground">Frame {i + 1}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleApprove} disabled={approvePost.isPending} className="flex-1" size="lg">
                {approvePost.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Aprovar ({postType === "video" ? "200" : "100"} créditos)
              </Button>
              <Button variant="outline" onClick={() => { setGeneratedResult(null); handleGenerate(); }} className="flex-1" size="lg">
                <RefreshCw className="w-4 h-4 mr-2" /> Regenerar
              </Button>
              {generatedResult.result_url && (
                <Button variant="secondary" asChild size="lg">
                  <a href={generatedResult.result_url} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" /> Baixar
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // ══════════════════════ WIZARD ══════════════════════
  const currentStep = postType === "art" ? artStep : videoStep;
  const totalSteps = postType === "art" ? totalArtSteps : totalVideoSteps;
  const setCurrentStep = postType === "art" ? setArtStep : setVideoStep;

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (postType !== "art" || artStep === 1) {
      resetWizard();
    }
  };

  const goNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Type selection (first screen of wizard)
  if (view === "wizard" && postType === "art" && artStep === 0) {
    // Not used — type is chosen inline
  }

  // ── WIZARD STEP CONTENT ──
  const renderArtStep = () => {
    switch (artStep) {
      case 1: // Formato
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Formato da imagem</h3>
              <p className="text-sm text-muted-foreground">Define o enquadramento da arte</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {ART_FORMATS.map((f) => (
                <SelectCard key={f.value} selected={artFormat === f.value} onClick={() => setArtFormat(f.value)}>
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <f.icon className="w-6 h-6 text-primary" />
                    <p className="font-semibold text-sm">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                    <p className="text-[10px] text-muted-foreground">{f.ratio}</p>
                  </CardContent>
                </SelectCard>
              ))}
            </div>
          </div>
        );

      case 2: // Tipo de postagem
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Tipo de postagem</h3>
              <p className="text-sm text-muted-foreground">Define a estrutura visual da arte</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {POST_TYPES.map((t) => (
                <SelectCard key={t.value} selected={tipoPostagem === t.value} onClick={() => setTipoPostagem(t.value)}>
                  <CardContent className="p-4 text-center">
                    <p className="font-semibold text-sm">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                  </CardContent>
                </SelectCard>
              ))}
            </div>
          </div>
        );

      case 3: // Texto da arte
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Texto da arte</h3>
              <p className="text-sm text-muted-foreground">Qual mensagem deve aparecer na imagem?</p>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Headline (obrigatório)</Label>
                <Input
                  placeholder="Ex: Escalar não é sorte"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Subheadline (opcional)</Label>
                <Input
                  placeholder="Ex: É processo"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Call to Action (opcional)</Label>
                <Input
                  placeholder="Ex: Conheça o método"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 4: // Cena
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Ideia visual da cena</h3>
              <p className="text-sm text-muted-foreground">Descreva rapidamente a cena da imagem</p>
            </div>
            <Textarea
              placeholder="Ex: Empresário analisando dashboard de vendas no notebook em um escritório moderno com luz natural"
              value={cena}
              onChange={(e) => setCena(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {["Empresário no escritório", "Pessoa recebendo chave", "Médico com paciente", "Reunião de negócios"].map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                  onClick={() => setCena(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        );

      case 5: // Identidade visual
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Identidade visual</h3>
              <p className="text-sm text-muted-foreground">Cores e estilo da marca</p>
            </div>
            {visualIdentity ? (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold text-primary">Identidade visual detectada automaticamente</p>
                  </div>
                  {visualIdentity.palette && (
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Paleta: {typeof visualIdentity.palette === "string" ? visualIdentity.palette : JSON.stringify(visualIdentity.palette)}</p>
                    </div>
                  )}
                  {visualIdentity.style && (
                    <p className="text-xs text-muted-foreground">Estilo: {visualIdentity.style}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Esses dados serão aplicados automaticamente na geração.</p>
                  <div className="mt-3">
                    <Label className="text-xs">Nome da marca (opcional)</Label>
                    <Input
                      placeholder="Ex: NoExcuse Marketing, P2Y Crédito"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <Card className="bg-muted/30">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Nenhuma identidade visual cadastrada. Preencha abaixo:</p>
                  </CardContent>
                </Card>
                <div>
                  <Label className="text-xs">Cores da marca</Label>
                  <Input
                    placeholder="Ex: Preto e vermelho, Azul e branco"
                    value={manualColors}
                    onChange={(e) => setManualColors(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Estilo visual</Label>
                  <Input
                    placeholder="Ex: Minimalista, Corporativo, Premium"
                    value={manualStyle}
                    onChange={(e) => setManualStyle(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Nome da marca (opcional)</Label>
                  <Input
                    placeholder="Ex: NoExcuse Marketing, P2Y Crédito"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 6: // Elementos visuais
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Elementos visuais</h3>
              <p className="text-sm text-muted-foreground">Objetos ou elementos que devem aparecer na imagem</p>
            </div>
            <Input
              placeholder="Ex: Notebook com gráfico subindo, smartphone, prédio"
              value={elementosVisuais}
              onChange={(e) => setElementosVisuais(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {ELEMENT_SUGGESTIONS.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                  onClick={() => setElementosVisuais((prev) => prev ? `${prev}, ${s}` : s)}
                >
                  <Plus className="w-3 h-3 mr-1" /> {s}
                </Badge>
              ))}
            </div>
          </div>
        );

      case 7: // Referências
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Referências visuais</h3>
              <p className="text-sm text-muted-foreground">
                Envie pelo menos 3 imagens para manter consistência visual.
                Podem ser artes anteriores, exemplos de design ou referências de estilo.
              </p>
            </div>
            <RefUploader required min={3} />

            {/* Summary */}
            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-semibold">Resumo do briefing</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Formato:</span>
                  <span>{ART_FORMATS.find(f => f.value === artFormat)?.label}</span>
                  <span className="text-muted-foreground">Tipo:</span>
                  <span>{POST_TYPES.find(t => t.value === tipoPostagem)?.label}</span>
                  <span className="text-muted-foreground">Headline:</span>
                  <span className="truncate">{headline || "—"}</span>
                  {cena && <>
                    <span className="text-muted-foreground">Cena:</span>
                    <span className="truncate">{cena}</span>
                  </>}
                  <span className="text-muted-foreground">Refs:</span>
                  <span>{referenceUrls.length} imagens</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const renderVideoStep = () => {
    switch (videoStep) {
      case 1: // Formato
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Formato do vídeo</h3>
              <p className="text-sm text-muted-foreground">Onde esse vídeo será publicado?</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {VIDEO_FORMATS.map((f) => (
                <SelectCard key={f.value} selected={videoFormat === f.value} onClick={() => setVideoFormat(f.value)}>
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <f.icon className="w-6 h-6 text-primary" />
                    <p className="font-semibold text-sm">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </SelectCard>
              ))}
            </div>
          </div>
        );

      case 2: // Duração
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Duração do vídeo</h3>
              <p className="text-sm text-muted-foreground">Escolha a duração ideal</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {VIDEO_DURATIONS.map((d) => (
                <SelectCard key={d.value} selected={videoDuration === d.value} onClick={() => setVideoDuration(d.value)}>
                  <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                    <Clock className="w-6 h-6 text-primary" />
                    <p className="font-semibold">{d.label}</p>
                    <p className="text-xs text-muted-foreground">{d.frames} frames gerados</p>
                  </CardContent>
                </SelectCard>
              ))}
            </div>
          </div>
        );

      case 3: // Cena
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Ideia da cena</h3>
              <p className="text-sm text-muted-foreground">Descreva rapidamente o que acontece no vídeo</p>
            </div>
            <Textarea
              placeholder="Ex: Empresário analisando vendas no notebook em escritório moderno"
              value={videoCena}
              onChange={(e) => setVideoCena(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {["Empresário no escritório", "Pessoa recebendo chave de carro", "Médico atendendo paciente"].map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                  onClick={() => setVideoCena(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        );

      case 4: // Movimento
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Movimento da cena</h3>
              <p className="text-sm text-muted-foreground">O que acontece na cena? (ação)</p>
            </div>
            <Input
              placeholder="Ex: digitando no notebook, entregando chave"
              value={videoMovimento}
              onChange={(e) => setVideoMovimento(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {MOVEMENT_SUGGESTIONS.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                  onClick={() => setVideoMovimento(s)}
                >
                  <Plus className="w-3 h-3 mr-1" /> {s}
                </Badge>
              ))}
            </div>
          </div>
        );

      case 5: // Texto/Mensagem
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Texto do vídeo</h3>
              <p className="text-sm text-muted-foreground">Frase ou mensagem que deve aparecer</p>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Mensagem principal</Label>
                <Input
                  placeholder='Ex: "Empresas não quebram por falta de clientes."'
                  value={videoMensagem}
                  onChange={(e) => setVideoMensagem(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">CTA (opcional)</Label>
                <Input
                  placeholder='Ex: "Conheça o método."'
                  value={videoCta}
                  onChange={(e) => setVideoCta(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 6: // Referências
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Referências visuais</h3>
              <p className="text-sm text-muted-foreground">Envie referências de estilo para o vídeo (opcional)</p>
            </div>
            <RefUploader />

            {/* Summary */}
            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-semibold">Resumo do briefing</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Formato:</span>
                  <span>{VIDEO_FORMATS.find(f => f.value === videoFormat)?.label}</span>
                  <span className="text-muted-foreground">Duração:</span>
                  <span>{VIDEO_DURATIONS.find(d => d.value === videoDuration)?.label}</span>
                  <span className="text-muted-foreground">Cena:</span>
                  <span className="truncate">{videoCena || "—"}</span>
                  {videoMovimento && <>
                    <span className="text-muted-foreground">Movimento:</span>
                    <span className="truncate">{videoMovimento}</span>
                  </>}
                  {videoMensagem && <>
                    <span className="text-muted-foreground">Mensagem:</span>
                    <span className="truncate">{videoMensagem}</span>
                  </>}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  // Determine if current step can proceed
  const canProceed = () => {
    if (postType === "art") {
      switch (artStep) {
        case 3: return !!headline.trim();
        case 7: return referenceUrls.length >= 3;
        default: return true;
      }
    } else {
      switch (videoStep) {
        case 3: return !!videoCena.trim();
        default: return true;
      }
    }
  };

  const isLastStep = currentStep === totalSteps;

  return (
    <div className="space-y-5">
      <PageHeader
        title={postType === "art" ? "Criar Arte" : "Criar Vídeo"}
        subtitle={`Passo ${currentStep} de ${totalSteps}`}
        icon={postType === "art" ? <Image className="w-5 h-5 text-primary" /> : <Video className="w-5 h-5 text-primary" />}
        backButton={<Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="w-4 h-4" /></Button>}
      />

      {/* Type toggle (only on step 1) */}
      {currentStep === 1 && (
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              postType === "art" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => { setPostType("art"); setArtStep(1); setVideoStep(1); }}
          >
            <Image className="w-4 h-4" /> Arte
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              postType === "video" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => { setPostType("video"); setVideoStep(1); setArtStep(1); }}
          >
            <Video className="w-4 h-4" /> Vídeo
          </button>
        </div>
      )}

      <StepProgress current={currentStep} total={totalSteps} />

      <Card>
        <CardContent className="p-5">
          {postType === "art" ? renderArtStep() : renderVideoStep()}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {currentStep > 1 && (
          <Button variant="outline" onClick={goBack} className="flex-1">
            Voltar
          </Button>
        )}
        {isLastStep ? (
          <Button
            onClick={handleGenerate}
            disabled={!canProceed() || generatePost.isPending}
            className="flex-1"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar {postType === "art" ? "Arte" : "Vídeo"}
          </Button>
        ) : (
          <Button
            onClick={goNext}
            disabled={!canProceed()}
            className="flex-1"
            size="lg"
          >
            Continuar
          </Button>
        )}
      </div>
    </div>
  );
}
