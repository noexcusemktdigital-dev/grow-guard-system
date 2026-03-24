import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  usePostHistory, useGeneratePost, useApprovePost, useDeletePost,
  useBulkDeletePosts, useBulkApprovePosts, useGenerateBriefing, useGenerateVideoBriefing,
  usePostQuota, CREDIT_COST_ART, CREDIT_COST_VIDEO, getVideoCost, PostItem,
} from "@/hooks/useClientePosts";
import { useVisualIdentity } from "@/hooks/useVisualIdentity";
import { useContentHistory } from "@/hooks/useClienteContentV2";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { supabase } from "@/lib/supabase";
import { InsufficientCreditsDialog, isInsufficientCreditsError } from "@/components/cliente/InsufficientCreditsDialog";

import { PostGallery } from "@/components/cliente/social/PostGallery";
import { ArtWizard, ArtGeneratePayload, ArtBriefingResult } from "@/components/cliente/social/ArtWizard";
import { PostResult } from "@/components/cliente/social/PostResult";
import { LOADING_PHRASES } from "@/components/cliente/social/constants";

// Reuse existing video wizard inline — will extract later
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RefUploader } from "@/components/cliente/social/RefUploader";
import {
  VIDEO_PLATFORMS, VIDEO_FORMATS, VIDEO_DURATIONS, VIDEO_STYLES, MOVEMENT_SUGGESTIONS,
} from "@/components/cliente/social/constants";
import {
  ArrowLeft, Video, Image, Sparkles, Check, Wand2, Loader2, X, FileText,
  Smartphone, Square, Monitor, Clock, Plus, AlertTriangle,
} from "lucide-react";

type MainView = "gallery" | "art-wizard" | "video-wizard" | "result";

