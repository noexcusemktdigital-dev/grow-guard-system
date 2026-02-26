import { useState, useEffect, useRef, useCallback } from "react";
import {
  Palette, Edit3, Check, Plus, Sparkles, Copy, Download,
  Eye, Image, Upload, Calendar as CalendarIcon, ChevronLeft,
  ChevronRight, BookOpen, Clock, FolderOpen, Folder,
  ArrowLeft, Hash, Layout, CheckCircle2, Circle, Star,
  Type, AlignCenter, AlignLeft, AlignRight, Minus,
  ZoomIn, ArrowRight, Users, FileText, Lock, CreditCard, AlertTriangle, Video, Music, Film, Play,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ApprovalPanel, ApprovalStatusBadge, type ApprovalStatus } from "@/components/approval/ApprovalPanel";
import { ApprovalSummary } from "@/components/approval/ApprovalSummary";
import { UsageQuotaBanner } from "@/components/quota/UsageQuotaBanner";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { getPlanBySlug, CREDIT_PACKS } from "@/constants/plans";
import { HelpTooltip } from "@/components/HelpTooltip";
import { useVisualIdentity, useSaveVisualIdentity, isVisualIdentityComplete } from "@/hooks/useVisualIdentity";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { generateVideoFromFrames } from "@/lib/videoGenerator";

/* ── Types ── */
interface SocialConcept {
  titulo: string;
  legenda: string;
  cta: string;
  hashtags: string[];
  visual_prompt_feed: string;
  visual_prompt_story: string;
  video_script?: string;
  video_description?: string;
  audio_suggestion?: string;
  visual_prompt_thumbnail?: string;
}

interface GeneratedArt {
  id: string;
  titulo: string;
  legenda: string;
  cta: string;
  hashtags: string[];
  feedUrl: string | null;
  storyUrl: string | null;
  status: ApprovalStatus;
  changeNote?: string;
  createdAt?: string;
  videoScript?: string;
  videoDescription?: string;
  audioSuggestion?: string;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  videoFrameUrls?: string[];
  format?: string;
  artStyle?: string;
  hasRevision?: boolean;
  revisionNote?: string;
  originalPrompt?: string;
}

interface ArtCampaign {
  id: string;
  mes: string;
  label: string;
  createdAt: string;
  arts: GeneratedArt[];
}

/* ── Canvas text config ── */
interface TextConfig {
  text: string;
  position: "top" | "center" | "bottom";
  color: "white" | "black" | "primary";
  size: "sm" | "md" | "lg";
}

/* ── Constants ── */
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const OBJETIVOS = ["Promoção", "Engajamento", "Institucional", "Lançamento", "Depoimento"];
const ESTILOS = ["Minimalista", "Bold", "Corporativo", "Criativo", "Elegante"];
const TIPOS_POST = [
  { value: "produto", label: "Produto" },
  { value: "servico", label: "Serviço" },
  { value: "promocao", label: "Promoção" },
  { value: "institucional", label: "Institucional" },
  { value: "educativo", label: "Educativo" },
  { value: "depoimento", label: "Depoimento" },
];
const NIVEIS = [
  { value: "simples", label: "Simples", desc: "Clean e profissional" },
  { value: "elaborado", label: "Elaborado", desc: "Composição forte e vibrante" },
  { value: "alto_padrao", label: "Alto Padrão", desc: "Ultra-premium, qualidade de revista" },
];
const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/* ── Art Style Types ── */
const ART_STYLES = [
  { value: "foto_texto", label: "Foto + Texto", desc: "Foto de fundo com texto sobreposto elegante", icon: "📸" },
  { value: "composicao", label: "Composição Gráfica", desc: "Design gráfico com formas e elementos visuais", icon: "🎨" },
  { value: "mockup", label: "Mockup de Produto", desc: "Produto em contexto realista (mesa, mão, etc)", icon: "📦" },
  { value: "quote", label: "Quote Card", desc: "Citação ou dado em destaque com fundo estilizado", icon: "💬" },
  { value: "before_after", label: "Antes & Depois", desc: "Comparação visual lado a lado", icon: "🔄" },
];

const VIDEO_STYLES = [
  { value: "slideshow", label: "Slideshow + Texto", desc: "Imagens com texto animado e transições suaves (5-15s)", icon: "🖼️" },
  { value: "kinetic", label: "Texto Animado", desc: "Kinetic typography sobre fundo estilizado (5-10s)", icon: "✨" },
  { value: "revelacao", label: "Revelação de Produto", desc: "Zoom in dramático com texto revelado (10-15s)", icon: "🎬" },
  { value: "countdown", label: "Countdown", desc: "Contagem regressiva para oferta ou lançamento (5-10s)", icon: "⏳" },
];

/* ── Format Types ── */
const ART_FORMATS = [
  { value: "feed", label: "Feed (1:1)", desc: "1080×1080px", icon: "⬜" },
  { value: "story", label: "Story (9:16)", desc: "1080×1920px", icon: "📱" },
  { value: "carrossel", label: "Carrossel", desc: "Múltiplos slides 1:1", icon: "📑" },
];

const VIDEO_FORMATS = [
  { value: "reels", label: "Reels (9:16)", desc: "Vídeo curto 5-15s", icon: "🎬" },
  { value: "story_video", label: "Story Animado", desc: "Vídeo vertical 5-10s", icon: "📱" },
];

const loadingPhrases = [
  "Analisando seu briefing...",
  "Criando conceitos visuais...",
  "Definindo paleta de cores...",
  "Gerando prompts otimizados...",
  "Preparando artes de Feed...",
  "Preparando artes de Story...",
  "Aplicando identidade visual...",
  "Finalizando composição...",
];

/* ── Canvas Editor Component ── */
function CanvasEditor({ imageUrl, textConfig, onTextChange, format: fmt }: {
  imageUrl: string;
  textConfig: TextConfig;
  onTextChange: (cfg: TextConfig) => void;
  format: "feed" | "story";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const canvasW = fmt === "feed" ? 540 : 270;
  const canvasH = fmt === "feed" ? 540 : 480;
  const realW = fmt === "feed" ? 1080 : 1080;
  const realH = fmt === "feed" ? 1080 : 1920;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = realW;
    canvas.height = realH;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, realW, realH);
    if (!textConfig.text.trim()) return;
    const fontSize = textConfig.size === "sm" ? realW * 0.04 : textConfig.size === "md" ? realW * 0.06 : realW * 0.08;
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    const fillColor = textConfig.color === "white" ? "#FFFFFF" : textConfig.color === "black" ? "#000000" : "#E63946";
    ctx.fillStyle = fillColor;
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = fontSize * 0.3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    const maxWidth = realW * 0.85;
    const lines = wrapText(ctx, textConfig.text, maxWidth);
    const lineHeight = fontSize * 1.3;
    const totalTextH = lines.length * lineHeight;
    let startY: number;
    if (textConfig.position === "top") startY = realH * 0.12;
    else if (textConfig.position === "bottom") startY = realH - totalTextH - realH * 0.08;
    else startY = (realH - totalTextH) / 2;
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, startY - lineHeight * 0.4, realW, totalTextH + lineHeight * 0.8);
    ctx.fillStyle = fillColor;
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = fontSize * 0.3;
    lines.forEach((line, i) => {
      ctx.fillText(line, realW / 2, startY + i * lineHeight + fontSize);
    });
  }, [imageUrl, textConfig, realW, realH]);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imgRef.current = img; drawCanvas(); };
    img.src = imageUrl;
  }, [imageUrl, drawCanvas]);

  useEffect(() => { if (imgRef.current) drawCanvas(); }, [textConfig, drawCanvas]);

  const downloadImage = (withText: boolean) => {
    if (!canvasRef.current || !imgRef.current) return;
    if (!withText) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `arte-${fmt}.png`;
      link.click();
      return;
    }
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = `arte-${fmt}-com-texto.png`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center bg-muted/30 rounded-xl p-3">
        <canvas ref={canvasRef} style={{ width: canvasW, height: canvasH }} className="rounded-lg shadow-lg" />
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1.5"><Type className="w-3.5 h-3.5" /> Texto sobre a imagem</Label>
          <Textarea value={textConfig.text} onChange={(e) => onTextChange({ ...textConfig, text: e.target.value })} rows={2} placeholder="Ex: 20% OFF em Fevereiro" className="text-sm" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Posição</Label>
            <Select value={textConfig.position} onValueChange={(v) => onTextChange({ ...textConfig, position: v as any })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Topo</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="bottom">Rodapé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Cor</Label>
            <Select value={textConfig.color} onValueChange={(v) => onTextChange({ ...textConfig, color: v as any })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="white">Branco</SelectItem>
                <SelectItem value="black">Preto</SelectItem>
                <SelectItem value="primary">Primária</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Tamanho</Label>
            <Select value={textConfig.size} onValueChange={(v) => onTextChange({ ...textConfig, size: v as any })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Pequeno</SelectItem>
                <SelectItem value="md">Médio</SelectItem>
                <SelectItem value="lg">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 text-xs gap-1.5" onClick={() => downloadImage(true)}>
            <Download className="w-3.5 h-3.5" /> Com Texto
          </Button>
          <Button size="sm" variant="ghost" className="flex-1 text-xs gap-1.5" onClick={() => downloadImage(false)}>
            <Download className="w-3.5 h-3.5" /> Sem Texto
          </Button>
        </div>
      </div>
    </div>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) { lines.push(current); current = word; }
    else current = test;
  }
  if (current) lines.push(current);
  return lines;
}

