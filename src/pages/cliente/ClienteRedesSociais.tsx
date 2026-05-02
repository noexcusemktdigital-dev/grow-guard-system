import { useState, useEffect } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useMemberPermissions } from "@/hooks/useMemberPermissions";
import { logger } from "@/lib/logger";
import {
  usePostHistory, useGeneratePost, useApprovePost, useDeletePost,
  useBulkDeletePosts, useBulkApprovePosts, useGenerateBriefing,
  usePostQuota, CREDIT_COST_ART, PostItem,
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
import { PublicarModal } from "@/components/social/PublicarModal";
import { Button } from "@/components/ui/button";
import { Share2, Instagram, Link2, CheckCircle2 } from "lucide-react";
import { useSocialAccounts, useConnectSocialAccount } from "@/hooks/useSocialAccounts";

import { PageHeader } from "@/components/PageHeader";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";

interface CarouselSlideContent {
  headline: string;
  subheadline?: string;
  supportingText?: string;
  bulletPoints?: string;
  cta?: string;
}

function buildCarouselSlideContents(
  totalSlides: number,
  headline: string,
  subheadline: string,
  supportingText: string,
  bulletPoints: string,
  cta: string,
): CarouselSlideContent[] {
  const slides: CarouselSlideContent[] = [];
  const bullets = bulletPoints.split(/\n|;|•|—/).map((b) => b.trim()).filter(Boolean);

  slides.push({ headline, subheadline: subheadline || undefined, cta: undefined });

  const middleCount = Math.max(totalSlides - 2, 1);

  if (totalSlides > 2) {
    const bulletsPerSlide = Math.max(1, Math.ceil(bullets.length / middleCount));
    const supportSentences = supportingText.split(/\.\s+/).map((s) => s.trim()).filter(Boolean);
    const sentencesPerSlide = Math.max(1, Math.ceil(supportSentences.length / middleCount));

    for (let i = 0; i < middleCount; i++) {
      const slideBullets = bullets.slice(i * bulletsPerSlide, (i + 1) * bulletsPerSlide);
      const slideSentences = supportSentences.slice(i * sentencesPerSlide, (i + 1) * sentencesPerSlide);
      slides.push({
        headline: slideBullets.length > 0 ? slideBullets[0] : `${headline} — ${i + 2}/${totalSlides}`,
        subheadline: slideBullets.length > 1 ? slideBullets.slice(1).join(" • ") : undefined,
        supportingText: slideSentences.length > 0 ? slideSentences.join(". ") + "." : undefined,
        bulletPoints: slideBullets.length > 0 ? slideBullets.join("\n") : undefined,
      });
    }
  }

  if (totalSlides > 1) {
    slides.push({ headline: cta || "Saiba mais", subheadline: subheadline || headline, cta: cta || "Saiba mais" });
  }

  return slides;
}

type MainView = "gallery" | "art-wizard" | "result";

export default function ClienteRedesSociais() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { permissions, isAdmin } = useMemberPermissions();
  const canGenerate = isAdmin || permissions.can_generate_posts;
  const [view, setView] = useState<MainView>("gallery");

  const [contentId, setContentId] = useState<string | null>(null);
  const [contentData, setContentData] = useState<Tables<'client_content'> | null>(null);
  const [briefingFilled, setBriefingFilled] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ post: PostItem; result_url: string | null; result_data: Record<string, unknown> } | null>(null);
  const [batchResults, setBatchResults] = useState<{ post: PostItem; result_url: string | null; result_data: Record<string, unknown> }[]>([]);
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [publishPostId, setPublishPostId] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const { data: orgId } = useUserOrgId();
  const { data: posts, isLoading: postsLoading } = usePostHistory();
  const { data: visualIdentity } = useVisualIdentity();
  const { data: contentHistory } = useContentHistory();
  const generatePost = useGeneratePost();
  const approvePost = useApprovePost();
  const generateBriefing = useGenerateBriefing();
  const deletePost = useDeletePost();
  const bulkDelete = useBulkDeletePosts();
  const bulkApprove = useBulkApprovePosts();
  const quota = usePostQuota();
  const { data: socialAccounts } = useSocialAccounts();
  const connectSocial = useConnectSocialAccount();

  const metaAccount = socialAccounts?.find(
    (a) => (a.platform === "instagram" || a.platform === "facebook") && a.status === "active",
  );

  const loadContentData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("client_content" as unknown as "client_content")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) setContentData(data);
    } catch (err) {
      logger.error("Erro ao carregar conteúdo:", err);
      toast({ title: "Erro ao carregar conteúdo vinculado", variant: "destructive" });
    }
  };

  const resetAll = () => {
    setView("gallery");
    setContentId(null);
    setContentData(null);
    setBriefingFilled(false);
    setGeneratedResult(null);
    setBatchResults([]);
    setIsGenerating(false);
    setLoadingPhraseIdx(0);
  };

  const handleArtGenerate = async (payload: ArtGeneratePayload) => {
    if (!canGenerate) {
      toast({ title: "Sem permissão", description: "Você não tem permissão para gerar artes. Fale com o administrador.", variant: "destructive" });
      return;
    }
    if (!quota.canAffordArt) { setShowCreditsDialog(true); return; }

    setIsGenerating(true);
    setView("result");
    setLoadingPhraseIdx(0);
    const interval = setInterval(() => {
      setLoadingPhraseIdx((i) => Math.min(i + 1, LOADING_PHRASES.length - 1));
    }, 4000);

    try {
      const iv = visualIdentity
        ? { palette: visualIdentity.palette, fonts: visualIdentity.fonts, style: visualIdentity.style, tone: visualIdentity.tone, logo_url: visualIdentity.logo_url }
        : undefined;

      const selectedLayout = payload.layoutTypes.length > 0 ? payload.layoutTypes[0] : "hero_central";
      const isCarousel = payload.tipoPostagem === "carrossel";
      const totalPieces = isCarousel ? payload.carouselSlides : payload.quantity;
      const results: { post: PostItem; result_url: string | null; result_data: Record<string, unknown> }[] = [];
      const formats = payload.formats && payload.formats.length === totalPieces ? payload.formats : [];

      const slideContents = isCarousel ? buildCarouselSlideContents(
        totalPieces,
        payload.headline,
        payload.subheadline || "",
        payload.supportingText || "",
        payload.bulletPoints || "",
        payload.cta || "",
      ) : null;

      for (let i = 0; i < totalPieces; i++) {
        const pieceFormat = formats.length > 0 ? formats[i] : payload.format;
        const slideData = slideContents?.[i];
        const slideHeadline = slideData?.headline ?? payload.headline;
        const slideSubheadline = slideData?.subheadline ?? (payload.subheadline || undefined);
        const slideSupportingText = slideData?.supportingText ?? (payload.supportingText || undefined);
        const slideBulletPoints = slideData?.bulletPoints ?? (payload.bulletPoints || undefined);
        const slideCta = slideData?.cta ?? (payload.cta || undefined);
        const slideTipo = isCarousel
          ? (i === 0 ? "capa_carrossel" : i === totalPieces - 1 ? "cta_carrossel" : "slide_carrossel")
          : payload.tipoPostagem;

        // Carousel-only: enrich the scene description with series title + per-slide topic
        // so the model produces a cohesive series with distinct slide focus.
        const slideTopic = isCarousel ? (payload.slideTopics?.[i] || "").trim() : "";
        const series = isCarousel ? (payload.seriesTitle || "").trim() : "";
        const carouselContext = isCarousel
          ? [
              series ? `Série: "${series}"` : "",
              `Slide ${i + 1} de ${totalPieces}`,
              slideTopic ? `Tópico deste slide: ${slideTopic}` : "",
            ].filter(Boolean).join(" — ")
          : "";
        const enrichedCena = [carouselContext, payload.cena].filter(Boolean).join("\n") || undefined;

          try {
          const result = await generatePost.mutateAsync({
            type: "art",
            format: pieceFormat,
            style: selectedLayout,
            input_text: slideHeadline,
            reference_image_urls: payload.referenceUrls,
            identidade_visual: iv,
            content_id: payload.contentId || undefined,
            tipo_postagem: slideTipo,
            headline: slideHeadline,
            subheadline: slideSubheadline,
            cta: slideCta,
            cena: enrichedCena,
            elementos_visuais: payload.elementosVisuais || undefined,
            manual_colors: !visualIdentity && payload.manualColors ? payload.manualColors : undefined,
            manual_style: !visualIdentity && payload.manualStyle ? payload.manualStyle : undefined,
            brand_name: payload.brandName || undefined,
            supporting_text: slideSupportingText,
            bullet_points: slideBulletPoints,
            layout_type: selectedLayout,
            logo_url: payload.logoUrl || undefined,
            primary_ref_index: payload.primaryRefIndex,
            objective: payload.objective || undefined,
            photo_image_urls: payload.photoUrls,
            output_mode: payload.outputMode,
            print_format: payload.printFormat,
            // New art direction engine fields
            topic: isCarousel && slideTopic ? slideTopic : payload.topic,
            audience: payload.audience,
            text_mode: payload.textMode,
            restrictions: payload.restrictions,
            elements: payload.elements,
            base_image_url: payload.baseImageUrl,
            character_image_url: payload.characterImageUrl,
            background_image_url: payload.backgroundImageUrl,
            caption: payload.caption,
            // Layout customization (Step 8)
            logo_position: payload.logoPosition,
            title_position: payload.titlePosition,
            background_type: payload.backgroundType,
            color_tone: payload.colorTone,
            primary_color: payload.primaryColor,
            secondary_color: payload.secondaryColor,
          });
          results.push(result);
        } catch (slideErr: unknown) {
          if (isInsufficientCreditsError(slideErr)) {
            if (results.length === 0) {
              setShowCreditsDialog(true);
              setView("art-wizard");
              clearInterval(interval);
              setIsGenerating(false);
              return;
            }
            toast({ title: `Créditos insuficientes após slide ${results.length}`, variant: "destructive" });
            break;
          }
          logger.error(`Slide ${i + 1} failed:`, slideErr);
          toast({ title: `Erro no slide ${i + 1}`, description: (slideErr as Error).message, variant: "destructive" });
        }
      }

      if (results.length > 0) {
        setBatchResults(results);
        setGeneratedResult(results[0]);
      } else {
        toast({ title: "Nenhum slide gerado com sucesso", variant: "destructive" });
        setView("art-wizard");
      }
    } catch (err: unknown) {
      if (isInsufficientCreditsError(err)) {
        setShowCreditsDialog(true);
      } else {
        toast({ title: "Erro na geração", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      }
      setView("art-wizard");
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleArtFillWithAI = async (briefingText: string, cd: Record<string, unknown>): Promise<ArtBriefingResult | null> => {
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
    } catch (err: unknown) {
      toast({ title: "Erro ao preencher com IA", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      return null;
    }
  };

  const handleApproveAll = async () => {
    const results = batchResults.length > 0 ? batchResults : (generatedResult ? [generatedResult] : []);
    try {
      for (const r of results) {
        if (r.post.status !== "approved") {
          await approvePost.mutateAsync({
            postId: r.post.id,
            type: "art",
            numFrames: 0,
            result_url: r.result_url ?? r.post.result_url ?? null,
          });
        }
      }
      resetAll();
    } catch (err: unknown) {
      if (isInsufficientCreditsError(err)) {
        setShowCreditsDialog(true);
      } else {
        toast({ title: "Erro ao aprovar", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      }
    }
  };

  const handleRegenerate = async () => {
    const results = batchResults.length > 0 ? batchResults : (generatedResult ? [generatedResult] : []);
    for (const r of results) {
      if (r.post.status !== "approved") {
        try { await deletePost.mutateAsync(r.post.id); } catch (err) { logger.error("Erro ao excluir rascunho:", err); }
      }
    }
    setGeneratedResult(null);
    setBatchResults([]);
    setView("art-wizard");
  };

  // ═══════ GALLERY ═══════
  if (view === "gallery") {
    return (
      <>
        <PageHeader title="Postagem" subtitle="Crie artes profissionais para suas redes sociais" actions={<FeatureTutorialButton slug="redes_sociais" />} />
        {!metaAccount ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-orange-500/10 px-4 py-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <Instagram className="w-5 h-5 text-pink-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">Conecte sua conta do Instagram</p>
                <p className="text-xs text-muted-foreground truncate">Publique suas artes diretamente do sistema</p>
              </div>
            </div>
            <Button size="sm" onClick={() => connectSocial("instagram")} className="shrink-0">
              <Link2 className="w-4 h-4 mr-2" /> Conectar
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-xs text-foreground">
              <span className="font-semibold">{metaAccount.account_name || "Instagram"}</span> conectado — suas artes podem ser publicadas diretamente
            </p>
          </div>
        )}
        <PostGallery
          posts={posts}
          isLoading={postsLoading}
          onCreateNew={() => canGenerate ? setView("art-wizard") : toast({ title: "Sem permissão", description: "Você não tem permissão para gerar artes.", variant: "destructive" })}
          onViewPost={(post) => {
            setGeneratedResult({ post, result_url: post.result_url, result_data: post.result_data });
            setBatchResults([{ post, result_url: post.result_url, result_data: post.result_data }]);
            setView("result");
          }}
          onDeleteSingle={(id) => deletePost.mutate(id)}
          onBulkDelete={(ids) => bulkDelete.mutate(ids)}
          onBulkApprove={(ids) => bulkApprove.mutate(ids)}
          isDeleting={deletePost.isPending}
          isBulkDeleting={bulkDelete.isPending}
          isBulkApproving={bulkApprove.isPending}
        />
        <InsufficientCreditsDialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog} actionLabel="esta arte" creditCost={CREDIT_COST_ART} />
        <PublicarModal
          open={showPublishModal}
          onOpenChange={setShowPublishModal}
          postId={publishPostId}
        />
      </>
    );
  }

  // ═══════ ART WIZARD ═══════
  if (view === "art-wizard") {
    return (
      <>
        <PageHeader title="Postagem" subtitle="Criar nova arte" />
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

  // ═══════ RESULT ═══════
  if (view === "result") {
    const currentPostId = generatedResult?.post?.id ?? null;
    return (
      <>
        <PostResult
          isGenerating={isGenerating}
          loadingPhraseIdx={loadingPhraseIdx}
          generatedResult={generatedResult}
          batchResults={batchResults}
          postType="art"
          videoDuration="5s"
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
        {!isGenerating && currentPostId && (
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPublishPostId(currentPostId);
                setShowPublishModal(true);
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Publicar nas Redes
            </Button>
          </div>
        )}
        <InsufficientCreditsDialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog} actionLabel="este material" creditCost={CREDIT_COST_ART} />
        <PublicarModal
          open={showPublishModal}
          onOpenChange={setShowPublishModal}
          postId={publishPostId}
        />
      </>
    );
  }

  return null;
}
