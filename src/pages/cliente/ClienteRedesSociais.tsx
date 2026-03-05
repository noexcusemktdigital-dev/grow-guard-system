import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { usePostHistory, useGeneratePost, useApprovePost, useGenerateBriefing, useGenerateVideoBriefing, PostItem } from "@/hooks/useClientePosts";
import { useVisualIdentity } from "@/hooks/useVisualIdentity";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useSearchParams } from "react-router-dom";
import {
  Share2, Plus, ArrowLeft, Image, Video, Check, RefreshCw, Download,
  Sparkles, Loader2, Upload, X, Clock, Eye, Type, Film, Smartphone,
  Monitor, LayoutGrid, Square, RectangleVertical, Palette, Box,
  FileText, Wand2, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { StrategyBanner } from "@/components/cliente/StrategyBanner";
import { InsufficientCreditsDialog, isInsufficientCreditsError } from "@/components/cliente/InsufficientCreditsDialog";

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
const VIDEO_PLATFORMS = [
  { value: "instagram_reels", label: "Instagram Reels", format: "story" },
  { value: "tiktok", label: "TikTok", format: "story" },
  { value: "youtube_shorts", label: "YouTube Shorts", format: "story" },
  { value: "instagram_feed", label: "Feed Instagram", format: "feed" },
  { value: "youtube", label: "YouTube", format: "banner" },
];

const VIDEO_FORMATS = [
  { value: "story", label: "9:16", desc: "Vertical (Reels/TikTok)", icon: Smartphone, aspect: "9:16" },
  { value: "feed", label: "1:1", desc: "Quadrado (Feed)", icon: Square, aspect: "1:1" },
  { value: "banner", label: "16:9", desc: "Horizontal (YouTube)", icon: Monitor, aspect: "16:9" },
];

const VIDEO_DURATIONS = [
  { value: "5s", label: "5 segundos", frames: 3 },
  { value: "8s", label: "8 segundos", frames: 5 },
];

const VIDEO_STYLES = [
  { value: "corporativo_moderno", label: "Corporativo moderno", desc: "Escritório, negócios, profissional" },
  { value: "premium_minimalista", label: "Premium minimalista", desc: "Elegante, clean, sofisticado" },
  { value: "publicidade_sofisticada", label: "Publicidade sofisticada", desc: "Alto padrão, comercial" },
  { value: "social_media", label: "Social media", desc: "Vibrante, dinâmico, chamativo" },
  { value: "inspiracional", label: "Inspiracional", desc: "Motivacional, corporativo aspiracional" },
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<MainView>("history");
  const [postType, setPostType] = useState<PostType>("art");
  const [artStep, setArtStep] = useState(1); // 1-7
  const [videoStep, setVideoStep] = useState(1); // 1-6

  // Step 1: Briefing
  const [briefingText, setBriefingText] = useState("");
  const [contentId, setContentId] = useState<string | null>(null);
  const [contentData, setContentData] = useState<any>(null);
  const [briefingFilled, setBriefingFilled] = useState(false);

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
  const [supportingText, setSupportingText] = useState("");
  const [bulletPoints, setBulletPoints] = useState("");

  // Video state
  const [videoFormat, setVideoFormat] = useState("story");
  const [videoDuration, setVideoDuration] = useState("5s");
  const [videoCena, setVideoCena] = useState("");
  const [videoMovimento, setVideoMovimento] = useState("");
  const [videoMensagem, setVideoMensagem] = useState("");
  const [videoCta, setVideoCta] = useState("");
  const [videoPlataforma, setVideoPlataforma] = useState("instagram_reels");
  const [videoEstiloVisual, setVideoEstiloVisual] = useState("corporativo_moderno");
  const [videoAcaoCena, setVideoAcaoCena] = useState("");
  const [videoBriefingText, setVideoBriefingText] = useState("");
  const [videoBriefingFilled, setVideoBriefingFilled] = useState(false);

  // Shared
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ post: PostItem; result_url: string | null; result_data: any } | null>(null);
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);

  const { data: orgId } = useUserOrgId();
  const { data: posts, isLoading: postsLoading } = usePostHistory();
  const { data: visualIdentity } = useVisualIdentity();
  const generatePost = useGeneratePost();
  const approvePost = useApprovePost();
  const generateBriefing = useGenerateBriefing();
  const generateVideoBriefing = useGenerateVideoBriefing();

  const totalArtSteps = 7;
  const totalVideoSteps = 8;

  // Handle content_id from query params
  useEffect(() => {
    const cid = searchParams.get("content_id");
    if (cid) {
      setContentId(cid);
      setView("wizard");
      // Load content data
      loadContentData(cid);
      // Clear query param
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Auto-load image_bank_urls from visual identity
  useEffect(() => {
    if (visualIdentity?.image_bank_urls?.length && referenceUrls.length === 0 && view === "wizard") {
      setReferenceUrls(visualIdentity.image_bank_urls.slice(0, 5));
    }
  }, [visualIdentity, view]);

  const loadContentData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("client_content" as any)
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) {
        setContentData(data);
        // Pre-fill briefing from content
        const r = (data as any).result as any;
        const title = (data as any).title || "";
        const body = (data as any).body || "";
        setBriefingText(`${title}${body ? ` — ${body}` : ""}`);
        // Pre-fill fields from content result
        if (r) {
          if (r.conteudo_principal?.headline) setHeadline(r.conteudo_principal.headline);
          if (r.conteudo_principal?.cta) setCta(r.conteudo_principal.cta);
          if (r.legenda) setSupportingText(r.legenda.slice(0, 200));
        }
      }
    } catch {
      // silently fail
    }
  };

  const resetWizard = () => {
    setView("history");
    setPostType("art");
    setArtStep(1);
    setVideoStep(1);
    setBriefingText("");
    setContentId(null);
    setContentData(null);
    setBriefingFilled(false);
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
    setSupportingText("");
    setBulletPoints("");
    setVideoFormat("story");
    setVideoDuration("5s");
    setVideoCena("");
    setVideoMovimento("");
    setVideoMensagem("");
    setVideoCta("");
    setVideoPlataforma("instagram_reels");
    setVideoEstiloVisual("corporativo_moderno");
    setVideoAcaoCena("");
    setVideoBriefingText("");
    setVideoBriefingFilled(false);
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

  const handleFillWithAI = async () => {
    if (!briefingText.trim() && !contentData) {
      toast({ title: "Escreva um briefing ou selecione um conteúdo", variant: "destructive" });
      return;
    }

    try {
      const iv = visualIdentity
        ? { palette: visualIdentity.palette, fonts: visualIdentity.fonts, style: visualIdentity.style, tone: visualIdentity.tone }
        : undefined;

      const result = await generateBriefing.mutateAsync({
        briefing_text: briefingText || undefined,
        content_data: contentData || undefined,
        identidade_visual: iv,
      });

      // Apply results
      setHeadline(result.headline || "");
      setSubheadline(result.subheadline || "");
      setCta(result.cta || "");
      setCena(result.cena || "");
      setElementosVisuais(result.elementos_visuais || "");
      setSupportingText(result.supporting_text || "");
      setBulletPoints(result.bullet_points || "");
      if (result.suggested_format) setArtFormat(result.suggested_format);
      if (result.suggested_tipo) setTipoPostagem(result.suggested_tipo);

      setBriefingFilled(true);
      toast({ title: "Campos preenchidos com IA!", description: "Revise e ajuste antes de gerar." });
    } catch (err: any) {
      toast({ title: "Erro ao preencher com IA", description: err.message, variant: "destructive" });
    }
  };

  const handleFillVideoWithAI = async () => {
    if (!videoBriefingText.trim() && !contentData) {
      toast({ title: "Escreva um briefing ou selecione um conteúdo", variant: "destructive" });
      return;
    }

    try {
      const iv = visualIdentity
        ? { palette: visualIdentity.palette, fonts: visualIdentity.fonts, style: visualIdentity.style, tone: visualIdentity.tone }
        : undefined;

      const result = await generateVideoBriefing.mutateAsync({
        briefing_text: videoBriefingText || undefined,
        content_data: contentData || undefined,
        identidade_visual: iv,
      });

      // Apply results
      if (result.plataforma) setVideoPlataforma(result.plataforma);
      if (result.formato_video) {
        const fmtMap: Record<string, string> = { "9:16": "story", "1:1": "feed", "16:9": "banner" };
        setVideoFormat(fmtMap[result.formato_video] || "story");
      }
      if (result.duracao) setVideoDuration(result.duracao);
      if (result.descricao_cena) setVideoCena(result.descricao_cena);
      if (result.acao_cena) {
        setVideoAcaoCena(result.acao_cena);
        setVideoMovimento(result.acao_cena);
      }
      if (result.mensagem_video) setVideoMensagem(result.mensagem_video);
      if (result.estilo_visual) setVideoEstiloVisual(result.estilo_visual);
      if (result.suggested_cta) setVideoCta(result.suggested_cta);

      setVideoBriefingFilled(true);
      toast({ title: "Campos de vídeo preenchidos com IA!", description: "Revise e ajuste antes de gerar." });
    } catch (err: any) {
      toast({ title: "Erro ao preencher com IA", description: err.message, variant: "destructive" });
    }
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
        content_id: contentId || undefined,
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
        supporting_text: postType === "art" ? supportingText || undefined : undefined,
        bullet_points: postType === "art" ? bulletPoints || undefined : undefined,
        // Video-specific structured fields
        plataforma: postType === "video" ? videoPlataforma : undefined,
        estilo_visual: postType === "video" ? videoEstiloVisual : undefined,
        acao_cena: postType === "video" ? videoAcaoCena || videoMovimento || undefined : undefined,
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
      if (isInsufficientCreditsError(err)) {
        setShowCreditsDialog(true);
      } else {
        toast({ title: "Erro ao aprovar", description: err.message, variant: "destructive" });
      }
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
    } else {
      resetWizard();
    }
  };

  const goNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // ── ART WIZARD STEPS (7 steps) ──
  const renderArtStep = () => {
    switch (artStep) {
      // Step 1: Briefing rápido
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Briefing rápido</h3>
              <p className="text-sm text-muted-foreground">
                Descreva o que você quer gerar. A IA preenche os campos automaticamente.
              </p>
            </div>

            {contentData && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary">Conteúdo vinculado</p>
                    <p className="text-xs text-muted-foreground truncate">{contentData.title}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setContentData(null); setContentId(null); }}>
                    <X className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            )}

            <Textarea
              placeholder="Ex: Quero uma postagem sobre investimento imobiliário exigir estratégia, para a Klir. A imagem deve transmitir sofisticação e visão de mercado."
              value={briefingText}
              onChange={(e) => setBriefingText(e.target.value)}
              rows={4}
              className="resize-none"
            />

            <Button
              onClick={handleFillWithAI}
              disabled={generateBriefing.isPending || (!briefingText.trim() && !contentData)}
              className="w-full"
              variant="secondary"
            >
              {generateBriefing.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              {generateBriefing.isPending ? "Preenchendo…" : "Preencher com IA"}
            </Button>

            {briefingFilled && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs text-primary">
                    Campos preenchidos! Avance para revisar as referências visuais.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      // Step 2: Referências visuais (obrigatório)
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Referências visuais</h3>
              <p className="text-sm text-muted-foreground">
                As referências definem a <strong>paleta de cores</strong>, <strong>logo</strong> e <strong>tipografia</strong> da sua arte. Envie pelo menos 3 imagens.
              </p>
            </div>

            <Card className="bg-accent/30 border-accent">
              <CardContent className="p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong>Importante:</strong> Quanto mais referências de qualidade, melhor o resultado. Use artes anteriores, exemplos de design ou materiais da marca.
                </p>
              </CardContent>
            </Card>

            <RefUploader required min={3} />

            {visualIdentity?.image_bank_urls && visualIdentity.image_bank_urls.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Banco de imagens da identidade visual:</p>
                <div className="flex flex-wrap gap-2">
                  {visualIdentity.image_bank_urls.filter(url => !referenceUrls.includes(url)).slice(0, 6).map((url, i) => (
                    <button
                      key={i}
                      className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors"
                      onClick={() => setReferenceUrls(prev => [...prev, url])}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      // Step 3: Formato
      case 3:
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

      // Step 4: Tipo de postagem
      case 4:
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

      // Step 5: Texto da arte
      case 5:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Texto da arte</h3>
              <p className="text-sm text-muted-foreground">
                {briefingFilled ? "Campos pré-preenchidos pela IA. Revise e ajuste." : "Qual mensagem deve aparecer na imagem?"}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Headline (obrigatório)</Label>
                <Input placeholder="Ex: Escalar não é sorte" value={headline} onChange={(e) => setHeadline(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Subheadline (opcional)</Label>
                <Input placeholder="Ex: É processo" value={subheadline} onChange={(e) => setSubheadline(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Texto de apoio (opcional)</Label>
                <Textarea placeholder="Ex: Parcelar pode ser estratégia ou armadilha." value={supportingText} onChange={(e) => setSupportingText(e.target.value)} rows={2} className="mt-1 resize-none" />
              </div>
              <div>
                <Label className="text-xs">Bullet points (opcional)</Label>
                <Input placeholder="Ex: Tempo, Renda, Objetivo" value={bulletPoints} onChange={(e) => setBulletPoints(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Call to Action (opcional)</Label>
                <Input placeholder="Ex: Conheça o método" value={cta} onChange={(e) => setCta(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Nome da marca (opcional)</Label>
                <Input placeholder="Ex: Klir, NoExcuse Marketing" value={brandName} onChange={(e) => setBrandName(e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>
        );

      // Step 6: Cena e elementos visuais
      case 6:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Cena e elementos visuais</h3>
              <p className="text-sm text-muted-foreground">
                {briefingFilled ? "Pré-preenchido pela IA. Ajuste conforme necessário." : "Descreva a cena e os elementos que devem aparecer."}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Descrição da cena</Label>
                <Textarea
                  placeholder="Ex: Empresário analisando dashboard de vendas no notebook em um escritório moderno com luz natural"
                  value={cena}
                  onChange={(e) => setCena(e.target.value)}
                  rows={4}
                  className="mt-1 resize-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["Empresário no escritório", "Pessoa recebendo chave", "Médico com paciente", "Reunião de negócios"].map((s) => (
                    <Badge key={s} variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors text-xs" onClick={() => setCena(s)}>
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Elementos visuais</Label>
                <Input
                  placeholder="Ex: Notebook com gráfico subindo, smartphone, prédio"
                  value={elementosVisuais}
                  onChange={(e) => setElementosVisuais(e.target.value)}
                  className="mt-1"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ELEMENT_SUGGESTIONS.map((s) => (
                    <Badge key={s} variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors text-xs" onClick={() => setElementosVisuais((prev) => prev ? `${prev}, ${s}` : s)}>
                      <Plus className="w-3 h-3 mr-1" /> {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Identity visual info */}
              {visualIdentity ? (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-primary" />
                      <p className="text-xs font-semibold text-primary">Identidade visual aplicada automaticamente</p>
                    </div>
                    {visualIdentity.palette && (
                      <p className="text-[10px] text-muted-foreground">Paleta: {typeof visualIdentity.palette === "string" ? visualIdentity.palette : JSON.stringify(visualIdentity.palette)}</p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Cores da marca (sem identidade visual cadastrada)</Label>
                    <Input placeholder="Ex: Azul profundo e branco" value={manualColors} onChange={(e) => setManualColors(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Estilo visual</Label>
                    <Input placeholder="Ex: Corporativo premium, minimalista" value={manualStyle} onChange={(e) => setManualStyle(e.target.value)} className="mt-1" />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      // Step 7: Revisão
      case 7:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Revisão final</h3>
              <p className="text-sm text-muted-foreground">Confira todos os dados antes de gerar a arte</p>
            </div>

            <div className="space-y-3">
              {/* References preview */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Referências ({referenceUrls.length})</p>
                <div className="flex flex-wrap gap-2">
                  {referenceUrls.map((url, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* All fields summary */}
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-2">
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                    <span className="text-muted-foreground font-medium">Formato:</span>
                    <span>{ART_FORMATS.find(f => f.value === artFormat)?.label} ({ART_FORMATS.find(f => f.value === artFormat)?.ratio})</span>

                    <span className="text-muted-foreground font-medium">Tipo:</span>
                    <span>{POST_TYPES.find(t => t.value === tipoPostagem)?.label}</span>

                    <span className="text-muted-foreground font-medium">Headline:</span>
                    <span className="font-semibold">{headline || "—"}</span>

                    {subheadline && <>
                      <span className="text-muted-foreground font-medium">Subheadline:</span>
                      <span>{subheadline}</span>
                    </>}

                    {supportingText && <>
                      <span className="text-muted-foreground font-medium">Texto apoio:</span>
                      <span className="line-clamp-2">{supportingText}</span>
                    </>}

                    {bulletPoints && <>
                      <span className="text-muted-foreground font-medium">Bullets:</span>
                      <span>{bulletPoints}</span>
                    </>}

                    {cta && <>
                      <span className="text-muted-foreground font-medium">CTA:</span>
                      <span>{cta}</span>
                    </>}

                    {brandName && <>
                      <span className="text-muted-foreground font-medium">Marca:</span>
                      <span>{brandName}</span>
                    </>}

                    {cena && <>
                      <span className="text-muted-foreground font-medium">Cena:</span>
                      <span className="line-clamp-2">{cena}</span>
                    </>}

                    {elementosVisuais && <>
                      <span className="text-muted-foreground font-medium">Elementos:</span>
                      <span>{elementosVisuais}</span>
                    </>}

                    <span className="text-muted-foreground font-medium">Refs:</span>
                    <span>{referenceUrls.length} imagens</span>

                    {visualIdentity && <>
                      <span className="text-muted-foreground font-medium">Identidade:</span>
                      <span className="text-primary">✓ Aplicada automaticamente</span>
                    </>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── VIDEO WIZARD STEPS (8 steps) ──
  const renderVideoStep = () => {
    switch (videoStep) {
      // Step 1: Briefing rápido
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Briefing do vídeo</h3>
              <p className="text-sm text-muted-foreground">
                Descreva o que você quer gerar. A IA preenche os campos automaticamente.
              </p>
            </div>

            {contentData && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary">Conteúdo vinculado</p>
                    <p className="text-xs text-muted-foreground truncate">{contentData.title}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setContentData(null); setContentId(null); }}>
                    <X className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            )}

            <Textarea
              placeholder="Ex: Quero um vídeo de 8 segundos mostrando um empresário analisando dados de vendas, para Instagram Reels, estilo corporativo moderno"
              value={videoBriefingText}
              onChange={(e) => setVideoBriefingText(e.target.value)}
              rows={4}
              className="resize-none"
            />

            <Button
              onClick={handleFillVideoWithAI}
              disabled={generateVideoBriefing.isPending || (!videoBriefingText.trim() && !contentData)}
              className="w-full"
              variant="secondary"
            >
              {generateVideoBriefing.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              {generateVideoBriefing.isPending ? "Preenchendo…" : "Preencher com IA"}
            </Button>

            {videoBriefingFilled && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs text-primary">
                    Campos preenchidos! Avance para selecionar a plataforma.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      // Step 2: Plataforma
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Plataforma do vídeo</h3>
              <p className="text-sm text-muted-foreground">Onde o vídeo será publicado?</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {VIDEO_PLATFORMS.map((p) => (
                <SelectCard key={p.value} selected={videoPlataforma === p.value} onClick={() => {
                  setVideoPlataforma(p.value);
                  setVideoFormat(p.format);
                }}>
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    {p.format === "story" ? <Smartphone className="w-6 h-6 text-primary" /> :
                     p.format === "feed" ? <Square className="w-6 h-6 text-primary" /> :
                     <Monitor className="w-6 h-6 text-primary" />}
                    <p className="font-semibold text-sm">{p.label}</p>
                  </CardContent>
                </SelectCard>
              ))}
            </div>
          </div>
        );

      // Step 3: Formato + Duração
      case 3:
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold mb-1">Formato e duração</h3>
              <p className="text-sm text-muted-foreground">Ajuste o formato e a duração do vídeo</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium mb-2 block">Formato</Label>
                <div className="grid grid-cols-3 gap-3">
                  {VIDEO_FORMATS.map((f) => (
                    <SelectCard key={f.value} selected={videoFormat === f.value} onClick={() => setVideoFormat(f.value)}>
                      <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                        <f.icon className="w-5 h-5 text-primary" />
                        <p className="font-semibold text-sm">{f.label}</p>
                        <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                      </CardContent>
                    </SelectCard>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium mb-2 block">Duração</Label>
                <div className="grid grid-cols-2 gap-3">
                  {VIDEO_DURATIONS.map((d) => (
                    <SelectCard key={d.value} selected={videoDuration === d.value} onClick={() => setVideoDuration(d.value)}>
                      <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                        <Clock className="w-5 h-5 text-primary" />
                        <p className="font-semibold">{d.label}</p>
                        <p className="text-[10px] text-muted-foreground">{d.frames} frames</p>
                      </CardContent>
                    </SelectCard>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      // Step 4: Referências visuais
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Referências visuais</h3>
              <p className="text-sm text-muted-foreground">
                As referências definem <strong>paleta de cores</strong>, <strong>estilo</strong> e <strong>atmosfera</strong> do vídeo. Envie pelo menos 3 imagens para melhor resultado.
              </p>
            </div>

            <Card className="bg-accent/30 border-accent">
              <CardContent className="p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong>Dica:</strong> Use artes anteriores, frames de vídeos, screenshots ou materiais da marca como referência.
                </p>
              </CardContent>
            </Card>

            <RefUploader required min={3} />

            {visualIdentity?.image_bank_urls && visualIdentity.image_bank_urls.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Banco de imagens da identidade visual:</p>
                <div className="flex flex-wrap gap-2">
                  {visualIdentity.image_bank_urls.filter(url => !referenceUrls.includes(url)).slice(0, 6).map((url, i) => (
                    <button
                      key={i}
                      className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors"
                      onClick={() => setReferenceUrls(prev => [...prev, url])}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      // Step 5: Cena + Ação
      case 5:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Cena e ação</h3>
              <p className="text-sm text-muted-foreground">
                {videoBriefingFilled ? "Pré-preenchido pela IA. Ajuste conforme necessário." : "Descreva o cenário e o que acontece no vídeo."}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Descrição da cena (cenário principal)</Label>
                <Textarea
                  placeholder="Ex: Empresário sentado em escritório moderno analisando dados de vendas no notebook"
                  value={videoCena}
                  onChange={(e) => setVideoCena(e.target.value)}
                  rows={3}
                  className="mt-1 resize-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["Empresário no escritório", "Investidor em apartamento luxuoso", "Empreendedor olhando dashboards", "Consultor entregando chaves"].map((s) => (
                    <Badge key={s} variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors text-xs" onClick={() => setVideoCena(s)}>{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Ação da cena (o que acontece)</Label>
                <Input
                  placeholder="Ex: olhando gráfico subir no notebook enquanto sorri"
                  value={videoAcaoCena || videoMovimento}
                  onChange={(e) => { setVideoAcaoCena(e.target.value); setVideoMovimento(e.target.value); }}
                  className="mt-1"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {MOVEMENT_SUGGESTIONS.map((s) => (
                    <Badge key={s} variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors text-xs" onClick={() => { setVideoAcaoCena(s); setVideoMovimento(s); }}>
                      <Plus className="w-3 h-3 mr-1" /> {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      // Step 6: Mensagem + CTA
      case 6:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Mensagem do vídeo</h3>
              <p className="text-sm text-muted-foreground">
                {videoBriefingFilled ? "Pré-preenchido pela IA. Ajuste conforme necessário." : "Qual frase deve aparecer no vídeo?"}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Mensagem principal (text overlay)</Label>
                <Input placeholder='Ex: "Empresas não quebram por falta de clientes."' value={videoMensagem} onChange={(e) => setVideoMensagem(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Mensagem final / CTA (opcional)</Label>
                <Input placeholder='Ex: "Elas quebram por falta de processo."' value={videoCta} onChange={(e) => setVideoCta(e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>
        );

      // Step 7: Estilo visual
      case 7:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Estilo visual</h3>
              <p className="text-sm text-muted-foreground">Qual a atmosfera do vídeo?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {VIDEO_STYLES.map((s) => (
                <SelectCard key={s.value} selected={videoEstiloVisual === s.value} onClick={() => setVideoEstiloVisual(s.value)}>
                  <CardContent className="p-4 text-center">
                    <p className="font-semibold text-sm">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                  </CardContent>
                </SelectCard>
              ))}
            </div>

            {visualIdentity ? (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary" />
                    <p className="text-xs font-semibold text-primary">Identidade visual aplicada automaticamente</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        );

      // Step 8: Revisão
      case 8:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Revisão final</h3>
              <p className="text-sm text-muted-foreground">Confira todos os dados antes de gerar o vídeo</p>
            </div>

            {/* References preview */}
            {referenceUrls.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Referências ({referenceUrls.length})</p>
                <div className="flex flex-wrap gap-2">
                  {referenceUrls.map((url, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-2">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                  <span className="text-muted-foreground font-medium">Plataforma:</span>
                  <span>{VIDEO_PLATFORMS.find(p => p.value === videoPlataforma)?.label || videoPlataforma}</span>

                  <span className="text-muted-foreground font-medium">Formato:</span>
                  <span>{VIDEO_FORMATS.find(f => f.value === videoFormat)?.label} ({VIDEO_FORMATS.find(f => f.value === videoFormat)?.aspect})</span>

                  <span className="text-muted-foreground font-medium">Duração:</span>
                  <span>{VIDEO_DURATIONS.find(d => d.value === videoDuration)?.label} ({VIDEO_DURATIONS.find(d => d.value === videoDuration)?.frames} frames)</span>

                  <span className="text-muted-foreground font-medium">Cena:</span>
                  <span className="line-clamp-2">{videoCena || "—"}</span>

                  {(videoAcaoCena || videoMovimento) && <>
                    <span className="text-muted-foreground font-medium">Ação:</span>
                    <span className="line-clamp-1">{videoAcaoCena || videoMovimento}</span>
                  </>}

                  {videoMensagem && <>
                    <span className="text-muted-foreground font-medium">Mensagem:</span>
                    <span className="font-semibold">"{videoMensagem}"</span>
                  </>}

                  {videoCta && <>
                    <span className="text-muted-foreground font-medium">CTA:</span>
                    <span>"{videoCta}"</span>
                  </>}

                  <span className="text-muted-foreground font-medium">Estilo:</span>
                  <span>{VIDEO_STYLES.find(s => s.value === videoEstiloVisual)?.label || videoEstiloVisual}</span>

                  <span className="text-muted-foreground font-medium">Refs:</span>
                  <span>{referenceUrls.length} imagens</span>

                  {visualIdentity && <>
                    <span className="text-muted-foreground font-medium">Identidade:</span>
                    <span className="text-primary">✓ Aplicada automaticamente</span>
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
        case 1: return true; // briefing is optional, user can skip
        case 2: return referenceUrls.length >= 3;
        case 5: return !!headline.trim();
        default: return true;
      }
    } else {
      switch (videoStep) {
        case 1: return true; // briefing is optional
        case 4: return referenceUrls.length >= 3;
        case 5: return !!videoCena.trim();
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
      <InsufficientCreditsDialog
        open={showCreditsDialog}
        onOpenChange={setShowCreditsDialog}
        actionLabel={postType === "video" ? "este vídeo" : "esta arte"}
        creditCost={postType === "video" ? 200 : 100}
      />
    </div>
  );
}