/* ── Visual Identity Gate ── */
function VisualIdentityGate({ onGoToIdentity }: { onGoToIdentity: () => void }) {
  return (
    <Card className="border-2 border-amber-500/30 bg-amber-500/5">
      <CardContent className="py-8 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h3 className="text-base font-bold">Identidade Visual Necessária</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Para gerar artes de alta qualidade, primeiro configure sua identidade visual com paleta de cores e estilo.
          </p>
        </div>
        <Button className="gap-2" onClick={onGoToIdentity}>
          <Palette className="w-4 h-4" /> Configurar Identidade Visual
        </Button>
      </CardContent>
    </Card>
  );
}

/* ── Main Page ── */
export default function ClienteRedesSociais() {
  const { data: subscription } = useClienteSubscription();
  const plan = getPlanBySlug(subscription?.plan);
  const maxArts = plan?.maxSocialArts ?? 4;
  const planName = plan?.name ?? "Starter";
  const { data: orgId } = useUserOrgId();

  // Visual Identity from DB
  const { data: visualIdentity, isLoading: viLoading } = useVisualIdentity();
  const saveVI = useSaveVisualIdentity();
  const viComplete = isVisualIdentityComplete(visualIdentity);

  // VI form state
  const [viPalette, setViPalette] = useState<{ hex: string; label?: string }[]>([]);
  const [viFonts, setViFonts] = useState("");
  const [viStyle, setViStyle] = useState("");
  const [viTone, setViTone] = useState("");
  const [viLogoUrl, setViLogoUrl] = useState("");
  const [viRefLinks, setViRefLinks] = useState("");
  const [viEditing, setViEditing] = useState(false);
  const [newColorHex, setNewColorHex] = useState("#E63946");
  const [newColorLabel, setNewColorLabel] = useState("");

  // Sync VI from DB
  useEffect(() => {
    if (visualIdentity) {
      setViPalette(visualIdentity.palette || []);
      setViFonts((visualIdentity.fonts || []).join(", "));
      setViStyle(visualIdentity.style || "");
      setViTone(visualIdentity.tone || "");
      setViLogoUrl(visualIdentity.logo_url || "");
      setViRefLinks((visualIdentity.reference_links || []).join("\n"));
    }
  }, [visualIdentity]);

  // Campaigns
  const [campaigns, setCampaigns] = useState<ArtCampaign[]>([]);
  const [openCampaign, setOpenCampaign] = useState<string | null>(null);
  const [selectedArt, setSelectedArt] = useState<GeneratedArt | null>(null);
  const [editorFormat, setEditorFormat] = useState<"feed" | "story">("feed");
  const [textConfig, setTextConfig] = useState<TextConfig>({ text: "", position: "bottom", color: "white", size: "md" });

  // Wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genTotal, setGenTotal] = useState(0);
  const [genMessage, setGenMessage] = useState("");
  const [loadingPhrase, setLoadingPhrase] = useState(0);

  // Briefing
  const [bMes, setBMes] = useState("Março 2026");
  const [bObjetivo, setBObjetivo] = useState("");
  const [bEstilo, setBEstilo] = useState("");
  const [bCores, setBCores] = useState("");
  const [bTemas, setBTemas] = useState("");
  const [bPromocoes, setBPromocoes] = useState("");
  const [bObs, setBObs] = useState("");
  const [bQtd, setBQtd] = useState("4");
  const [bTipoPost, setBTipoPost] = useState("institucional");
  const [bNivel, setBNivel] = useState("elaborado");
  const [bDescricaoProduto, setBDescricaoProduto] = useState("");

  // Flow
  const [wizardFlow, setWizardFlow] = useState<"choose" | "content" | "briefing">("choose");
  const [contentCampaigns, setContentCampaigns] = useState<any[]>([]);
  const [selectedContents, setSelectedContents] = useState<string[]>([]);

  // Persona
  const [personaNome, setPersonaNome] = useState("");
  const [personaDescricao, setPersonaDescricao] = useState("");
  const [referenciasTipo, setReferenciasTipo] = useState("");

  // Visual References (briefing)
  const [bReferenceImages, setBReferenceImages] = useState<{ url: string; isUpload: boolean; fileName?: string; isFile?: boolean }[]>([]);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [refUrlInput, setRefUrlInput] = useState("");

  // Video
  const [bIncluirVideo, setBIncluirVideo] = useState(false);

  // Format quantities (new wizard)
  const [fmtFeed, setFmtFeed] = useState(0);
  const [fmtStory, setFmtStory] = useState(0);
  const [fmtCarrossel, setFmtCarrossel] = useState(0);
  const [fmtReels, setFmtReels] = useState(0);
  const [fmtStoryVideo, setFmtStoryVideo] = useState(0);
  const totalFormats = fmtFeed + fmtStory + fmtCarrossel + fmtReels + fmtStoryVideo;

  // Style selection
  const [selectedArtStyle, setSelectedArtStyle] = useState("");
  const [selectedVideoStyle, setSelectedVideoStyle] = useState("");
  const hasVideoFormats = fmtReels > 0 || fmtStoryVideo > 0;
  const hasArtFormats = fmtFeed > 0 || fmtStory > 0 || fmtCarrossel > 0;

  // Wizard step for briefing flow
  const [briefingStep, setBriefingStep] = useState(1);

  // Revision state
  const [revisionArtId, setRevisionArtId] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [isRevising, setIsRevising] = useState(false);

  // Image Bank (visual identity)
  const [uploadingBank, setUploadingBank] = useState(false);

  // Calendar
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));
  // Active tab
  const [activeTab, setActiveTab] = useState("campanhas");

  // Arts quota
  const artsThisMonth = campaigns.reduce((acc, c) => acc + c.arts.length, 0);
  const saldoRestanteArtes = maxArts === -1 ? Infinity : Math.max(0, maxArts - artsThisMonth);

  useEffect(() => {
    if (!isGenerating || genProgress > 0) return;
    const interval = setInterval(() => setLoadingPhrase((p) => (p + 1) % loadingPhrases.length), 2500);
    return () => clearInterval(interval);
  }, [isGenerating, genProgress]);

  /* ── Build identity visual for AI ── */
  const getIdentidadeVisual = () => ({
    paleta: viPalette.map(c => c.hex).join(", "),
    estilo: viStyle,
    tom_visual: viTone,
    fontes: viFonts,
    referencias: viRefLinks,
  });

  /* ── Reference image helpers ── */
  const handleRefUpload = async (files: FileList | null) => {
    if (!files || !orgId) return;
    setUploadingRef(true);
    try {
      for (let i = 0; i < Math.min(files.length, 5 - bReferenceImages.length); i++) {
        const file = files[i];
        const path = `references/${orgId}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("social-arts").upload(path, file, { contentType: file.type, upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("social-arts").getPublicUrl(path);
        const isImageFile = file.type.startsWith("image/");
        setBReferenceImages(prev => [...prev, { url: urlData.publicUrl, isUpload: true, fileName: file.name, isFile: !isImageFile }]);
      }
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err?.message, variant: "destructive" });
    } finally {
      setUploadingRef(false);
    }
  };

  const addRefUrl = () => {
    if (!refUrlInput.trim() || bReferenceImages.length >= 5) return;
    setBReferenceImages(prev => [...prev, { url: refUrlInput.trim(), isUpload: false }]);
    setRefUrlInput("");
  };

  const removeRef = (idx: number) => {
    setBReferenceImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleBankUpload = async (files: FileList | null) => {
    if (!files || !orgId) return;
    setUploadingBank(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `bank/${orgId}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("social-arts").upload(path, file, { contentType: file.type, upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("social-arts").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
      const current = visualIdentity?.image_bank_urls || [];
      await saveVI.mutateAsync({ image_bank_urls: [...current, ...newUrls] });
      toast({ title: `${newUrls.length} imagem(ns) adicionada(s) ao banco!` });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err?.message, variant: "destructive" });
    } finally {
      setUploadingBank(false);
    }
  };

  const removeBankImage = async (url: string) => {
    const current = visualIdentity?.image_bank_urls || [];
    await saveVI.mutateAsync({ image_bank_urls: current.filter(u => u !== url) });
  };

  const loadContentCampaigns = () => {
    try {
      const stored = localStorage.getItem("content-campaigns");
      if (stored) { const parsed = JSON.parse(stored); setContentCampaigns(Array.isArray(parsed) ? parsed : []); }
    } catch {}
  };

  /* ── Save Visual Identity ── */
  const handleSaveVI = async () => {
    try {
      await saveVI.mutateAsync({
        palette: viPalette,
        fonts: viFonts.split(",").map(f => f.trim()).filter(Boolean),
        style: viStyle || null,
        tone: viTone || null,
        logo_url: viLogoUrl || null,
        reference_links: viRefLinks.split("\n").map(l => l.trim()).filter(Boolean),
      });
      setViEditing(false);
      toast({ title: "Identidade Visual salva!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err?.message, variant: "destructive" });
    }
  };

  const addColor = () => {
    if (!newColorHex) return;
    setViPalette(prev => [...prev, { hex: newColorHex, label: newColorLabel || undefined }]);
    setNewColorHex("#000000");
    setNewColorLabel("");
  };

  const removeColor = (idx: number) => {
    setViPalette(prev => prev.filter((_, i) => i !== idx));
  };

  /* ── Revision Handler ── */
  const handleRevision = async (art: GeneratedArt) => {
    if (!revisionNote.trim() || !orgId) return;
    setIsRevising(true);
    try {
      const identidade_visual = getIdentidadeVisual();
      const revisedPrompt = `${art.originalPrompt || art.titulo}\n\nALTERAÇÃO SOLICITADA: ${revisionNote}`;
      const slug = art.titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
      const timestamp = Date.now();

      const { data: feedData } = await supabase.functions.invoke("generate-social-image", {
        body: {
          prompt: revisedPrompt, format: "feed",
          file_path: `${timestamp}/${slug}-rev-feed.png`, nivel: bNivel,
          identidade_visual, organization_id: orgId,
        },
      });

      const { data: storyData } = await supabase.functions.invoke("generate-social-image", {
        body: {
          prompt: revisedPrompt, format: "story",
          file_path: `${timestamp}/${slug}-rev-story.png`, nivel: bNivel,
          identidade_visual, organization_id: orgId,
        },
      });

      setCampaigns(prev => prev.map(c => ({
        ...c,
        arts: c.arts.map(a => a.id === art.id ? {
          ...a,
          feedUrl: feedData?.url || a.feedUrl,
          storyUrl: storyData?.url || a.storyUrl,
          hasRevision: true,
          revisionNote,
        } : a),
      })));

      if (selectedArt?.id === art.id) {
        setSelectedArt(prev => prev ? {
          ...prev,
          feedUrl: feedData?.url || prev.feedUrl,
          storyUrl: storyData?.url || prev.storyUrl,
          hasRevision: true,
          revisionNote,
        } : null);
      }

      setRevisionArtId(null);
      setRevisionNote("");
      toast({ title: "Arte regenerada com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro na revisão", description: err?.message, variant: "destructive" });
    } finally {
      setIsRevising(false);
    }
  };

  /* ── Generate Arts ── */
  const handleGenerate = async () => {
    if (!bObjetivo || !bEstilo) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    let scriptsToUse: any[] = [];
    if (wizardFlow === "content" && selectedContents.length > 0) {
      contentCampaigns.forEach((camp: any) => {
        (camp.conteudos || []).forEach((c: any) => {
          if (selectedContents.includes(c.id)) {
            scriptsToUse.push({ titulo: c.titulo, roteiro: c.roteiro, funil: c.funil, formato: c.formato });
          }
        });
      });
    }

    const qty = Math.max(1, Math.min(10, Number(bQtd) || 4));
    setIsGenerating(true);
    setGenProgress(0);
    setGenTotal(qty * 2);
    setGenMessage("Gerando conceitos com IA...");

    const personaData = (personaNome || personaDescricao) ? { nome: personaNome, descricao: personaDescricao } : undefined;
    const identidade_visual = getIdentidadeVisual();

    try {
      const { data: conceptsData, error: conceptsError } = await supabase.functions.invoke("generate-social-concepts", {
        body: {
          briefing: { mes: bMes, objetivo: bObjetivo, cores: bCores || identidade_visual.paleta, temas: bTemas, promocoes: bPromocoes, observacoes: bObs },
          quantidade: qty,
          estilo: bEstilo,
          tipo_post: bTipoPost,
          nivel: bNivel,
          descricao_produto: bDescricaoProduto || undefined,
          roteiros_importados: scriptsToUse.length > 0 ? scriptsToUse : undefined,
          persona: personaData,
          identidade_visual,
          referencias_tipo: referenciasTipo || undefined,
           organization_id: orgId,
          incluir_video: bIncluirVideo || undefined,
          reference_images: bReferenceImages.length > 0
            ? bReferenceImages.map(r => r.url)
            : (visualIdentity?.image_bank_urls?.length ? visualIdentity.image_bank_urls.slice(0, 3) : undefined),
        },
      });

      if (conceptsError) throw conceptsError;
      const concepts: SocialConcept[] = conceptsData?.concepts || [];
      if (!concepts.length) throw new Error("Nenhum conceito gerado");

      const arts: GeneratedArt[] = [];
      const timestamp = Date.now();

      for (let i = 0; i < concepts.length; i++) {
        const concept = concepts[i];
        const slug = concept.titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);

        setGenMessage(`Gerando arte ${i * 2 + 1} de ${qty * 2}...`);
        setGenProgress(i * 2 + 1);

        let feedUrl: string | null = null;
        try {
          const { data: feedData, error: feedError } = await supabase.functions.invoke("generate-social-image", {
            body: {
              prompt: concept.visual_prompt_feed, format: "feed",
              file_path: `${timestamp}/${slug}-feed.png`, nivel: bNivel,
              persona: personaData, identidade_visual, organization_id: orgId,
              reference_images: bReferenceImages.length > 0
                ? bReferenceImages.slice(0, 3).map(r => r.url)
                : (visualIdentity?.image_bank_urls?.slice(0, 3) || undefined),
            },
          });
          if (!feedError && feedData?.url) feedUrl = feedData.url;
        } catch (e) { console.error("Feed image error:", e); }

        setGenMessage(`Gerando arte ${i * 2 + 2} de ${qty * 2}...`);
        setGenProgress(i * 2 + 2);

        let storyUrl: string | null = null;
        try {
          const { data: storyData, error: storyError } = await supabase.functions.invoke("generate-social-image", {
            body: {
              prompt: concept.visual_prompt_story, format: "story",
              file_path: `${timestamp}/${slug}-story.png`, nivel: bNivel,
              persona: personaData, identidade_visual, organization_id: orgId,
              reference_images: bReferenceImages.length > 0
                ? bReferenceImages.slice(0, 3).map(r => r.url)
                : (visualIdentity?.image_bank_urls?.slice(0, 3) || undefined),
            },
          });
          if (!storyError && storyData?.url) storyUrl = storyData.url;
        } catch (e) { console.error("Story image error:", e); }

        // Generate video thumbnail if video script exists
        let thumbnailUrl: string | null = null;
        if (concept.visual_prompt_thumbnail) {
          try {
            const { data: thumbData, error: thumbError } = await supabase.functions.invoke("generate-social-image", {
              body: {
                prompt: concept.visual_prompt_thumbnail, format: "feed",
                file_path: `${timestamp}/${slug}-thumb.png`, nivel: bNivel,
                persona: personaData, identidade_visual, organization_id: orgId,
              },
            });
            if (!thumbError && thumbData?.url) thumbnailUrl = thumbData.url;
          } catch (e) { console.error("Thumbnail error:", e); }
        }

        const artId = `art-${timestamp}-${i}`;
        
        // Generate video frames if video is enabled and we have a description
        let videoUrl: string | null = null;
        let videoFrameUrls: string[] = [];
        
        if (bIncluirVideo && concept.video_description) {
          setGenMessage(`Gerando frames de vídeo ${i + 1}/${concepts.length}...`);
          try {
            const { data: framesData, error: framesError } = await supabase.functions.invoke("generate-social-video-frames", {
              body: {
                video_description: concept.video_description,
                visual_prompt_thumbnail: concept.visual_prompt_thumbnail,
                identidade_visual,
                organization_id: orgId,
                art_id: artId,
                num_frames: 5,
                reference_images: bReferenceImages.length > 0
                  ? bReferenceImages.slice(0, 2).map(r => r.url)
                  : undefined,
              },
            });
            
            if (!framesError && framesData?.frameUrls?.length) {
              videoFrameUrls = framesData.frameUrls;
              
              // Assemble video with ffmpeg.wasm
              setGenMessage(`Montando vídeo ${i + 1}/${concepts.length}...`);
              try {
                const videoBlob = await generateVideoFromFrames(videoFrameUrls, {
                  frameDurationSeconds: 3,
                  fps: 24,
                  transitionFrames: 12,
                  onProgress: (msg) => setGenMessage(msg),
                });
                
                // Upload video to storage
                const videoPath = `videos/${orgId}/${artId}/reel.mp4`;
                const { error: videoUploadError } = await supabase.storage
                  .from("social-arts")
                  .upload(videoPath, videoBlob, { contentType: "video/mp4", upsert: true });
                
                if (!videoUploadError) {
                  const { data: videoUrlData } = supabase.storage.from("social-arts").getPublicUrl(videoPath);
                  videoUrl = videoUrlData.publicUrl;
                }
              } catch (ffmpegErr) {
                console.error("FFmpeg assembly error:", ffmpegErr);
                toast({ title: "Aviso", description: "Frames gerados, mas a montagem do vídeo falhou. Os frames estão disponíveis individualmente.", variant: "destructive" });
              }
            }
          } catch (videoErr) {
            console.error("Video frames error:", videoErr);
          }
        }

        arts.push({
          id: artId, titulo: concept.titulo, legenda: concept.legenda,
          cta: concept.cta, hashtags: concept.hashtags, feedUrl, storyUrl,
          status: "pending" as ApprovalStatus, createdAt: new Date().toISOString(),
          videoScript: concept.video_script, videoDescription: concept.video_description,
          audioSuggestion: concept.audio_suggestion, thumbnailUrl,
          videoUrl, videoFrameUrls: videoFrameUrls.length > 0 ? videoFrameUrls : undefined,
        });
      }

      const newCampaign: ArtCampaign = {
        id: `campaign-${timestamp}`, mes: bMes, label: bMes,
        createdAt: new Date().toLocaleDateString("pt-BR"), arts,
      };

      setCampaigns((prev) => [newCampaign, ...prev]);
      setOpenCampaign(newCampaign.id);
      setWizardOpen(false);
      setWizardFlow("choose");
      toast({ title: "Artes geradas!", description: `${arts.length} posts criados para ${bMes}.` });
    } catch (err: any) {
      console.error("Generation error:", err);
      toast({ title: "Erro ao gerar artes", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setGenProgress(0);
    }
  };

  const updateArtStatus = (artId: string, newStatus: ApprovalStatus, changeNote?: string) => {
    setCampaigns((prev) => prev.map((c) => ({
      ...c, arts: c.arts.map((a) => a.id === artId ? { ...a, status: newStatus, changeNote: changeNote || a.changeNote } : a),
    })));
    if (selectedArt?.id === artId) setSelectedArt((prev) => prev ? { ...prev, status: newStatus, changeNote: changeNote || prev.changeNote } : null);
  };

  const approveAll = (campaignId: string) => {
    setCampaigns((prev) => prev.map((c) => c.id === campaignId ? { ...c, arts: c.arts.map((a) => ({ ...a, status: "approved" as ApprovalStatus })) } : c));
    toast({ title: "Todas as artes aprovadas!" });
  };

  const approvePending = (campaignId: string) => {
    setCampaigns((prev) => prev.map((c) => c.id === campaignId ? { ...c, arts: c.arts.map((a) => a.status === "pending" ? { ...a, status: "approved" as ApprovalStatus } : a) } : c));
    toast({ title: "Artes pendentes aprovadas!" });
  };

  const openEditor = (art: GeneratedArt, fmt: "feed" | "story") => {
    setSelectedArt(art);
    setEditorFormat(fmt);
    setTextConfig({ text: art.cta || art.titulo, position: "bottom", color: "white", size: "md" });
  };

  const currentCampaign = campaigns.find((c) => c.id === openCampaign);

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = (getDay(monthStart) + 6) % 7;

  // Arts on calendar
  const getArtsForDay = (day: Date) => {
    const results: { art: GeneratedArt; campaign: ArtCampaign }[] = [];
    campaigns.forEach(camp => {
      camp.arts.forEach(art => {
        if (art.createdAt && isSameDay(parseISO(art.createdAt), day)) {
          results.push({ art, campaign: camp });
        }
      });
    });
    return results;
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Redes Sociais"
        subtitle="Gere artes profissionais com IA e edite textos antes de publicar"
        icon={<Palette className="w-5 h-5 text-primary" />}
      />

      {/* ── Art Balance Card ── */}
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Image className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  Artes do mês: <span className="text-primary">{artsThisMonth}</span>/{maxArts === -1 ? "∞" : maxArts}
                </p>
                <p className="text-xs text-muted-foreground">Plano {planName} • {maxArts === -1 ? "Ilimitado" : `${saldoRestanteArtes} artes restantes`}</p>
              </div>
            </div>
          </div>
          {maxArts !== -1 && (
            <Progress value={(artsThisMonth / maxArts) * 100} className="h-1.5 mt-3" />
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campanhas" className="text-xs gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Campanhas</TabsTrigger>
          <TabsTrigger value="base" className="text-xs gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Identidade Visual
            {!viComplete && !viLoading && <span className="ml-1 w-2 h-2 rounded-full bg-amber-500 inline-block" />}
          </TabsTrigger>
          <TabsTrigger value="calendario" className="text-xs gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> Calendário de Postagens</TabsTrigger>
        </TabsList>

        {/* ═══ CAMPANHAS ═══ */}
        <TabsContent value="campanhas" className="space-y-4 mt-4">
          {!viComplete && !viLoading ? (
            <VisualIdentityGate onGoToIdentity={() => setActiveTab("base")} />
          ) : (
            <>
              <UsageQuotaBanner used={artsThisMonth} limit={maxArts} label="artes sociais" planName={planName} />

              <Button
                className="w-full gap-2 h-12 text-sm font-semibold"
                onClick={() => {
                  if (maxArts !== -1 && artsThisMonth >= maxArts) {
                    toast({ title: "Limite atingido", description: "Faça upgrade ou recarregue artes.", variant: "destructive" });
                    return;
                  }
                  setWizardOpen(true); setWizardFlow("choose"); loadContentCampaigns(); setSelectedContents([]);
                }}
                disabled={maxArts !== -1 && artsThisMonth >= maxArts}
              >
                <Plus className="w-4 h-4" /> Nova Criação Mensal
              </Button>

              {/* Wizard Dialog */}
              <Dialog open={wizardOpen} onOpenChange={(open) => { if (!isGenerating) { setWizardOpen(open); if (!open) setWizardFlow("choose"); } }}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-5">
                      <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="p-4 rounded-full bg-primary/10">
                        <Sparkles className="w-10 h-10 text-primary" />
                      </motion.div>
                      {genProgress > 0 ? (
                        <div className="w-full max-w-xs space-y-3">
                          <Progress value={(genProgress / genTotal) * 100} className="h-2" />
                          <p className="text-sm text-center text-muted-foreground">{genMessage}</p>
                        </div>
                      ) : (
                        <AnimatePresence mode="wait">
                          <motion.p key={loadingPhrase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-sm text-muted-foreground text-center">
                            {loadingPhrases[loadingPhrase]}
                          </motion.p>
                        </AnimatePresence>
                      )}
                      <p className="text-xs text-muted-foreground/60">A geração pode levar alguns minutos...</p>
                    </div>
                  ) : wizardFlow === "choose" ? (
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Nova Criação Mensal</DialogTitle>
                      </DialogHeader>
                      <p className="text-xs text-muted-foreground">Escolha como deseja criar suas artes.</p>
                      <div className="space-y-3 mt-2">
                        <Card className="cursor-pointer ring-2 ring-primary/30 bg-primary/[0.03] hover:bg-primary/[0.06] transition-all" onClick={() => {
                          if (contentCampaigns.length > 0) { setWizardFlow("content"); } else {
                            toast({ title: "Nenhuma campanha de conteúdo", description: "Crie conteúdos primeiro.", variant: "destructive" });
                          }
                        }}>
                          <CardContent className="py-5 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/15"><FileText className="w-6 h-6 text-primary" /></div>
                            <div className="flex-1">
                              <p className="text-sm font-bold">Gerar a partir dos Conteúdos</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Selecione conteúdos já criados e transforme em artes visuais.</p>
                              {contentCampaigns.length > 0 ? (
                                <Badge variant="secondary" className="text-[10px] mt-2">{contentCampaigns.reduce((acc: number, c: any) => acc + (c.conteudos?.length || 0), 0)} conteúdos disponíveis</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] mt-2 text-muted-foreground">Nenhum conteúdo — crie primeiro</Badge>
                              )}
                            </div>
                            <ArrowRight className="w-5 h-5 text-primary" />
                          </CardContent>
                        </Card>
                        <Card className="cursor-pointer glass-card hover:bg-muted/30 transition-all" onClick={() => setWizardFlow("briefing")}>
                          <CardContent className="py-4 flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-muted"><Edit3 className="w-5 h-5 text-muted-foreground" /></div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold">Criar do zero (briefing)</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Preencha um briefing completo.</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  ) : wizardFlow === "content" ? (
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> A partir dos Conteúdos</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <p className="text-xs text-muted-foreground">Selecione os conteúdos para transformar em artes visuais.</p>
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <p className="text-xs font-semibold">Saldo: {maxArts === -1 ? "Ilimitado" : `${saldoRestanteArtes} artes restantes`}</p>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                          {contentCampaigns.map((camp: any) => (
                            <div key={camp.id}>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{camp.label}</p>
                              {(camp.conteudos || []).map((c: any) => {
                                const isChecked = selectedContents.includes(c.id);
                                const wouldExceed = !isChecked && maxArts !== -1 && selectedContents.length >= saldoRestanteArtes;
                                return (
                                  <label key={c.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${wouldExceed && !isChecked ? "opacity-50" : "hover:bg-muted/30"}`}>
                                    <input type="checkbox" checked={isChecked} disabled={wouldExceed && !isChecked}
                                      onChange={(e) => setSelectedContents(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} className="rounded" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{c.titulo}</p>
                                      <div className="flex gap-1 mt-0.5">
                                        <Badge variant="outline" className="text-[8px]">{c.formato}</Badge>
                                        <Badge variant="outline" className="text-[8px]">{c.funil}</Badge>
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={() => setWizardFlow("choose")}><ArrowLeft className="w-4 h-4" /> Voltar</Button>
                          <Button className="flex-1" onClick={() => { setBQtd(String(Math.min(selectedContents.length, maxArts === -1 ? 10 : saldoRestanteArtes))); setWizardFlow("briefing"); }} disabled={selectedContents.length === 0}>
                            {selectedContents.length} selecionado(s) <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* ── BRIEFING (Multi-step) ── */
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Edit3 className="w-5 h-5 text-primary" /> Briefing Visual — Etapa {briefingStep} de 4
                        </DialogTitle>
                      </DialogHeader>
                      {/* Step indicators */}
                      <div className="flex gap-2 mb-2">
                        {[1, 2, 3, 4].map((s) => (
                          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= briefingStep ? "bg-primary" : "bg-muted"}`} />
                        ))}
                      </div>

                      {briefingStep === 1 && (
                        <div className="space-y-4 mt-2">
                          <p className="text-xs text-muted-foreground">Preencha o briefing da criação. Quanto mais detalhado, melhor.</p>
                          {/* VI summary */}
                          {viComplete && (
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center gap-3">
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold">Identidade Visual aplicada</p>
                                <div className="flex gap-1 mt-1">
                                  {viPalette.slice(0, 5).map((c, i) => (
                                    <div key={i} className="w-4 h-4 rounded-full border" style={{ backgroundColor: c.hex }} />
                                  ))}
                                  <span className="text-[10px] text-muted-foreground ml-1">{viStyle}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium flex items-center gap-1">Tipo de Post * <HelpTooltip text="Define a composição visual." /></Label>
                              <Select value={bTipoPost} onValueChange={setBTipoPost}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{TIPOS_POST.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium flex items-center gap-1">Nível * <HelpTooltip text="Alto Padrão gera imagens ultra-premium." /></Label>
                              <Select value={bNivel} onValueChange={setBNivel}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{NIVEIS.map((n) => (<SelectItem key={n.value} value={n.value}><span>{n.label}</span> <span className="text-muted-foreground ml-1">— {n.desc}</span></SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                          </div>
                          {(bTipoPost === "produto" || bTipoPost === "servico") && (
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">Descrição do {bTipoPost === "produto" ? "Produto" : "Serviço"}</Label>
                              <Textarea value={bDescricaoProduto} onChange={(e) => setBDescricaoProduto(e.target.value)} rows={2} placeholder="Descreva: materiais, cores, formato..." />
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">Mês *</Label>
                              <Select value={bMes} onValueChange={setBMes}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{MESES.map((m) => (<SelectItem key={m} value={`${m} 2026`}>{m} 2026</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium flex items-center gap-1">Objetivo * <HelpTooltip text="Define o foco visual." /></Label>
                              <Select value={bObjetivo} onValueChange={setBObjetivo}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>{OBJETIVOS.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium flex items-center gap-1">Estilo Visual * <HelpTooltip text="Minimalista, Bold, etc." /></Label>
                              <Select value={bEstilo} onValueChange={setBEstilo}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>{ESTILOS.map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">Temas Visuais</Label>
                              <Input value={bTemas} onChange={(e) => setBTemas(e.target.value)} placeholder="Ex: Tecnologia, crescimento" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Promoções / Ofertas</Label>
                            <Textarea value={bPromocoes} onChange={(e) => setBPromocoes(e.target.value)} rows={2} placeholder="Ex: 20% OFF no plano anual" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Observações</Label>
                            <Textarea value={bObs} onChange={(e) => setBObs(e.target.value)} rows={2} placeholder="Instruções adicionais..." />
                          </div>
                          {/* Persona */}
                          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                            <p className="text-xs font-semibold flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-primary" /> Persona</p>
                            <Input value={personaNome} onChange={(e) => setPersonaNome(e.target.value)} placeholder='Ex: "Maria, 38 anos"' className="h-8 text-xs" />
                            <Textarea value={personaDescricao} onChange={(e) => setPersonaDescricao(e.target.value)} rows={2} placeholder="Idade, profissão, dores, desejos..." className="text-xs" />
                          </div>
                          {/* Refs */}
                          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                            <p className="text-xs font-semibold flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-primary" /> Referências Visuais</p>
                            <p className="text-[10px] text-muted-foreground">Até 5 imagens. A IA analisa o estilo.</p>
                            {bReferenceImages.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {bReferenceImages.map((ref, i) => (
                                  <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border">
                                    {ref.isFile ? (
                                      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 p-1"><FileText className="w-5 h-5 text-muted-foreground" /></div>
                                    ) : (
                                      <img src={ref.url} alt={`Ref ${i + 1}`} className="w-full h-full object-cover" />
                                    )}
                                    <button onClick={() => removeRef(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Minus className="w-4 h-4 text-white" /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {bReferenceImages.length < 5 && (
                              <div className="space-y-2">
                                <input type="file" accept="image/*,.pdf,.ai,.psd,.svg,.fig" multiple id="ref-upload" className="hidden" onChange={(e) => handleRefUpload(e.target.files)} />
                                <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full" onClick={() => document.getElementById("ref-upload")?.click()} disabled={uploadingRef}>
                                  <Upload className="w-3.5 h-3.5" /> {uploadingRef ? "Enviando..." : "Upload de Referências"}
                                </Button>
                                <div className="flex gap-1.5">
                                  <Input value={refUrlInput} onChange={(e) => setRefUrlInput(e.target.value)} placeholder="Cole URL de referência" className="h-8 text-xs flex-1" onKeyDown={(e) => e.key === "Enter" && addRefUrl()} />
                                  <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={addRefUrl}><Plus className="w-3.5 h-3.5" /></Button>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-none" onClick={() => { setWizardFlow("choose"); setBriefingStep(1); }}><ArrowLeft className="w-4 h-4" /></Button>
                            <Button className="flex-1" onClick={() => setBriefingStep(2)} disabled={!bObjetivo || !bEstilo}>
                              Próximo <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {briefingStep === 2 && (
                        <div className="space-y-4 mt-2">
                          <p className="text-xs text-muted-foreground">Escolha os formatos e quantidades de cada tipo.</p>
                          <div className={`rounded-lg border p-3 flex items-center justify-between ${
                            maxArts !== -1 && totalFormats > saldoRestanteArtes ? "border-destructive/30 bg-destructive/5" : "border-primary/20 bg-primary/5"
                          }`}>
                            <div>
                              <p className="text-xs font-semibold">Saldo: {maxArts === -1 ? "Ilimitado" : `${saldoRestanteArtes} artes`}</p>
                              <p className="text-[10px] text-muted-foreground">{artsThisMonth} de {maxArts === -1 ? "∞" : maxArts} usados</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">🎨 Artes</p>
                            <div className="grid grid-cols-3 gap-2">
                              {ART_FORMATS.map((f) => {
                                const val = f.value === "feed" ? fmtFeed : f.value === "story" ? fmtStory : fmtCarrossel;
                                const set = f.value === "feed" ? setFmtFeed : f.value === "story" ? setFmtStory : setFmtCarrossel;
                                return (
                                  <Card key={f.value} className="border">
                                    <CardContent className="py-3 flex flex-col items-center gap-1.5">
                                      <span className="text-lg">{f.icon}</span>
                                      <p className="text-[11px] font-semibold">{f.label}</p>
                                      <p className="text-[9px] text-muted-foreground">{f.desc}</p>
                                      <Input type="number" min={0} max={10} value={val} onChange={(e) => set(Math.max(0, parseInt(e.target.value) || 0))} className="w-16 text-center h-8 text-xs" />
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">🎬 Vídeos Curtos (5-15s)</p>
                            <div className="grid grid-cols-2 gap-2">
                              {VIDEO_FORMATS.map((f) => {
                                const val = f.value === "reels" ? fmtReels : fmtStoryVideo;
                                const set = f.value === "reels" ? setFmtReels : setFmtStoryVideo;
                                return (
                                  <Card key={f.value} className="border">
                                    <CardContent className="py-3 flex flex-col items-center gap-1.5">
                                      <span className="text-lg">{f.icon}</span>
                                      <p className="text-[11px] font-semibold">{f.label}</p>
                                      <p className="text-[9px] text-muted-foreground">{f.desc}</p>
                                      <Input type="number" min={0} max={5} value={val} onChange={(e) => set(Math.max(0, parseInt(e.target.value) || 0))} className="w-16 text-center h-8 text-xs" />
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>

                          <div className={`flex items-center justify-between rounded-lg p-3 ${
                            maxArts !== -1 && totalFormats > saldoRestanteArtes ? "bg-destructive/10" : "bg-muted/50"
                          }`}>
                            <span className="text-sm font-medium">Total de peças</span>
                            <Badge variant={maxArts !== -1 && totalFormats > saldoRestanteArtes ? "destructive" : "default"} className="text-sm px-3 py-1">{totalFormats}</Badge>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setBriefingStep(1)}><ArrowLeft className="w-4 h-4" /> Voltar</Button>
                            <Button className="flex-1" onClick={() => setBriefingStep(3)} disabled={totalFormats === 0 || (maxArts !== -1 && totalFormats > saldoRestanteArtes)}>
                              Próximo <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {briefingStep === 3 && (
                        <div className="space-y-4 mt-2">
                          <p className="text-xs text-muted-foreground">Selecione o tipo/estilo visual para suas peças. Isso ajuda a IA a entregar o resultado ideal.</p>

                          {hasArtFormats && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">🎨 Tipo de Arte</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {ART_STYLES.map((s) => (
                                  <Card
                                    key={s.value}
                                    className={`cursor-pointer transition-all hover:shadow-md ${selectedArtStyle === s.value ? "ring-2 ring-primary border-primary/30 bg-primary/5" : "hover:bg-muted/30"}`}
                                    onClick={() => setSelectedArtStyle(s.value)}
                                  >
                                    <CardContent className="py-3 text-center space-y-1">
                                      <span className="text-2xl block">{s.icon}</span>
                                      <p className="text-[11px] font-semibold">{s.label}</p>
                                      <p className="text-[9px] text-muted-foreground leading-tight">{s.desc}</p>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {hasVideoFormats && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">🎬 Tipo de Vídeo (curto, 5-15s)</p>
                              <div className="grid grid-cols-2 gap-2">
                                {VIDEO_STYLES.map((s) => (
                                  <Card
                                    key={s.value}
                                    className={`cursor-pointer transition-all hover:shadow-md ${selectedVideoStyle === s.value ? "ring-2 ring-primary border-primary/30 bg-primary/5" : "hover:bg-muted/30"}`}
                                    onClick={() => setSelectedVideoStyle(s.value)}
                                  >
                                    <CardContent className="py-3 text-center space-y-1">
                                      <span className="text-2xl block">{s.icon}</span>
                                      <p className="text-[11px] font-semibold">{s.label}</p>
                                      <p className="text-[9px] text-muted-foreground leading-tight">{s.desc}</p>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setBriefingStep(2)}><ArrowLeft className="w-4 h-4" /> Voltar</Button>
                            <Button className="flex-1" onClick={() => setBriefingStep(4)} disabled={(hasArtFormats && !selectedArtStyle) || (hasVideoFormats && !selectedVideoStyle)}>
                              Próximo <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {briefingStep === 4 && (
                        <div className="space-y-4 mt-2">
                          <p className="text-xs text-muted-foreground">Revise e confirme a geração.</p>
                          <Card className="bg-muted/30">
                            <CardContent className="py-4 space-y-2">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <span className="text-muted-foreground">Mês:</span><span className="font-medium">{bMes}</span>
                                <span className="text-muted-foreground">Objetivo:</span><span className="font-medium">{bObjetivo}</span>
                                <span className="text-muted-foreground">Estilo:</span><span className="font-medium">{bEstilo}</span>
                                <span className="text-muted-foreground">Total:</span><span className="font-medium">{totalFormats} peças</span>
                              </div>
                              <div className="flex gap-1.5 mt-2 flex-wrap">
                                {fmtFeed > 0 && <Badge variant="outline" className="text-[10px]">{fmtFeed} Feed</Badge>}
                                {fmtStory > 0 && <Badge variant="outline" className="text-[10px]">{fmtStory} Story</Badge>}
                                {fmtCarrossel > 0 && <Badge variant="outline" className="text-[10px]">{fmtCarrossel} Carrossel</Badge>}
                                {fmtReels > 0 && <Badge variant="outline" className="text-[10px]">{fmtReels} Reels</Badge>}
                                {fmtStoryVideo > 0 && <Badge variant="outline" className="text-[10px]">{fmtStoryVideo} Story Vídeo</Badge>}
                              </div>
                              <div className="flex gap-1.5 flex-wrap">
                                {selectedArtStyle && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{ART_STYLES.find(s => s.value === selectedArtStyle)?.label}</Badge>}
                                {selectedVideoStyle && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{VIDEO_STYLES.find(s => s.value === selectedVideoStyle)?.label}</Badge>}
                              </div>
                            </CardContent>
                          </Card>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setBriefingStep(3)}><ArrowLeft className="w-4 h-4" /> Voltar</Button>
                            <Button className="flex-1 gap-2 h-11 font-semibold" onClick={() => {
                              // Set bQtd and bIncluirVideo from format selections for backward compat
                              const artCount = fmtFeed + fmtStory + fmtCarrossel;
                              setBQtd(String(artCount || 1));
                              setBIncluirVideo(hasVideoFormats);
                              handleGenerate();
                            }}>
                              <Sparkles className="w-4 h-4" /> Gerar {totalFormats} Peças com IA
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </DialogContent>
              </Dialog>

              {/* Editor Modal */}
              <Dialog open={!!selectedArt} onOpenChange={(open) => { if (!open) setSelectedArt(null); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  {selectedArt && (
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base"><Edit3 className="w-4 h-4 text-primary" /> {selectedArt.titulo}</DialogTitle>
                      </DialogHeader>
                      <div className="flex gap-2 mb-3">
                        <Button size="sm" variant={editorFormat === "feed" ? "default" : "outline"} className="text-xs" onClick={() => setEditorFormat("feed")}>Feed (1:1)</Button>
                        <Button size="sm" variant={editorFormat === "story" ? "default" : "outline"} className="text-xs" onClick={() => setEditorFormat("story")}>Story (9:16)</Button>
                        {selectedArt.videoScript && (
                          <Button size="sm" variant={editorFormat === "video" as any ? "default" : "outline"} className="text-xs gap-1" onClick={() => setEditorFormat("video" as any)}>
                            <Video className="w-3 h-3" /> Vídeo
                          </Button>
                        )}
                      </div>
                      {(editorFormat as string) === "video" && selectedArt.videoScript ? (
                        <div className="space-y-4">
                          {/* Video Player */}
                          {selectedArt.videoUrl ? (
                            <div className="rounded-xl overflow-hidden border bg-black">
                              <video
                                src={selectedArt.videoUrl}
                                controls
                                className="w-full max-h-[480px] mx-auto"
                                poster={selectedArt.thumbnailUrl || undefined}
                              />
                              <div className="p-3 bg-muted/30 flex justify-between items-center">
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <Play className="w-3.5 h-3.5" /> Vídeo Reels (9:16)
                                </span>
                                <Button size="sm" variant="outline" className="text-xs gap-1.5 h-7" onClick={() => {
                                  const a = document.createElement("a");
                                  a.href = selectedArt.videoUrl!;
                                  a.download = `${selectedArt.titulo.replace(/[^a-zA-Z0-9]/g, "-")}-reel.mp4`;
                                  a.click();
                                }}>
                                  <Download className="w-3 h-3" /> Baixar Vídeo (MP4)
                                </Button>
                              </div>
                            </div>
                          ) : selectedArt.thumbnailUrl ? (
                            <div className="rounded-xl overflow-hidden border">
                              <img src={selectedArt.thumbnailUrl} alt="Thumbnail" className="w-full max-h-64 object-cover" />
                              <div className="p-2 bg-muted/30 flex justify-between items-center">
                                <span className="text-[10px] text-muted-foreground">Thumbnail / Capa do Vídeo</span>
                                <Button size="sm" variant="ghost" className="text-xs gap-1 h-6" onClick={() => { const a = document.createElement("a"); a.href = selectedArt.thumbnailUrl!; a.download = "thumbnail.png"; a.click(); }}>
                                  <Download className="w-3 h-3" /> Baixar
                                </Button>
                              </div>
                            </div>
                          ) : null}

                          {/* Video Frames Preview */}
                          {selectedArt.videoFrameUrls && selectedArt.videoFrameUrls.length > 0 && (
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2"><Image className="w-3.5 h-3.5" /> Keyframes ({selectedArt.videoFrameUrls.length} cenas)</Label>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {selectedArt.videoFrameUrls.map((url, idx) => (
                                  <img key={idx} src={url} alt={`Frame ${idx + 1}`} className="h-32 rounded-lg border flex-shrink-0" />
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Film className="w-3.5 h-3.5" /> Roteiro com Timecodes</Label>
                            <div className="mt-1 p-3 rounded-lg bg-muted/30 text-sm whitespace-pre-line max-h-60 overflow-y-auto font-mono text-xs">{selectedArt.videoScript}</div>
                            <Button size="sm" variant="ghost" className="mt-1 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(selectedArt.videoScript!); toast({ title: "Roteiro copiado!" }); }}>
                              <Copy className="w-3 h-3" /> Copiar Roteiro
                            </Button>
                          </div>
                          {selectedArt.videoDescription && (
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Descrição Visual (Frame-by-frame)</Label>
                              <div className="mt-1 p-3 rounded-lg bg-muted/30 text-sm whitespace-pre-line max-h-48 overflow-y-auto">{selectedArt.videoDescription}</div>
                            </div>
                          )}
                          {selectedArt.audioSuggestion && (
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Music className="w-3.5 h-3.5" /> Sugestão de Áudio</Label>
                              <p className="mt-1 text-sm">{selectedArt.audioSuggestion}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          {(editorFormat === "feed" ? selectedArt.feedUrl : selectedArt.storyUrl) ? (
                            <CanvasEditor imageUrl={(editorFormat === "feed" ? selectedArt.feedUrl : selectedArt.storyUrl)!} textConfig={textConfig} onTextChange={setTextConfig} format={editorFormat} />
                          ) : (
                            <div className="flex items-center justify-center h-64 bg-muted/30 rounded-xl"><p className="text-sm text-muted-foreground">Imagem não gerada</p></div>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Legenda</Label>
                            <div className="mt-1 p-3 rounded-lg bg-muted/30 text-sm whitespace-pre-line max-h-48 overflow-y-auto">{selectedArt.legenda}</div>
                            <Button size="sm" variant="ghost" className="mt-1 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(selectedArt.legenda); toast({ title: "Legenda copiada!" }); }}>
                              <Copy className="w-3 h-3" /> Copiar
                            </Button>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">CTA</Label>
                            <p className="text-sm font-medium mt-1">{selectedArt.cta}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Hashtags</Label>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {selectedArt.hashtags.map((h) => (<Badge key={h} variant="secondary" className="text-[10px]">#{h}</Badge>))}
                            </div>
                            <Button size="sm" variant="ghost" className="mt-1 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(selectedArt.hashtags.map(h => `#${h}`).join(" ")); toast({ title: "Hashtags copiadas!" }); }}>
                              <Copy className="w-3 h-3" /> Copiar
                            </Button>
                          </div>
                          <ApprovalPanel
                            status={selectedArt.status} changeNote={selectedArt.changeNote}
                            onApprove={() => { updateArtStatus(selectedArt.id, "approved"); toast({ title: "Arte aprovada!" }); }}
                            onRequestChanges={(note) => { updateArtStatus(selectedArt.id, "changes_requested", note); toast({ title: "Alteração solicitada!" }); }}
                            onReject={() => { updateArtStatus(selectedArt.id, "rejected"); toast({ title: "Arte rejeitada." }); }}
                          />

                          {/* Revision System */}
                          <div className="pt-3 border-t border-border/50">
                            {selectedArt.hasRevision ? (
                              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Revisão utilizada</p>
                                  {selectedArt.revisionNote && <p className="text-[10px] text-muted-foreground/70 mt-0.5">"{selectedArt.revisionNote}"</p>}
                                </div>
                              </div>
                            ) : revisionArtId === selectedArt.id ? (
                              <div className="space-y-2">
                                <Label className="text-xs font-medium">Descreva a alteração desejada</Label>
                                <Textarea
                                  value={revisionNote}
                                  onChange={(e) => setRevisionNote(e.target.value)}
                                  rows={2}
                                  placeholder="Ex: Troque a cor de fundo para azul, aumente o texto..."
                                  className="text-xs"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="text-xs" onClick={() => { setRevisionArtId(null); setRevisionNote(""); }}>Cancelar</Button>
                                  <Button size="sm" className="text-xs gap-1.5" onClick={() => handleRevision(selectedArt)} disabled={!revisionNote.trim() || isRevising}>
                                    <Sparkles className="w-3 h-3" /> {isRevising ? "Regenerando..." : "Regerar com Alteração"}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" className="text-xs gap-1.5 w-full" onClick={() => setRevisionArtId(selectedArt.id)}>
                                <Edit3 className="w-3 h-3" /> Solicitar Alteração (1 revisão inclusa)
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      )}
                    </>
                  )}
                </DialogContent>
              </Dialog>

              {/* Campaign list / detail */}
              {openCampaign && currentCampaign ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setOpenCampaign(null)}><ArrowLeft className="w-3.5 h-3.5" /> Voltar</Button>
                  </div>
                  <ApprovalSummary
                    total={currentCampaign.arts.length}
                    approved={currentCampaign.arts.filter(a => a.status === "approved").length}
                    changesRequested={currentCampaign.arts.filter(a => a.status === "changes_requested").length}
                    rejected={currentCampaign.arts.filter(a => a.status === "rejected").length}
                    onApproveAll={() => approveAll(currentCampaign.id)}
                    onApprovePending={() => approvePending(currentCampaign.id)}
                  />
                  <h3 className="text-lg font-bold">{currentCampaign.label}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {currentCampaign.arts.map((art) => (
                      <Card key={art.id} className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
                        <div className="relative aspect-square bg-muted/30">
                          {art.feedUrl ? (
                            <img src={art.feedUrl} alt={art.titulo} className="w-full h-full object-cover" onClick={() => openEditor(art, "feed")} />
                          ) : (
                            <div className="flex items-center justify-center h-full" onClick={() => openEditor(art, "feed")}><Image className="w-8 h-8 text-muted-foreground/40" /></div>
                          )}
                          {art.status !== "pending" && (<div className="absolute top-2 right-2"><ApprovalStatusBadge status={art.status} /></div>)}
                          <div className="absolute bottom-2 left-2 flex gap-1">
                            <Badge className="text-[9px] bg-blue-500/80 text-white border-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); openEditor(art, "feed"); }}>Feed</Badge>
                            <Badge className="text-[9px] bg-amber-500/80 text-white border-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); openEditor(art, "story"); }}>Story</Badge>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <p className="text-xs font-semibold line-clamp-2">{art.titulo}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{art.legenda.slice(0, 80)}...</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="py-12 text-center">
                        <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Clique em "Nova Criação Mensal" para começar</p>
                      </CardContent>
                    </Card>
                  ) : (
                    campaigns.map((campaign) => {
                      const approvedCount = campaign.arts.filter((a) => a.status === "approved").length;
                      return (
                        <Card key={campaign.id} className="glass-card cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all" onClick={() => setOpenCampaign(campaign.id)}>
                          <CardContent className="py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-primary/10"><FolderOpen className="w-5 h-5 text-primary" /></div>
                              <div>
                                <p className="text-sm font-bold">{campaign.label}</p>
                                <p className="text-xs text-muted-foreground">Criada em {campaign.createdAt} • {campaign.arts.length} posts</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{approvedCount}/{campaign.arts.length} aprovados</Badge>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ═══ IDENTIDADE VISUAL (from DB) ═══ */}
        <TabsContent value="base" className="space-y-5 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" /> Identidade Visual
                <HelpTooltip text="A identidade visual é usada em todas as gerações de arte. Quanto mais completa, melhores os resultados." />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Defina cores, fontes e estilo visual da sua marca</p>
            </div>
            <Button variant={viEditing ? "default" : "outline"} size="sm" className="text-xs gap-1.5" onClick={() => {
              if (viEditing) handleSaveVI();
              else setViEditing(true);
            }} disabled={saveVI.isPending}>
              {viEditing ? <><Check className="w-3.5 h-3.5" /> Salvar</> : <><Edit3 className="w-3.5 h-3.5" /> Editar</>}
            </Button>
          </div>

          {!viComplete && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="py-3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Atenção:</strong> Preencha pelo menos a paleta de cores e o estilo visual para desbloquear a geração de artes.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Paleta de Cores */}
          <Card className="glass-card">
            <CardContent className="py-5 space-y-3">
              <p className="text-sm font-bold flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" /> Paleta de Cores
                <HelpTooltip text="As cores primárias e secundárias da sua marca. A IA usará exatamente essas cores nas artes geradas." />
              </p>
              <div className="flex flex-wrap gap-2">
                {viPalette.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-muted/30 rounded-lg px-2.5 py-1.5">
                    <div className="w-6 h-6 rounded-md border" style={{ backgroundColor: c.hex }} />
                    <span className="text-xs font-mono">{c.hex}</span>
                    {c.label && <span className="text-[10px] text-muted-foreground">({c.label})</span>}
                    {viEditing && (
                      <button onClick={() => removeColor(i)} className="text-muted-foreground hover:text-destructive ml-1"><Minus className="w-3 h-3" /></button>
                    )}
                  </div>
                ))}
              </div>
              {viEditing && (
                <div className="flex gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Cor HEX</Label>
                    <div className="flex gap-1.5">
                      <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                      <Input value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} className="w-24 h-8 text-xs font-mono" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Label (opcional)</Label>
                    <Input value={newColorLabel} onChange={(e) => setNewColorLabel(e.target.value)} placeholder="Ex: Primária" className="w-28 h-8 text-xs" />
                  </div>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addColor}><Plus className="w-3 h-3" /></Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estilo e Fontes */}
          <Card className="glass-card">
            <CardContent className="py-5 space-y-4">
              <p className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Estilo e Tipografia
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">Estilo Visual <HelpTooltip text="Ex: Minimalista, Bold, Corporativo, Criativo. Define o tom visual de todas as artes." /></Label>
                  {viEditing ? (
                    <Select value={viStyle} onValueChange={setViStyle}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {["Minimalista", "Bold", "Corporativo", "Criativo", "Elegante", "Moderno", "Retrô", "Luxo"].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{viStyle || <span className="text-muted-foreground italic">Não definido</span>}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">Tom Visual <HelpTooltip text="Como a marca se comunica visualmente: profissional, descontraído, sério, etc." /></Label>
                  {viEditing ? (
                    <Input value={viTone} onChange={(e) => setViTone(e.target.value)} placeholder="Ex: Profissional mas acessível" />
                  ) : (
                    <p className="text-sm">{viTone || <span className="text-muted-foreground italic">Não definido</span>}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">Fontes <HelpTooltip text="Fontes usadas pela marca. Ex: Inter (títulos), DM Sans (corpo)." /></Label>
                {viEditing ? (
                  <Input value={viFonts} onChange={(e) => setViFonts(e.target.value)} placeholder="Ex: Inter, DM Sans" />
                ) : (
                  <p className="text-sm">{viFonts || <span className="text-muted-foreground italic">Não definido</span>}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card className="glass-card">
            <CardContent className="py-5 space-y-3">
              <p className="text-sm font-bold flex items-center gap-2">
                <Image className="w-4 h-4 text-primary" /> Logo
                <HelpTooltip text="Faça upload do logo da marca. Ele será referenciado visualmente nas artes." />
              </p>
              {viLogoUrl ? (
                <div className="flex items-center gap-4">
                  <img src={viLogoUrl} alt="Logo" className="h-16 w-auto rounded-lg border" />
                  {viEditing && <Button variant="ghost" size="sm" className="text-xs" onClick={() => setViLogoUrl("")}>Remover</Button>}
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Upload de logo (em breve)</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referências */}
          <Card className="glass-card">
            <CardContent className="py-5 space-y-3">
              <p className="text-sm font-bold flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" /> Referências Visuais (Links)
                <HelpTooltip text="Links de perfis ou sites que inspiram o visual da marca. A IA usa como contexto." />
              </p>
              {viEditing ? (
                <Textarea value={viRefLinks} onChange={(e) => setViRefLinks(e.target.value)} rows={3} placeholder="Cole links de perfis/sites de referência, um por linha" />
              ) : (
                <div className="text-sm whitespace-pre-line">
                  {viRefLinks || <span className="text-muted-foreground italic">Nenhuma referência adicionada</span>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Banco de Imagens */}
          <Card className="glass-card">
            <CardContent className="py-5 space-y-3">
              <p className="text-sm font-bold flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" /> Banco de Imagens
                <HelpTooltip text="Upload de imagens permanentes da marca. Quando não houver referências específicas no briefing, a IA usará estas imagens como guia visual." />
              </p>
              <p className="text-xs text-muted-foreground">
                Imagens salvas aqui serão usadas automaticamente como referência visual quando nenhuma for enviada no briefing.
              </p>

              {/* Existing images */}
              {(visualIdentity?.image_bank_urls?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2">
                  {visualIdentity!.image_bank_urls.map((url, i) => (
                    <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border">
                      <img src={url} alt={`Banco ${i + 1}`} className="w-full h-full object-cover" />
                      {viEditing && (
                        <button
                          onClick={() => removeBankImage(url)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {viEditing && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    id="bank-upload"
                    className="hidden"
                    onChange={(e) => handleBankUpload(e.target.files)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={() => document.getElementById("bank-upload")?.click()}
                    disabled={uploadingBank}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingBank ? "Enviando..." : "Adicionar Imagens ao Banco"}
                  </Button>
                </div>
              )}

              {!viEditing && !(visualIdentity?.image_bank_urls?.length) && (
                <p className="text-xs text-muted-foreground italic">Nenhuma imagem no banco. Edite para adicionar.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ CALENDÁRIO DE POSTAGENS ═══ */}
        <TabsContent value="calendario" className="mt-4">
          <Card className="glass-card">
            <CardContent className="py-5">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                <h3 className="text-sm font-bold capitalize">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</h3>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map(d => (<div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startPadding }).map((_, i) => (<div key={`pad-${i}`} />))}
                {days.map(day => {
                  const dayArts = getArtsForDay(day);
                  return (
                    <div key={day.toISOString()} className={`min-h-[60px] p-1 flex flex-col items-center text-xs rounded-lg transition-colors cursor-pointer ${dayArts.length > 0 ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-muted/50"}`}>
                      <span className="text-[11px] font-medium">{format(day, "d")}</span>
                      {dayArts.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                          {dayArts.slice(0, 3).map(({ art }) => (
                            <div key={art.id} className="w-2 h-2 rounded-full bg-primary" title={art.titulo} />
                          ))}
                          {dayArts.length > 3 && <span className="text-[8px] text-primary font-bold">+{dayArts.length - 3}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {campaigns.length === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-4">Nenhuma postagem criada ainda. As artes geradas aparecerão aqui.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
