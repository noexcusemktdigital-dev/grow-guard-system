import { useState, useEffect, useRef, useCallback } from "react";
import {
  Palette, Edit3, Check, Plus, Sparkles, Copy, Download,
  Eye, Image, Upload, Calendar as CalendarIcon, ChevronLeft,
  ChevronRight, BookOpen, Clock, FolderOpen, Folder,
  ArrowLeft, Hash, Layout, CheckCircle2, Circle, Star,
  Type, AlignCenter, AlignLeft, AlignRight, Minus,
  ZoomIn, ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── Types ── */
interface SocialConcept {
  titulo: string;
  legenda: string;
  cta: string;
  hashtags: string[];
  visual_prompt_feed: string;
  visual_prompt_story: string;
}

interface GeneratedArt {
  id: string;
  titulo: string;
  legenda: string;
  cta: string;
  hashtags: string[];
  feedUrl: string | null;
  storyUrl: string | null;
  approved: boolean;
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

/* ── Base de Conhecimento ── */
interface KBSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  fields: { key: string; label: string; type: "text" | "textarea" | "upload"; value: string }[];
}

const initialSections: KBSection[] = [
  {
    id: "identidade", title: "Identidade Visual", icon: <Palette className="w-4 h-4" />,
    fields: [
      { key: "paleta", label: "Paleta de Cores", type: "text", value: "#E63946, #1D3557, #F1FAEE, #A8DADC" },
      { key: "fontes", label: "Fontes", type: "text", value: "Inter (títulos), DM Sans (corpo)" },
      { key: "estilo", label: "Estilo Visual Preferido", type: "text", value: "Moderno, Minimalista, Bold" },
      { key: "logo", label: "Logo", type: "upload", value: "" },
    ],
  },
  {
    id: "referencias", title: "Referências Visuais", icon: <Eye className="w-4 h-4" />,
    fields: [
      { key: "refs", label: "Links e Perfis de Referência", type: "textarea", value: "@rockcontent — identidade clean\n@resultadosdigitais — infográficos\n@hubspot — carrosséis educativos" },
    ],
  },
  {
    id: "concorrencia", title: "Concorrência Visual", icon: <Layout className="w-4 h-4" />,
    fields: [
      { key: "conc", label: "Exemplos Visuais de Concorrentes", type: "textarea", value: "FranquiaTech: visual corporativo azul\nRedeGrow: visual jovem e colorido" },
    ],
  },
  {
    id: "tom", title: "Tom e Linguagem Visual", icon: <BookOpen className="w-4 h-4" />,
    fields: [
      { key: "tom", label: "Como a marca se comunica visualmente", type: "textarea", value: "Profissional mas acessível. Uso de ícones e dados visuais. Evitar excesso de texto nos criativos." },
    ],
  },
  {
    id: "banco", title: "Banco de Imagens", icon: <Image className="w-4 h-4" />,
    fields: [
      { key: "fotos", label: "Fotos de produtos, equipe, espaço", type: "upload", value: "" },
    ],
  },
];

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
function CanvasEditor({ imageUrl, textConfig, onTextChange, format }: {
  imageUrl: string;
  textConfig: TextConfig;
  onTextChange: (cfg: TextConfig) => void;
  format: "feed" | "story";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const canvasW = format === "feed" ? 540 : 270;
  const canvasH = format === "feed" ? 540 : 480;
  const realW = format === "feed" ? 1080 : 1080;
  const realH = format === "feed" ? 1080 : 1920;

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

    // Shadow for readability
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

    // Background strip
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
    img.onload = () => {
      imgRef.current = img;
      drawCanvas();
    };
    img.src = imageUrl;
  }, [imageUrl, drawCanvas]);

  useEffect(() => {
    if (imgRef.current) drawCanvas();
  }, [textConfig, drawCanvas]);

  const downloadImage = (withText: boolean) => {
    if (!canvasRef.current || !imgRef.current) return;
    if (!withText) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `arte-${format}.png`;
      link.click();
      return;
    }
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = `arte-${format}-com-texto.png`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center bg-muted/30 rounded-xl p-3">
        <canvas
          ref={canvasRef}
          style={{ width: canvasW, height: canvasH }}
          className="rounded-lg shadow-lg"
        />
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1.5"><Type className="w-3.5 h-3.5" /> Texto sobre a imagem</Label>
          <Textarea
            value={textConfig.text}
            onChange={(e) => onTextChange({ ...textConfig, text: e.target.value })}
            rows={2}
            placeholder="Ex: 20% OFF em Fevereiro"
            className="text-sm"
          />
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
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/* ── Main Page ── */
export default function ClienteRedesSociais() {
  // Knowledge base
  const [sections, setSections] = useState(initialSections);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Campaigns
  const [campaigns, setCampaigns] = useState<ArtCampaign[]>([]);
  const [openCampaign, setOpenCampaign] = useState<string | null>(null);
  const [selectedArt, setSelectedArt] = useState<GeneratedArt | null>(null);
  const [editorFormat, setEditorFormat] = useState<"feed" | "story">("feed");
  const [textConfig, setTextConfig] = useState<TextConfig>({ text: "", position: "bottom", color: "white", size: "md" });

  // Wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importedScripts, setImportedScripts] = useState<any[]>([]);

  // Calendar
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));

  // Loading phrases rotation
  useEffect(() => {
    if (!isGenerating || genProgress > 0) return;
    const interval = setInterval(() => setLoadingPhrase((p) => (p + 1) % loadingPhrases.length), 2500);
    return () => clearInterval(interval);
  }, [isGenerating, genProgress]);

  const updateField = (sectionId: string, fieldKey: string, value: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, fields: s.fields.map(f => f.key === fieldKey ? { ...f, value } : f) } : s));
  };

  /* ── Generate Arts ── */
  const handleGenerate = async () => {
    if (!bObjetivo || !bEstilo) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    const qty = Math.max(1, Math.min(10, Number(bQtd) || 4));
    setIsGenerating(true);
    setGenProgress(0);
    setGenTotal(qty * 2);
    setGenMessage("Gerando conceitos com IA...");

    try {
      // Step 1: Generate concepts
      const { data: conceptsData, error: conceptsError } = await supabase.functions.invoke("generate-social-concepts", {
        body: {
          briefing: { mes: bMes, objetivo: bObjetivo, cores: bCores, temas: bTemas, promocoes: bPromocoes, observacoes: bObs },
          quantidade: qty,
          estilo: bEstilo,
          tipo_post: bTipoPost,
          nivel: bNivel,
          descricao_produto: bDescricaoProduto || undefined,
          roteiros_importados: importedScripts.length > 0 ? importedScripts : undefined,
        },
      });

      if (conceptsError) throw conceptsError;
      const concepts: SocialConcept[] = conceptsData?.concepts || [];
      if (!concepts.length) throw new Error("Nenhum conceito gerado");

      // Step 2: Generate images sequentially
      const arts: GeneratedArt[] = [];
      const timestamp = Date.now();

      for (let i = 0; i < concepts.length; i++) {
        const concept = concepts[i];
        const slug = concept.titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);

        // Feed image
        setGenMessage(`Gerando arte ${i * 2 + 1} de ${qty * 2}...`);
        setGenProgress(i * 2 + 1);

        let feedUrl: string | null = null;
        try {
          const { data: feedData, error: feedError } = await supabase.functions.invoke("generate-social-image", {
            body: {
              prompt: concept.visual_prompt_feed,
              format: "feed",
              file_path: `${timestamp}/${slug}-feed.png`,
              nivel: bNivel,
            },
          });
          if (!feedError && feedData?.url) feedUrl = feedData.url;
        } catch (e) {
          console.error("Feed image error:", e);
        }

        // Story image
        setGenMessage(`Gerando arte ${i * 2 + 2} de ${qty * 2}...`);
        setGenProgress(i * 2 + 2);

        let storyUrl: string | null = null;
        try {
          const { data: storyData, error: storyError } = await supabase.functions.invoke("generate-social-image", {
            body: {
              prompt: concept.visual_prompt_story,
              format: "story",
              file_path: `${timestamp}/${slug}-story.png`,
              nivel: bNivel,
            },
          });
          if (!storyError && storyData?.url) storyUrl = storyData.url;
        } catch (e) {
          console.error("Story image error:", e);
        }

        arts.push({
          id: `art-${timestamp}-${i}`,
          titulo: concept.titulo,
          legenda: concept.legenda,
          cta: concept.cta,
          hashtags: concept.hashtags,
          feedUrl,
          storyUrl,
          approved: false,
        });
      }

      const newCampaign: ArtCampaign = {
        id: `campaign-${timestamp}`,
        mes: bMes,
        label: bMes,
        createdAt: new Date().toLocaleDateString("pt-BR"),
        arts,
      };

      setCampaigns((prev) => [newCampaign, ...prev]);
      setOpenCampaign(newCampaign.id);
      setWizardOpen(false);
      setWizardStep(1);
      toast({ title: "Artes geradas!", description: `${arts.length} posts (${arts.length * 2} artes) criados para ${bMes}.` });
    } catch (err: any) {
      console.error("Generation error:", err);
      toast({ title: "Erro ao gerar artes", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setGenProgress(0);
    }
  };

  const toggleApproval = (artId: string) => {
    setCampaigns((prev) => prev.map((c) => ({
      ...c,
      arts: c.arts.map((a) => a.id === artId ? { ...a, approved: !a.approved } : a),
    })));
    if (selectedArt?.id === artId) {
      setSelectedArt((prev) => prev ? { ...prev, approved: !prev.approved } : null);
    }
  };

  const approveAll = (campaignId: string) => {
    setCampaigns((prev) => prev.map((c) => c.id === campaignId ? { ...c, arts: c.arts.map((a) => ({ ...a, approved: true })) } : c));
    toast({ title: "Todas as artes aprovadas!" });
  };

  const openEditor = (art: GeneratedArt, fmt: "feed" | "story") => {
    setSelectedArt(art);
    setEditorFormat(fmt);
    setTextConfig({ text: art.cta || art.titulo, position: "bottom", color: "white", size: "md" });
  };

  const currentCampaign = campaigns.find((c) => c.id === openCampaign);

  // Calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = (getDay(monthStart) + 6) % 7;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Redes Sociais"
        subtitle="Gere artes profissionais com IA e edite textos antes de publicar"
        icon={<Palette className="w-5 h-5 text-primary" />}
      />

      <Tabs defaultValue="campanhas">
        <TabsList>
          <TabsTrigger value="campanhas" className="text-xs gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Campanhas</TabsTrigger>
          <TabsTrigger value="base" className="text-xs gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Identidade Visual</TabsTrigger>
          <TabsTrigger value="calendario" className="text-xs gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> Calendário</TabsTrigger>
        </TabsList>

        {/* ═══ CAMPANHAS ═══ */}
        <TabsContent value="campanhas" className="space-y-4 mt-4">
          <Button className="w-full gap-2 h-12 text-sm font-semibold" onClick={() => { setWizardOpen(true); setWizardStep(1); }}>
            <Plus className="w-4 h-4" /> Nova Criação Mensal
          </Button>

          {/* Wizard */}
          <Dialog open={wizardOpen} onOpenChange={(open) => { if (!isGenerating) setWizardOpen(open); }}>
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
                  <p className="text-xs text-muted-foreground/60">A geração de imagens pode levar alguns minutos...</p>
                </div>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" /> Briefing Visual — Artes para Redes Sociais
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 mt-2">
                    <p className="text-xs text-muted-foreground">Cada post gera 1 arte Feed (1:1) + 1 arte Story (9:16). A IA cria o visual e sugere legenda + hashtags.</p>

                    {/* Import from Conteúdos */}
                    <Button variant="outline" className="w-full gap-2 text-xs border-dashed" onClick={() => {
                      try {
                        const stored = localStorage.getItem("social-content-campaigns");
                        if (stored) {
                          const parsed = JSON.parse(stored);
                          const allScripts: any[] = [];
                          (Array.isArray(parsed) ? parsed : [parsed]).forEach((camp: any) => {
                            if (camp.scripts) allScripts.push(...camp.scripts);
                            if (camp.roteiros) allScripts.push(...camp.roteiros);
                          });
                          if (allScripts.length > 0) {
                            setImportedScripts(allScripts);
                            setBQtd(String(Math.min(allScripts.length, 10)));
                            toast({ title: `${allScripts.length} conteúdo(s) importado(s)!`, description: "Títulos e legendas serão usados como base." });
                          } else {
                            toast({ title: "Nenhum conteúdo encontrado", description: "Crie conteúdos primeiro em Conteúdos.", variant: "destructive" });
                          }
                        } else {
                          toast({ title: "Nenhuma campanha de conteúdo", description: "Crie conteúdos primeiro na aba Conteúdos.", variant: "destructive" });
                        }
                      } catch { toast({ title: "Erro ao importar", variant: "destructive" }); }
                    }}>
                      <FolderOpen className="w-3.5 h-3.5" /> Importar de Conteúdos
                      {importedScripts.length > 0 && <Badge variant="secondary" className="text-[10px] ml-1">{importedScripts.length} importados</Badge>}
                    </Button>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Tipo de Post *</Label>
                        <Select value={bTipoPost} onValueChange={setBTipoPost}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{TIPOS_POST.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Nível de Qualidade *</Label>
                        <Select value={bNivel} onValueChange={setBNivel}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{NIVEIS.map((n) => (<SelectItem key={n.value} value={n.value}><span>{n.label}</span> <span className="text-muted-foreground ml-1">— {n.desc}</span></SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    {(bTipoPost === "produto" || bTipoPost === "servico") && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Descrição do {bTipoPost === "produto" ? "Produto" : "Serviço"}</Label>
                        <Textarea value={bDescricaoProduto} onChange={(e) => setBDescricaoProduto(e.target.value)} rows={2} placeholder={`Descreva o ${bTipoPost === "produto" ? "produto" : "serviço"}: materiais, cores, formato, público-alvo...`} />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Mês de Referência *</Label>
                        <Select value={bMes} onValueChange={setBMes}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{MESES.map((m) => (<SelectItem key={m} value={`${m} 2026`}>{m} 2026</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Qtd de Posts *</Label>
                        <Input type="number" min={1} max={10} value={bQtd} onChange={(e) => setBQtd(e.target.value)} />
                        <p className="text-[10px] text-muted-foreground">Máx 10 • Gera {Number(bQtd) * 2 || 0} artes</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Objetivo *</Label>
                        <Select value={bObjetivo} onValueChange={setBObjetivo}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{OBJETIVOS.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Estilo Visual *</Label>
                        <Select value={bEstilo} onValueChange={setBEstilo}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{ESTILOS.map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Cores Predominantes</Label>
                      <Input value={bCores} onChange={(e) => setBCores(e.target.value)} placeholder="Ex: Azul escuro, dourado, branco" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Temas Visuais</Label>
                      <Input value={bTemas} onChange={(e) => setBTemas(e.target.value)} placeholder="Ex: Tecnologia, crescimento, equipe" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Promoções / Ofertas</Label>
                      <Textarea value={bPromocoes} onChange={(e) => setBPromocoes(e.target.value)} rows={2} placeholder="Ex: 20% OFF no plano anual em fevereiro" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Observações</Label>
                      <Textarea value={bObs} onChange={(e) => setBObs(e.target.value)} rows={2} placeholder="Instruções adicionais..." />
                    </div>

                    <Button className="w-full gap-2 h-11 font-semibold" onClick={handleGenerate}>
                      <Sparkles className="w-4 h-4" /> Gerar {Number(bQtd) * 2 || 0} Artes com IA
                    </Button>
                  </div>
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
                    <DialogTitle className="flex items-center gap-2 text-base">
                      <Edit3 className="w-4 h-4 text-primary" /> {selectedArt.titulo}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="flex gap-2 mb-3">
                    <Button size="sm" variant={editorFormat === "feed" ? "default" : "outline"} className="text-xs" onClick={() => setEditorFormat("feed")}>
                      Feed (1:1)
                    </Button>
                    <Button size="sm" variant={editorFormat === "story" ? "default" : "outline"} className="text-xs" onClick={() => setEditorFormat("story")}>
                      Story (9:16)
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Canvas */}
                    <div>
                      {(editorFormat === "feed" ? selectedArt.feedUrl : selectedArt.storyUrl) ? (
                        <CanvasEditor
                          imageUrl={(editorFormat === "feed" ? selectedArt.feedUrl : selectedArt.storyUrl)!}
                          textConfig={textConfig}
                          onTextChange={setTextConfig}
                          format={editorFormat}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64 bg-muted/30 rounded-xl">
                          <p className="text-sm text-muted-foreground">Imagem não gerada</p>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Legenda</Label>
                        <div className="mt-1 p-3 rounded-lg bg-muted/30 text-sm whitespace-pre-line max-h-48 overflow-y-auto">{selectedArt.legenda}</div>
                        <Button size="sm" variant="ghost" className="mt-1 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(selectedArt.legenda); toast({ title: "Legenda copiada!" }); }}>
                          <Copy className="w-3 h-3" /> Copiar Legenda
                        </Button>
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">CTA</Label>
                        <p className="text-sm font-medium mt-1">{selectedArt.cta}</p>
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Hashtags</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedArt.hashtags.map((h) => (
                            <Badge key={h} variant="secondary" className="text-[10px]">#{h}</Badge>
                          ))}
                        </div>
                        <Button size="sm" variant="ghost" className="mt-1 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(selectedArt.hashtags.map(h => `#${h}`).join(" ")); toast({ title: "Hashtags copiadas!" }); }}>
                          <Copy className="w-3 h-3" /> Copiar Hashtags
                        </Button>
                      </div>

                      <Button
                        className="w-full gap-2"
                        variant={selectedArt.approved ? "outline" : "default"}
                        onClick={() => toggleApproval(selectedArt.id)}
                      >
                        {selectedArt.approved ? <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Aprovada</> : <><Circle className="w-4 h-4" /> Aprovar Arte</>}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Campaign list / detail */}
          {openCampaign && currentCampaign ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setOpenCampaign(null)}>
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                </Button>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{currentCampaign.arts.length} posts • {currentCampaign.arts.length * 2} artes</Badge>
                  <Badge variant="outline" className="text-xs">
                    {currentCampaign.arts.filter((a) => a.approved).length}/{currentCampaign.arts.length} aprovados
                  </Badge>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => approveAll(currentCampaign.id)}>
                    <Check className="w-3 h-3" /> Aprovar Tudo
                  </Button>
                </div>
              </div>

              <h3 className="text-lg font-bold">{currentCampaign.label}</h3>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentCampaign.arts.map((art) => (
                  <Card key={art.id} className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
                    <div className="relative aspect-square bg-muted/30">
                      {art.feedUrl ? (
                        <img src={art.feedUrl} alt={art.titulo} className="w-full h-full object-cover" onClick={() => openEditor(art, "feed")} />
                      ) : (
                        <div className="flex items-center justify-center h-full" onClick={() => openEditor(art, "feed")}>
                          <Image className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}
                      {art.approved && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 drop-shadow" />
                        </div>
                      )}
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
                  const approvedCount = campaign.arts.filter((a) => a.approved).length;
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
        </TabsContent>

        {/* ═══ IDENTIDADE VISUAL ═══ */}
        <TabsContent value="base" className="space-y-5 mt-4">
          {sections.map(section => {
            const isEditing = editingSection === section.id;
            return (
              <Card key={section.id} className="glass-card">
                <CardContent className="py-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">{section.icon}</div>
                      <p className="text-sm font-bold">{section.title}</p>
                    </div>
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => {
                        if (isEditing) toast({ title: "Salvo!" });
                        setEditingSection(isEditing ? null : section.id);
                      }}
                    >
                      {isEditing ? <><Check className="w-3.5 h-3.5" /> Salvar</> : <><Edit3 className="w-3.5 h-3.5" /> Editar</>}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {section.fields.map(field => (
                      <div key={field.key}>
                        <Label className="text-[11px] text-muted-foreground">{field.label}</Label>
                        {field.type === "upload" ? (
                          <div className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors">
                            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Arraste ou clique para fazer upload</p>
                          </div>
                        ) : isEditing ? (
                          field.type === "textarea" ? (
                            <Textarea value={field.value} onChange={e => updateField(section.id, field.key, e.target.value)} rows={3} className="mt-1" />
                          ) : (
                            <Input value={field.value} onChange={e => updateField(section.id, field.key, e.target.value)} className="mt-1" />
                          )
                        ) : (
                          <p className="text-sm mt-1 whitespace-pre-line">{field.value || <span className="text-muted-foreground italic">Não preenchido</span>}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ═══ CALENDÁRIO ═══ */}
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
                {days.map(day => (
                  <div key={day.toISOString()} className="aspect-square flex items-center justify-center text-xs rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    {format(day, "d")}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