export default function ClienteRedesSociais() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<MainView>("gallery");
  const [postType, setPostType] = useState<"art" | "video">("art");

  // Shared state
  const [contentId, setContentId] = useState<string | null>(null);
  const [contentData, setContentData] = useState<any>(null);
  const [briefingFilled, setBriefingFilled] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ post: PostItem; result_url: string | null; result_data: any } | null>(null);
  const [batchResults, setBatchResults] = useState<{ post: PostItem; result_url: string | null; result_data: any }[]>([]);
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);

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
  const [videoStep, setVideoStep] = useState(1);
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: orgId } = useUserOrgId();
  const { data: posts, isLoading: postsLoading } = usePostHistory();
  const { data: visualIdentity } = useVisualIdentity();
  const { data: contentHistory } = useContentHistory();
  const generatePost = useGeneratePost();
  const approvePost = useApprovePost();
  const generateBriefing = useGenerateBriefing();
  const generateVideoBriefing = useGenerateVideoBriefing();
  const deletePost = useDeletePost();
  const bulkDelete = useBulkDeletePosts();
  const quota = usePostQuota();

  // Handle content_id from query params
  useEffect(() => {
    const cid = searchParams.get("content_id");
    if (cid) {
      setContentId(cid);
      setView("art-wizard");
      loadContentData(cid);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Auto-load references from visual identity for video wizard
  useEffect(() => {
    if (view === "video-wizard" && referenceUrls.length === 0 && visualIdentity) {
      if (visualIdentity.image_bank_urls?.length) setReferenceUrls(visualIdentity.image_bank_urls.slice(0, 5));
      else if (visualIdentity.logo_url) setReferenceUrls([visualIdentity.logo_url]);
    }
  }, [visualIdentity, view]);

  const loadContentData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("client_content" as any)
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) setContentData(data);
    } catch {}
  };

  const resetAll = () => {
    setView("gallery");
    setPostType("art");
    setContentId(null);
    setContentData(null);
    setBriefingFilled(false);
    setGeneratedResult(null);
    setBatchResults([]);
    setIsGenerating(false);
    setLoadingPhraseIdx(0);
    // Video
    setVideoFormat("story"); setVideoDuration("5s"); setVideoCena(""); setVideoMovimento("");
    setVideoMensagem(""); setVideoCta(""); setVideoPlataforma("instagram_reels");
    setVideoEstiloVisual("corporativo_moderno"); setVideoAcaoCena(""); setVideoBriefingText("");
    setVideoBriefingFilled(false); setVideoStep(1); setReferenceUrls([]); setUploading(false);
  };

  // ─── Art generation ───
  const handleArtGenerate = async (payload: ArtGeneratePayload) => {
    if (!quota.canAffordArt) { setShowCreditsDialog(true); return; }

    setIsGenerating(true);
    setView("result");
    setPostType("art");
    setLoadingPhraseIdx(0);
    const interval = setInterval(() => {
      setLoadingPhraseIdx((i) => Math.min(i + 1, LOADING_PHRASES.length - 1));
    }, 4000);

    try {
      const iv = visualIdentity
        ? { palette: visualIdentity.palette, fonts: visualIdentity.fonts, style: visualIdentity.style, tone: visualIdentity.tone, logo_url: visualIdentity.logo_url }
        : undefined;

      const layoutVariations = payload.layoutTypes.length > 0 ? payload.layoutTypes : ["hero_central"];
      const isCarousel = payload.tipoPostagem === "carrossel";
      const totalPieces = isCarousel ? payload.carouselSlides : payload.quantity;
      const results: { post: PostItem; result_url: string | null; result_data: any }[] = [];
      // Per-piece formats (if provided) or single format for all
      const formats = payload.formats && payload.formats.length === totalPieces ? payload.formats : [];

      for (let i = 0; i < totalPieces; i++) {
        // Round-robin layout assignment
        const currentLayout = layoutVariations[i % layoutVariations.length];
        const pieceFormat = formats.length > 0 ? formats[i] : payload.format;

        const result = await generatePost.mutateAsync({
          type: "art",
          format: pieceFormat,
          style: currentLayout,
          input_text: payload.headline,
          reference_image_urls: payload.referenceUrls,
          identidade_visual: iv,
          content_id: payload.contentId || undefined,
          tipo_postagem: isCarousel ? (i === 0 ? "capa_carrossel" : "slide_carrossel") : payload.tipoPostagem,
          headline: isCarousel && i > 0 && i < totalPieces - 1
            ? `${payload.headline} — Slide ${i + 1}`
            : payload.headline,
          subheadline: payload.subheadline || undefined,
          cta: isCarousel && i === totalPieces - 1 ? (payload.cta || "Saiba mais") : (payload.cta || undefined),
          cena: payload.cena || undefined,
          elementos_visuais: payload.elementosVisuais || undefined,
          manual_colors: !visualIdentity && payload.manualColors ? payload.manualColors : undefined,
          manual_style: !visualIdentity && payload.manualStyle ? payload.manualStyle : undefined,
          brand_name: payload.brandName || undefined,
          supporting_text: payload.supportingText || undefined,
          bullet_points: payload.bulletPoints || undefined,
          layout_type: currentLayout,
          logo_url: payload.logoUrl || undefined,
          primary_ref_index: payload.primaryRefIndex,
          objective: payload.objective || undefined,
          photo_image_urls: payload.photoUrls,
          output_mode: payload.outputMode,
          print_format: payload.printFormat,
        });

        results.push(result);
      }

      setBatchResults(results);
      setGeneratedResult(results[0]);
    } catch (err: any) {
      if (isInsufficientCreditsError(err)) {
        setShowCreditsDialog(true);
      } else {
        toast({ title: "Erro na geração", description: err.message, variant: "destructive" });
      }
      setView("art-wizard");
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleArtFillWithAI = async (briefingText: string, cd: any): Promise<ArtBriefingResult | null> => {
    if (!briefingText.trim() && !cd) {
      toast({ title: "Escreva um briefing ou vincule um conteúdo", variant: "destructive" });
      return null;
    }
    try {
      const iv = visualIdentity
        ? { palette: visualIdentity.palette, fonts: visualIdentity.fonts, style: visualIdentity.style, tone: visualIdentity.tone }
        : undefined;
      const result = await generateBriefing.mutateAsync({
        briefing_text: briefingText || undefined,
        content_data: cd || undefined,
        identidade_visual: iv,
      });
      toast({ title: "Campos preenchidos com IA!" });
      return result;
    } catch (err: any) {
      toast({ title: "Erro ao preencher com IA", description: err.message, variant: "destructive" });
      return null;
    }
  };

  // ─── Video generation ───
  const handleVideoGenerate = async () => {
    if (!videoCena.trim()) {
      toast({ title: "Descreva a cena do vídeo", variant: "destructive" });
      return;
    }
    if (!quota.canAffordVideo) { setShowCreditsDialog(true); return; }

    setIsGenerating(true);
    setView("result");
    setPostType("video");
    setLoadingPhraseIdx(0);
    const interval = setInterval(() => {
      setLoadingPhraseIdx((i) => Math.min(i + 1, LOADING_PHRASES.length - 1));
    }, 4000);

    try {
      const iv = visualIdentity
        ? { palette: visualIdentity.palette, fonts: visualIdentity.fonts, style: visualIdentity.style, tone: visualIdentity.tone, logo_url: visualIdentity.logo_url }
        : undefined;

      const result = await generatePost.mutateAsync({
        type: "video",
        format: videoFormat,
        duration: videoDuration,
        input_text: videoCena,
        reference_image_urls: referenceUrls,
        identidade_visual: iv,
        content_id: contentId || undefined,
        cena: videoCena,
        movimento: videoMovimento || undefined,
        mensagem: videoMensagem || undefined,
        cta: videoCta || undefined,
        plataforma: videoPlataforma,
        estilo_visual: videoEstiloVisual,
        acao_cena: videoAcaoCena || videoMovimento || undefined,
      });

      setGeneratedResult(result);
      setBatchResults([result]);
    } catch (err: any) {
      if (isInsufficientCreditsError(err)) {
        setShowCreditsDialog(true);
      } else {
        toast({ title: "Erro na geração", description: err.message, variant: "destructive" });
      }
      setView("video-wizard");
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  // ─── Approve all ───
  const handleApproveAll = async () => {
    const results = batchResults.length > 0 ? batchResults : (generatedResult ? [generatedResult] : []);
    const numFrames = videoDuration === "8s" ? 5 : 3;
    try {
      for (const r of results) {
        if (r.post.status !== "approved") {
          await approvePost.mutateAsync({ postId: r.post.id, type: postType, numFrames });
        }
      }
      resetAll();
    } catch (err: any) {
      if (isInsufficientCreditsError(err)) {
        setShowCreditsDialog(true);
      } else {
        toast({ title: "Erro ao aprovar", description: err.message, variant: "destructive" });
      }
    }
  };

  // ─── Regenerate ───
  const handleRegenerate = async () => {
    // Delete ghost records
    const results = batchResults.length > 0 ? batchResults : (generatedResult ? [generatedResult] : []);
    for (const r of results) {
      if (r.post.status !== "approved") {
        try { await deletePost.mutateAsync(r.post.id); } catch {}
      }
    }
    setGeneratedResult(null);
    setBatchResults([]);
    // Go back to wizard
    setView(postType === "art" ? "art-wizard" : "video-wizard");
  };

  // ═══════ GALLERY ═══════
  if (view === "gallery") {
    return (
      <>
        <PostGallery
          posts={posts}
          isLoading={postsLoading}
          onCreateNew={() => setView("art-wizard")}
          onViewPost={(post) => {
            setPostType(post.type as "art" | "video");
            setGeneratedResult({ post, result_url: post.result_url, result_data: post.result_data });
            setBatchResults([{ post, result_url: post.result_url, result_data: post.result_data }]);
            setView("result");
          }}
          onDeleteSingle={(id) => deletePost.mutate(id)}
          onBulkDelete={(ids) => bulkDelete.mutate(ids)}
          isDeleting={deletePost.isPending}
          isBulkDeleting={bulkDelete.isPending}
        />
        <InsufficientCreditsDialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog} actionLabel="esta arte" creditCost={CREDIT_COST_ART} />
      </>
    );
  }

  // ═══════ ART WIZARD ═══════
  if (view === "art-wizard") {
    return (
      <>
        {/* Type toggle */}
        <div className="mb-4 flex gap-2 p-1 bg-muted rounded-lg">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              postType === "art" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => { setPostType("art"); }}
          >
            <Image className="w-4 h-4" /> Arte
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              postType === "video" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => { setPostType("video"); setView("video-wizard"); }}
          >
            <Video className="w-4 h-4" /> Vídeo
          </button>
        </div>

        <ArtWizard
          orgId={orgId}
          visualIdentity={visualIdentity}
          contentHistory={contentHistory}
          contentData={contentData}
          setContentData={setContentData}
          contentId={contentId}
          setContentId={setContentId}
          briefingFilled={briefingFilled}
          setBriefingFilled={setBriefingFilled}
          onGenerate={handleArtGenerate}
          onFillWithAI={handleArtFillWithAI}
          isFillingAI={generateBriefing.isPending}
          canAfford={quota.canAffordArt}
          creditCost={CREDIT_COST_ART}
          onBack={resetAll}
        />
        <InsufficientCreditsDialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog} actionLabel="esta arte" creditCost={CREDIT_COST_ART} />
      </>
    );
  }

  // ═══════ VIDEO WIZARD (inline - kept compact) ═══════
  if (view === "video-wizard") {
    const totalVideoSteps = 8;

    const handleFillVideoAI = async () => {
      if (!videoBriefingText.trim() && !contentData) {
        toast({ title: "Escreva um briefing ou vincule um conteúdo", variant: "destructive" });
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
        if (result.plataforma) setVideoPlataforma(result.plataforma);
        if (result.formato_video) {
          const fmtMap: Record<string, string> = { "9:16": "story", "1:1": "feed", "16:9": "banner" };
          setVideoFormat(fmtMap[result.formato_video] || "story");
        }
        if (result.duracao) setVideoDuration(result.duracao);
        if (result.descricao_cena) setVideoCena(result.descricao_cena);
        if (result.acao_cena) { setVideoAcaoCena(result.acao_cena); setVideoMovimento(result.acao_cena); }
        if (result.mensagem_video) setVideoMensagem(result.mensagem_video);
        if (result.estilo_visual) setVideoEstiloVisual(result.estilo_visual);
        if (result.suggested_cta) setVideoCta(result.suggested_cta);
        setVideoBriefingFilled(true);
        toast({ title: "Campos de vídeo preenchidos com IA!" });
      } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
      }
    };

    // Auto-load refs handled by top-level effect

    const goVideoBack = () => {
      if (videoStep > 1) setVideoStep(videoStep - 1);
      else resetAll();
    };

    const canVideoProceed = () => {
      switch (videoStep) {
        case 1: return true;
        case 4: return referenceUrls.length >= 3;
        case 5: return !!videoCena.trim();
        default: return true;
      }
    };

    const SelectCard = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
      <Card className={`cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-primary bg-primary/5" : ""}`} onClick={onClick}>
        {children}
      </Card>
    );

    const renderVideoStep = () => {
      switch (videoStep) {
        case 1:
          return (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold mb-1">💡 Briefing do vídeo</h3>
                <p className="text-sm text-muted-foreground">Descreva o que quer. A IA preenche tudo.</p>
              </div>
              <Textarea placeholder="Ex: Quero um vídeo de 8s mostrando empresário analisando dados..." value={videoBriefingText} onChange={(e) => setVideoBriefingText(e.target.value)} rows={4} className="resize-none" />
              <Button onClick={handleFillVideoAI} disabled={generateVideoBriefing.isPending || (!videoBriefingText.trim() && !contentData)} className="w-full" variant="secondary">
                {generateVideoBriefing.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                {generateVideoBriefing.isPending ? "Preenchendo…" : "Preencher com IA"}
              </Button>
              {videoBriefingFilled && (
                <Card className="bg-primary/5 border-primary/20"><CardContent className="p-3 flex items-center gap-2"><Check className="w-4 h-4 text-primary shrink-0" /><p className="text-xs text-primary">Campos preenchidos!</p></CardContent></Card>
              )}
            </div>
          );
        case 2:
          return (
            <div className="space-y-4">
              <div><h3 className="text-base font-semibold mb-1">📱 Plataforma</h3><p className="text-sm text-muted-foreground">Onde será publicado?</p></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VIDEO_PLATFORMS.map((p) => (
                  <SelectCard key={p.value} selected={videoPlataforma === p.value} onClick={() => { setVideoPlataforma(p.value); setVideoFormat(p.format); }}>
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      {p.format === "story" ? <Smartphone className="w-6 h-6 text-primary" /> : p.format === "feed" ? <Square className="w-6 h-6 text-primary" /> : <Monitor className="w-6 h-6 text-primary" />}
                      <p className="font-semibold text-sm">{p.label}</p>
                    </CardContent>
                  </SelectCard>
                ))}
              </div>
            </div>
          );
        case 3:
          return (
            <div className="space-y-5">
              <div><h3 className="text-base font-semibold mb-1">📐 Formato e duração</h3></div>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium mb-2 block">Formato</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {VIDEO_FORMATS.map((f) => (
                      <SelectCard key={f.value} selected={videoFormat === f.value} onClick={() => setVideoFormat(f.value)}>
                        <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                          <f.icon className="w-5 h-5 text-primary" /><p className="font-semibold text-sm">{f.label}</p><p className="text-[10px] text-muted-foreground">{f.desc}</p>
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
                          <Clock className="w-5 h-5 text-primary" /><p className="font-semibold">{d.label}</p><p className="text-[10px] text-muted-foreground">{d.frames} frames</p>
                        </CardContent>
                      </SelectCard>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        case 4:
          return (
            <div className="space-y-4">
              <div><h3 className="text-base font-semibold mb-1">📸 Referências visuais</h3><p className="text-sm text-muted-foreground">Envie pelo menos 3 imagens.</p></div>
              <RefUploader referenceUrls={referenceUrls} setReferenceUrls={setReferenceUrls} orgId={orgId} uploading={uploading} setUploading={setUploading} required min={3} visualIdentity={visualIdentity} />
            </div>
          );
        case 5:
          return (
            <div className="space-y-4">
              <div><h3 className="text-base font-semibold mb-1">🎬 Cena e ação</h3></div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Descrição da cena</Label>
                  <Textarea placeholder="Ex: Empresário no escritório moderno analisando dados" value={videoCena} onChange={(e) => setVideoCena(e.target.value)} rows={3} className="mt-1 resize-none" />
                </div>
                <div>
                  <Label className="text-xs">Ação da cena</Label>
                  <Input placeholder="Ex: olhando gráfico subir no notebook" value={videoAcaoCena || videoMovimento} onChange={(e) => { setVideoAcaoCena(e.target.value); setVideoMovimento(e.target.value); }} className="mt-1" />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {MOVEMENT_SUGGESTIONS.map((s) => (
                      <Badge key={s} variant="outline" className="cursor-pointer hover:bg-primary/10 text-xs" onClick={() => { setVideoAcaoCena(s); setVideoMovimento(s); }}><Plus className="w-3 h-3 mr-1" /> {s}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        case 6:
          return (
            <div className="space-y-4">
              <div><h3 className="text-base font-semibold mb-1">💬 Mensagem do vídeo</h3></div>
              <div className="space-y-3">
                <div><Label className="text-xs">Mensagem principal</Label><Input placeholder='Ex: "Empresas não quebram por falta de clientes."' value={videoMensagem} onChange={(e) => setVideoMensagem(e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">CTA final</Label><Input placeholder='Ex: "Conheça o método."' value={videoCta} onChange={(e) => setVideoCta(e.target.value)} className="mt-1" /></div>
              </div>
            </div>
          );
        case 7:
          return (
            <div className="space-y-4">
              <div><h3 className="text-base font-semibold mb-1">🎨 Estilo visual</h3></div>
              <div className="grid grid-cols-2 gap-3">
                {VIDEO_STYLES.map((s) => (
                  <SelectCard key={s.value} selected={videoEstiloVisual === s.value} onClick={() => setVideoEstiloVisual(s.value)}>
                    <CardContent className="p-4 text-center"><p className="font-semibold text-sm">{s.label}</p><p className="text-xs text-muted-foreground mt-1">{s.desc}</p></CardContent>
                  </SelectCard>
                ))}
              </div>
            </div>
          );
        case 8:
          return (
            <div className="space-y-4">
              <div><h3 className="text-base font-semibold mb-1">✅ Revisão final</h3></div>
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                    <span className="text-muted-foreground font-medium">Plataforma:</span><span>{VIDEO_PLATFORMS.find(p => p.value === videoPlataforma)?.label}</span>
                    <span className="text-muted-foreground font-medium">Formato:</span><span>{VIDEO_FORMATS.find(f => f.value === videoFormat)?.label}</span>
                    <span className="text-muted-foreground font-medium">Duração:</span><span>{VIDEO_DURATIONS.find(d => d.value === videoDuration)?.label}</span>
                    <span className="text-muted-foreground font-medium">Cena:</span><span className="line-clamp-2">{videoCena || "—"}</span>
                    {videoMensagem && <><span className="text-muted-foreground font-medium">Mensagem:</span><span>"{videoMensagem}"</span></>}
                    <span className="text-muted-foreground font-medium">Estilo:</span><span>{VIDEO_STYLES.find(s => s.value === videoEstiloVisual)?.label}</span>
                    <span className="text-muted-foreground font-medium">Refs:</span><span>{referenceUrls.length} imagens</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        default: return null;
      }
    };

    const isLastVideoStep = videoStep === totalVideoSteps;

    return (
      <div className="space-y-5">
        {/* Type toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${postType === "art" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`} onClick={() => { setPostType("art"); setView("art-wizard"); }}>
            <Image className="w-4 h-4" /> Arte
          </button>
          <button className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${postType === "video" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`} onClick={() => setPostType("video")}>
            <Video className="w-4 h-4" /> Vídeo
          </button>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={goVideoBack}><ArrowLeft className="w-4 h-4" /></Button>
          <div><h2 className="text-lg font-bold">Criar Vídeo</h2><p className="text-xs text-muted-foreground">Passo {videoStep} de {totalVideoSteps}</p></div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-4">
          {Array.from({ length: totalVideoSteps }, (_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= videoStep ? "bg-primary" : "bg-muted"}`} />
          ))}
          <span className="text-xs text-muted-foreground ml-2">{videoStep}/{totalVideoSteps}</span>
        </div>

        <Card><CardContent className="p-5">{renderVideoStep()}</CardContent></Card>

        <div className="flex gap-3">
          {videoStep > 1 && <Button variant="outline" onClick={goVideoBack} className="flex-1">Voltar</Button>}
          {isLastVideoStep ? (
            <Button onClick={handleVideoGenerate} disabled={!canVideoProceed() || !quota.canAffordVideo} className="flex-1" size="lg">
              <Sparkles className="w-4 h-4 mr-2" /> Gerar Vídeo ({getVideoCost(videoDuration)} créditos)
            </Button>
          ) : (
            <Button onClick={() => setVideoStep(videoStep + 1)} disabled={!canVideoProceed()} className="flex-1" size="lg">Continuar</Button>
          )}
        </div>
        <InsufficientCreditsDialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog} actionLabel="este vídeo" creditCost={getVideoCost(videoDuration)} />
      </div>
    );
  }

  // ═══════ RESULT ═══════
  if (view === "result") {
    return (
      <>
        <PostResult
          isGenerating={isGenerating}
          loadingPhraseIdx={loadingPhraseIdx}
          generatedResult={generatedResult}
          batchResults={batchResults}
          postType={postType}
          videoDuration={videoDuration}
          onApprove={handleApproveAll}
          isApproving={approvePost.isPending}
          onRegenerate={handleRegenerate}
          onDelete={(id) => {
            deletePost.mutate(id, {
              onSuccess: () => {
                const remaining = batchResults.filter(r => r.post.id !== id);
                if (remaining.length === 0) resetAll();
                else { setBatchResults(remaining); setGeneratedResult(remaining[0]); }
              },
            });
          }}
          onBack={resetAll}
        />
        <InsufficientCreditsDialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog} actionLabel="este material" creditCost={CREDIT_COST_ART} />
      </>
    );
  }

  return null;
}
