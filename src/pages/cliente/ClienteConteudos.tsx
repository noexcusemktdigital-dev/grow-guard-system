import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText, Check, Plus, Sparkles, Copy,
  BookOpen, FolderOpen, Folder, Clock, ArrowLeft,
  Lightbulb, CheckCircle2, Circle,
  Star, ArrowRight, Play, Image, Layers, Video,
  Monitor, Smartphone, Square, RectangleHorizontal,
  Camera, Mic, Sun, Download, Filter,
  ChevronDown, History, GraduationCap, Megaphone, Palette,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { HelpTooltip } from "@/components/HelpTooltip";
import { useActiveStrategy } from "@/hooks/useMarketingStrategy";
import { Checkbox } from "@/components/ui/checkbox";
import { ApprovalPanel, ApprovalStatusBadge, type ApprovalStatus } from "@/components/approval/ApprovalPanel";
import { ApprovalSummary } from "@/components/approval/ApprovalSummary";
import { UsageQuotaBanner } from "@/components/quota/UsageQuotaBanner";
import { useClienteSubscription } from "@/hooks/useClienteSubscription";
import { getPlanBySlug, recommendContentDistribution } from "@/constants/plans";
import { ChatBriefing } from "@/components/cliente/ChatBriefing";
import { AGENTS, LUNA_STEPS } from "@/components/cliente/briefingAgents";

/* ── Types ── */
interface GeneratedContent {
  id: string;
  titulo: string;
  formato: "Feed" | "Carrossel" | "Reels" | "Story";
  rede: string;
  funil: "Topo" | "Meio" | "Fundo";
  roteiro: string;
  hashtags: string[];
  embasamento: string;
  status: ApprovalStatus;
  changeNote?: string;
  // backward compat
  approved?: boolean;
}

interface Campaign {
  id: string;
  mes: string;
  label: string;
  createdAt: string;
  briefing: {
    objetivo: string;
    tema: string;
    tom: string;
  };
  conteudos: GeneratedContent[];
}

/* ── Backward compat helper ── */
function migrateContentStatus(c: any): GeneratedContent {
  if (c.status && typeof c.status === "string") return c;
  return { ...c, status: c.approved ? "approved" : "pending" };
}

/* ── Constants ── */
const CURRENT_MONTH = "2026-02";

const formatColors: Record<string, string> = {
  Feed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Carrossel: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Reels: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  Story: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const funnelColors: Record<string, string> = {
  Topo: "bg-primary/10 text-primary",
  Meio: "bg-sky-500/10 text-sky-600",
  Fundo: "bg-emerald-500/10 text-emerald-600",
};

const networkColors: Record<string, string> = {
  Instagram: "bg-pink-500/10 text-pink-500",
  LinkedIn: "bg-sky-500/10 text-sky-500",
  TikTok: "bg-purple-500/10 text-purple-500",
};

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const OBJETIVOS = [
  "Gerar leads", "Aumentar engajamento", "Lançar produto", "Vender mais", "Fortalecer marca",
];

const TONS = ["Educativo", "Inspirador", "Direto", "Storytelling", "Misto"];

const loadingPhrases = [
  "Analisando seu público-alvo...",
  "Definindo estratégia de funil...",
  "Criando roteiros personalizados...",
  "Selecionando formatos ideais...",
  "Gerando hashtags relevantes...",
  "Definindo CTAs estratégicos...",
  "Embasando cada conteúdo...",
  "Finalizando sua campanha...",
];

/* ── Tutorial data ── */
const tutorialData = [
  {
    formato: "Post Feed",
    icon: <Image className="w-6 h-6" />,
    dimensao: "1080 × 1080 px",
    proporcao: "1:1",
    cor: "bg-blue-500/10 border-blue-500/20 text-blue-600",
    specs: ["Formato quadrado (1:1)", "JPEG ou PNG, máx 30MB", "Até 2.200 caracteres na legenda"],
    comoGravar: ["Boa iluminação natural ou ring light", "Fundo limpo e organizado", "Texto legível (fonte mín 24pt)"],
    estrutura: "Gancho → Conteúdo principal → CTA\n\nEx: Comece com uma pergunta provocativa, desenvolva 3-5 pontos e finalize com chamada para ação.",
  },
  {
    formato: "Carrossel",
    icon: <Layers className="w-6 h-6" />,
    dimensao: "1080 × 1080 px (cada slide)",
    proporcao: "1:1",
    cor: "bg-purple-500/10 border-purple-500/20 text-purple-600",
    specs: ["Até 10 slides por carrossel", "Mesma proporção em todos os slides", "3x mais salvamentos que posts normais"],
    comoGravar: ["Capa atrativa com gancho forte", "Um ponto por slide (evite poluir)", "Último slide sempre com CTA"],
    estrutura: "Slide 1: Capa com gancho\nSlide 2-8: Conteúdo (1 ideia/slide)\nSlide 9: Resumo visual\nSlide 10: CTA + 'Salve para depois'",
  },
  {
    formato: "Reels / Vídeo Curto",
    icon: <Video className="w-6 h-6" />,
    dimensao: "1080 × 1920 px",
    proporcao: "9:16",
    cor: "bg-pink-500/10 border-pink-500/20 text-pink-600",
    specs: ["Duração ideal: 15-60 segundos", "Formato vertical (9:16)", "Gancho nos 3 primeiros segundos"],
    comoGravar: ["Grave na vertical com celular fixo", "Áudio claro (use microfone lapela)", "Iluminação frontal, evite contraluz", "Olhe para a câmera, fale com energia"],
    estrutura: "[0-3s] Gancho forte\n[3-15s] Contexto/Problema\n[15-40s] Desenvolvimento\n[40-55s] Solução/Resultado\n[55-60s] CTA",
  },
  {
    formato: "Story",
    icon: <Smartphone className="w-6 h-6" />,
    dimensao: "1080 × 1920 px",
    proporcao: "9:16",
    cor: "bg-amber-500/10 border-amber-500/20 text-amber-600",
    specs: ["Duração: até 60s por story", "Use enquetes, perguntas e stickers", "Sequência narrativa de 3-5 stories"],
    comoGravar: ["Enquetes e caixas de pergunta geram interação", "Use legendas (70% assistem sem som)", "Conte uma história em sequência"],
    estrutura: "Story 1: Gancho (pergunta ou dado)\nStory 2-3: Desenvolvimento\nStory 4: CTA (link, enquete, DM)",
  },
  {
    formato: "Vídeo Longo (YouTube)",
    icon: <Monitor className="w-6 h-6" />,
    dimensao: "1920 × 1080 px",
    proporcao: "16:9",
    cor: "bg-red-500/10 border-red-500/20 text-red-600",
    specs: ["Duração: 8-15 minutos ideal", "Formato horizontal (16:9)", "Thumbnail personalizada é obrigatória"],
    comoGravar: ["Câmera na altura dos olhos", "Microfone externo (condensador ou lapela)", "Cenário com identidade da marca", "Edição com cortes a cada 5-8 segundos"],
    estrutura: "[0-30s] Gancho + promessa\n[30s-1min] Intro (apresentação rápida)\n[1-10min] Conteúdo principal\n[10-12min] Resumo + CTA\n[Final] Tela de inscrição",
  },
];

/* ── Mock initial campaigns ── */
const initialCampaigns: Campaign[] = [
  {
    id: "feb-2026",
    mes: "2026-02",
    label: "Fevereiro 2026",
    createdAt: "05/02/2026",
    briefing: { objetivo: "Gerar leads", tema: "Marketing para Franquias", tom: "Educativo" },
    conteudos: [
      { id: "1", titulo: "5 Erros que Todo Franqueado Comete no Marketing", formato: "Carrossel", rede: "Instagram", funil: "Topo", roteiro: "ABERTURA: Você sabia que 78% dos franqueados cometem pelo menos um desses erros no marketing?\n\nERRO 1 — Não ter persona definida\nA maioria investe em anúncios sem saber exatamente quem quer atingir.\n\nERRO 2 — Ignorar o marketing local\nFranquias precisam de estratégia nacional E local.\n\nERRO 3 — Não medir resultados\nSe você não sabe seu CAC, CPL e taxa de conversão, está voando às cegas.\n\nERRO 4 — Conteúdo genérico demais\nPostar frases motivacionais não gera leads.\n\nERRO 5 — Não usar automação\nResponder leads manualmente em 2026?\n\nCTA: Quer corrigir esses erros? Acesse o link na bio.", hashtags: ["#marketing", "#franquias", "#erros", "#marketingdigital", "#leads"], embasamento: "Carrosséis educativos no Instagram têm 3x mais salvamentos, ideal para topo de funil com público que está na fase de descoberta.", status: "approved" },
      { id: "2", titulo: "Como Definir Metas de Vendas para Sua Franquia", formato: "Feed", rede: "LinkedIn", funil: "Meio", roteiro: "Título: Como Definir Metas de Vendas que Realmente Funcionam\n\nMetas vagas geram resultados vagos. Se sua meta é 'vender mais', você já começou errado.\n\nUse o método SMART:\n- Específica: 'Aumentar vendas da unidade Centro em 20%'\n- Mensurável: Acompanhe semanalmente no CRM\n- Atingível: Baseie-se no histórico dos últimos 3 meses\n- Relevante: Alinhada com o objetivo da rede\n- Temporal: Prazo de 90 dias\n\nCTA: Baixe nosso template gratuito de metas no link da bio.", hashtags: ["#vendas", "#metas", "#crm", "#franquias", "#gestao"], embasamento: "Posts educativos no LinkedIn geram 2x mais engajamento entre decisores B2B, ideal para meio de funil com conteúdo de valor.", status: "approved" },
      { id: "3", titulo: "Case - Franquia que Triplicou Leads com IA", formato: "Reels", rede: "Instagram", funil: "Fundo", roteiro: "[0-5s] HOOK: 'Essa franquia triplicou seus leads em 90 dias.'\n\n[5-15s] CONTEXTO: A Rede FastFood tinha 3 unidades e gerava em média 50 leads/mês.\n\n[15-30s] PROBLEMA: Time respondia leads manualmente, perdia oportunidades.\n\n[30-45s] SOLUÇÃO: Implementaram plataforma com IA para qualificação automática.\n\n[45-55s] RESULTADO: 150 leads/mês por unidade, 40% de conversão, ROI de 8x.\n\n[55-60s] CTA: 'Quer o mesmo resultado? Link na bio.'", hashtags: ["#case", "#ia", "#leads", "#franquias", "#resultados"], embasamento: "Reels com cases de sucesso e dados concretos convertem 5x mais no fundo de funil, pois oferecem prova social.", status: "pending" },
    ],
  },
];

export default function ClienteConteudos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: subscription } = useClienteSubscription();
  const plan = getPlanBySlug(subscription?.plan);
  const maxContents = plan?.maxContents ?? 8;
  const planName = plan?.name ?? "Starter";
  const { data: activeStrategy } = useActiveStrategy();

  // Tab from URL (for "Gravar" redirect)
  const initialTab = searchParams.get("tab") || "campanhas";
  const initialFormat = searchParams.get("formato") || null;

  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    initialCampaigns.map(c => ({ ...c, conteudos: c.conteudos.map(migrateContentStatus) }))
  );
  const [openCampaign, setOpenCampaign] = useState<string | null>(null);
  const [openContent, setOpenContent] = useState<GeneratedContent | null>(null);
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(0);

  // Briefing fields
  const [bMes, setBMes] = useState("Março 2026");
  const [bObjetivos, setBObjetivos] = useState<string[]>([]);
  const [bTema, setBTema] = useState("");
  const [bPromocoes, setBPromocoes] = useState("");
  const [bDatas, setBDatas] = useState("");
  const [bDestaques, setBDestaques] = useState("");
  const [bTom, setBTom] = useState("");

  // Persona fields
  const [personaNome, setPersonaNome] = useState("");
  const [personaDescricao, setPersonaDescricao] = useState("");

  // Format quantities
  const [qFeed, setQFeed] = useState(0);
  const [qCarrossel, setQCarrossel] = useState(0);
  const [qReels, setQReels] = useState(0);
  const [qStory, setQStory] = useState(0);

  const totalFormatos = qFeed + qCarrossel + qReels + qStory;

  // Count total individual contents this month (not campaigns)
  const contentsThisMonth = campaigns
    .filter(c => c.mes.includes("2026"))
    .reduce((sum, c) => sum + c.conteudos.length, 0);
  const saldoRestante = maxContents === -1 ? Infinity : Math.max(0, maxContents - contentsThisMonth);
  const quotaExceeded = maxContents !== -1 && totalFormatos > saldoRestante;

  // Rotate loading phrases
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingPhrase((p) => (p + 1) % loadingPhrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleChatComplete = async (answers: Record<string, any>) => {
    const objetivos = Array.isArray(answers.objetivos) ? answers.objetivos : [];
    const tema = (answers.tema || "") as string;
    const tom = (answers.tom || "") as string;
    const mes = (answers.mes || "Março 2026") as string;
    const feed = parseInt(answers.qFeed) || 0;
    const carrossel = parseInt(answers.qCarrossel) || 0;
    const reels = parseInt(answers.qReels) || 0;
    const story = parseInt(answers.qStory) || 0;

    if (objetivos.length === 0 || !tema || !tom) {
      toast({ title: "Preencha os campos obrigatórios", description: "Objetivo, tema e tom são necessários.", variant: "destructive" });
      return;
    }
    const total = feed + carrossel + reels + story;
    if (total === 0) {
      toast({ title: "Selecione ao menos 1 formato", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setLoadingPhrase(0);
    try {
      const estrategia = activeStrategy?.answers || null;
      const personaData = (answers.persona_nome || answers.persona_descricao)
        ? { nome: answers.persona_nome, descricao: answers.persona_descricao }
        : undefined;

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          briefing: { mes, objetivo: objetivos.join(", "), tema, promocoes: answers.promocoes || "", datas: answers.datas || "", destaques: answers.destaques || "", tom },
          formatos: { feed, carrossel, reels, story },
          estrategia,
          persona: personaData,
        },
      });
      if (error) throw error;

      const conteudos: GeneratedContent[] = (data?.conteudos || []).map(
        (c: any, i: number) => ({ ...c, id: `gen-${Date.now()}-${i}`, status: "pending" as ApprovalStatus })
      );
      const newCampaign: Campaign = {
        id: `campaign-${Date.now()}`, mes, label: mes,
        createdAt: new Date().toLocaleDateString("pt-BR"),
        briefing: { objetivo: objetivos.join(", "), tema, tom },
        conteudos,
      };
      const updatedCampaigns = [newCampaign, ...campaigns];
      setCampaigns(updatedCampaigns);
      try { localStorage.setItem("content-campaigns", JSON.stringify(updatedCampaigns)); } catch {}
      setWizardOpen(false);
      setOpenCampaign(newCampaign.id);
      toast({ title: "Campanha gerada com sucesso!", description: `${conteudos.length} conteúdos criados para ${mes}.` });
    } catch (err: any) {
      console.error("Generation error:", err);
      toast({ title: "Erro ao gerar conteúdos", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (bObjetivos.length === 0 || !bTema || !bTom) {
      toast({ title: "Preencha os campos obrigatórios", description: "Objetivo, tema e tom são necessários.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setLoadingPhrase(0);

    try {
      const estrategia = activeStrategy?.answers || null;

      const personaData = (personaNome || personaDescricao)
        ? { nome: personaNome, descricao: personaDescricao }
        : undefined;

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          briefing: { mes: bMes, objetivo: bObjetivos.join(", "), tema: bTema, promocoes: bPromocoes, datas: bDatas, destaques: bDestaques, tom: bTom },
          formatos: { feed: qFeed, carrossel: qCarrossel, reels: qReels, story: qStory },
          estrategia,
          persona: personaData,
        },
      });

      if (error) throw error;

      const conteudos: GeneratedContent[] = (data?.conteudos || []).map(
        (c: any, i: number) => ({
          ...c,
          id: `gen-${Date.now()}-${i}`,
          status: "pending" as ApprovalStatus,
        })
      );

      const newCampaign: Campaign = {
        id: `campaign-${Date.now()}`,
        mes: bMes,
        label: bMes,
        createdAt: new Date().toLocaleDateString("pt-BR"),
        briefing: { objetivo: bObjetivos.join(", "), tema: bTema, tom: bTom },
        conteudos,
      };

      const updatedCampaigns = [newCampaign, ...campaigns];
      setCampaigns(updatedCampaigns);

      try {
        localStorage.setItem("content-campaigns", JSON.stringify(updatedCampaigns));
      } catch {}

      setWizardOpen(false);
      setWizardStep(1);
      setOpenCampaign(newCampaign.id);
      toast({ title: "Campanha gerada com sucesso!", description: `${conteudos.length} conteúdos criados para ${bMes}.` });
    } catch (err: any) {
      console.error("Generation error:", err);
      toast({ title: "Erro ao gerar conteúdos", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateContentStatus = (contentId: string, newStatus: ApprovalStatus, changeNote?: string) => {
    setCampaigns((prev) =>
      prev.map((c) => ({
        ...c,
        conteudos: c.conteudos.map((ct) =>
          ct.id === contentId ? { ...ct, status: newStatus, changeNote: changeNote || ct.changeNote } : ct
        ),
      }))
    );
    if (openContent?.id === contentId) {
      setOpenContent((prev) => prev ? { ...prev, status: newStatus, changeNote: changeNote || prev.changeNote } : null);
    }
  };

  const approveAll = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? { ...c, conteudos: c.conteudos.map((ct) => ({ ...ct, status: "approved" as ApprovalStatus })) }
          : c
      )
    );
    toast({ title: "Todos os conteúdos aprovados!" });
  };

  const approvePending = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? { ...c, conteudos: c.conteudos.map((ct) => ct.status === "pending" ? { ...ct, status: "approved" as ApprovalStatus } : ct) }
          : c
      )
    );
    toast({ title: "Conteúdos pendentes aprovados!" });
  };

  const currentCampaign = campaigns.find((c) => c.id === openCampaign);

  const filteredConteudos = currentCampaign?.conteudos.filter((c) => {
    if (formatFilter !== "all" && c.formato !== formatFilter) return false;
    if (statusFilter === "approved" && c.status !== "approved") return false;
    if (statusFilter === "pending" && c.status !== "pending") return false;
    if (statusFilter === "changes_requested" && c.status !== "changes_requested") return false;
    if (statusFilter === "rejected" && c.status !== "rejected") return false;
    return true;
  });

  const isCurrentMonth = (mes: string) => mes.includes("Fevereiro") && mes.includes("2026");

  // Approval stats for current campaign
  const approvalStats = currentCampaign ? {
    total: currentCampaign.conteudos.length,
    approved: currentCampaign.conteudos.filter(c => c.status === "approved").length,
    changesRequested: currentCampaign.conteudos.filter(c => c.status === "changes_requested").length,
    rejected: currentCampaign.conteudos.filter(c => c.status === "rejected").length,
  } : { total: 0, approved: 0, changesRequested: 0, rejected: 0 };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Conteúdos"
        subtitle="Agência de IA — Gere campanhas mensais completas para suas redes sociais"
        icon={<Megaphone className="w-5 h-5 text-primary" />}
      />

      <Tabs defaultValue={initialTab} onValueChange={(v) => {
        if (v !== "tutorial") setSearchParams({});
      }}>
        <TabsList>
          <TabsTrigger value="campanhas" className="text-xs gap-1.5">
            <FolderOpen className="w-3.5 h-3.5" /> Campanhas
          </TabsTrigger>
          <TabsTrigger value="tutorial" className="text-xs gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" /> Tutorial
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-xs gap-1.5">
            <History className="w-3.5 h-3.5" /> Histórico
          </TabsTrigger>
        </TabsList>

        {/* ═══ CAMPANHAS ═══ */}
        <TabsContent value="campanhas" className="space-y-4 mt-4">
          {/* Quota banner */}
          <UsageQuotaBanner
            used={contentsThisMonth}
            limit={maxContents}
            label="conteúdos"
            planName={planName}
          />

          {/* New campaign button */}
          <Button
            className="w-full gap-2 h-12 text-sm font-semibold"
            onClick={() => { setWizardOpen(true); setWizardStep(1); }}
            disabled={maxContents !== -1 && contentsThisMonth >= maxContents}
          >
            <Plus className="w-4 h-4" /> Nova Campanha Mensal
          </Button>

          {/* Wizard Dialog — ChatBriefing com Luna */}
          <Dialog open={wizardOpen} onOpenChange={(open) => { if (!isGenerating) setWizardOpen(open); }}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-16 gap-6 px-6">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="p-4 rounded-full bg-primary/10"
                  >
                    <Sparkles className="w-10 h-10 text-primary" />
                  </motion.div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingPhrase}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-muted-foreground text-center"
                    >
                      {loadingPhrases[loadingPhrase]}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-xs text-muted-foreground/60">Isso pode levar até 30 segundos...</p>
                </div>
              ) : (
                <ChatBriefing
                  agent={AGENTS.luna}
                  steps={LUNA_STEPS}
                  onComplete={handleChatComplete}
                  onCancel={() => setWizardOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Breadcrumb */}
          {openCampaign && !openContent && (
            <div className="flex items-center gap-2 text-sm">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => { setOpenCampaign(null); setFormatFilter("all"); setStatusFilter("all"); }}>
                <ArrowLeft className="w-3 h-3" /> Voltar
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{currentCampaign?.label}</span>
            </div>
          )}

          {openContent && (
            <div className="flex items-center gap-2 text-sm">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => setOpenContent(null)}>
                <ArrowLeft className="w-3 h-3" /> Voltar
              </Button>
              <span className="text-muted-foreground">/</span>
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={() => setOpenContent(null)}>{currentCampaign?.label}</button>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium text-xs truncate max-w-xs">{openContent.titulo}</span>
            </div>
          )}

          {/* Content detail view */}
          {openContent ? (
            <Card className="glass-card">
              <CardContent className="py-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold">{openContent.titulo}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={`text-[9px] ${formatColors[openContent.formato] || ""}`}>{openContent.formato}</Badge>
                      <Badge className={`text-[9px] ${networkColors[openContent.rede] || ""}`}>{openContent.rede}</Badge>
                      <Badge className={`text-[9px] ${funnelColors[openContent.funil] || ""}`}>{openContent.funil}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(openContent.roteiro); toast({ title: "Roteiro copiado!" }); }}>
                    <Copy className="w-3.5 h-3.5" /> Copiar
                  </Button>
                </div>

                {/* Script */}
                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                  <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{openContent.roteiro}</p>
                </div>

                {/* Hashtags */}
                {openContent.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {openContent.hashtags.map((h, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] text-muted-foreground">{h.startsWith("#") ? h : `#${h}`}</Badge>
                    ))}
                  </div>
                )}

                {/* Embasamento */}
                {openContent.embasamento && (
                  <div className="flex gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1">Por que este conteúdo?</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{openContent.embasamento}</p>
                    </div>
                  </div>
                )}

                {/* Approval Panel */}
                <ApprovalPanel
                  status={openContent.status}
                  changeNote={openContent.changeNote}
                  onApprove={() => {
                    updateContentStatus(openContent.id, "approved");
                    toast({ title: "Conteúdo aprovado!" });
                  }}
                  onRequestChanges={(note) => {
                    updateContentStatus(openContent.id, "changes_requested", note);
                    toast({ title: "Alteração solicitada!" });
                  }}
                  onReject={() => {
                    updateContentStatus(openContent.id, "rejected");
                    toast({ title: "Conteúdo rejeitado." });
                  }}
                />

                {/* ── Action Buttons ── */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 h-8"
                    onClick={() => {
                      navigator.clipboard.writeText(openContent.roteiro);
                      toast({ title: "Roteiro copiado!" });
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 h-8"
                    onClick={() => {
                      const el = document.createElement("div");
                      el.innerHTML = `
                        <div style="font-family:sans-serif;padding:32px;max-width:600px;">
                          <h1 style="font-size:18px;margin-bottom:8px;">${openContent.titulo}</h1>
                          <p style="font-size:12px;color:#888;margin-bottom:16px;">${openContent.formato} · ${openContent.rede} · ${openContent.funil}</p>
                          <div style="white-space:pre-line;font-size:13px;line-height:1.7;margin-bottom:16px;">${openContent.roteiro}</div>
                          ${openContent.hashtags?.length ? `<p style="font-size:11px;color:#666;">${openContent.hashtags.map(h => h.startsWith('#') ? h : '#' + h).join(' ')}</p>` : ''}
                          ${openContent.embasamento ? `<div style="margin-top:16px;padding:12px;background:#f5f5f5;border-radius:8px;font-size:11px;"><strong>Embasamento:</strong> ${openContent.embasamento}</div>` : ''}
                        </div>
                      `;
                      import("html2pdf.js").then(({ default: html2pdf }) => {
                        html2pdf().set({ margin: 0.5, filename: `${openContent.titulo.slice(0, 40)}.pdf`, html2canvas: { scale: 2 } }).from(el).save();
                      });
                    }}
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 h-8"
                    onClick={() => {
                      navigate(`/cliente/redes-sociais?fromContent=${openContent.id}&titulo=${encodeURIComponent(openContent.titulo)}&roteiro=${encodeURIComponent(openContent.roteiro.slice(0, 500))}`);
                    }}
                  >
                    <Palette className="w-3.5 h-3.5" /> Gerar Arte
                  </Button>
                  {(openContent.formato === "Reels" || openContent.formato === "Story") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 h-8"
                      onClick={() => {
                        setSearchParams({ tab: "tutorial", formato: openContent.formato });
                        setOpenContent(null);
                      }}
                    >
                      <Video className="w-3.5 h-3.5" /> Gravar Vídeo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : openCampaign && currentCampaign ? (
            /* Content cards inside campaign */
            <div className="space-y-3">
              {/* Approval Summary */}
              <ApprovalSummary
                total={approvalStats.total}
                approved={approvalStats.approved}
                changesRequested={approvalStats.changesRequested}
                rejected={approvalStats.rejected}
                onApproveAll={() => approveAll(currentCampaign.id)}
                onApprovePending={() => approvePending(currentCampaign.id)}
              />

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger className="h-7 text-[10px] w-auto gap-1">
                    <Filter className="w-3 h-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos formatos</SelectItem>
                    <SelectItem value="Feed">Feed</SelectItem>
                    <SelectItem value="Carrossel">Carrossel</SelectItem>
                    <SelectItem value="Reels">Reels</SelectItem>
                    <SelectItem value="Story">Story</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-7 text-[10px] w-auto gap-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="changes_requested">Alteração Solicitada</SelectItem>
                    <SelectItem value="rejected">Rejeitados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredConteudos?.map((content) => {
                  const borderColor =
                    content.status === "approved" ? "border-emerald-500/20 bg-emerald-500/[0.02]"
                    : content.status === "changes_requested" ? "border-amber-500/20 bg-amber-500/[0.02]"
                    : content.status === "rejected" ? "border-red-500/20 bg-red-500/[0.02]"
                    : "glass-card hover:bg-muted/30";

                  return (
                    <Card
                      key={content.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${borderColor}`}
                      onClick={() => setOpenContent(content)}
                    >
                      <CardContent className="py-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-tight flex-1">{content.titulo}</p>
                          <ApprovalStatusBadge status={content.status} />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className={`text-[9px] ${formatColors[content.formato] || ""}`}>{content.formato}</Badge>
                          <Badge className={`text-[9px] ${networkColors[content.rede] || ""}`}>{content.rede}</Badge>
                          <Badge className={`text-[9px] ${funnelColors[content.funil] || ""}`}>{content.funil}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{content.roteiro.slice(0, 120)}...</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredConteudos?.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground">Nenhum conteúdo encontrado com os filtros selecionados.</p>
                </div>
              )}
            </div>
          ) : (
            /* Campaign folder list */
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const isCurrent = isCurrentMonth(campaign.label);
                const approved = campaign.conteudos.filter((c) => c.status === "approved").length;
                const total = campaign.conteudos.length;
                const allApproved = approved === total && total > 0;

                return (
                  <Card
                    key={campaign.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isCurrent
                        ? "ring-2 ring-primary/40 bg-primary/[0.03] shadow-md shadow-primary/10"
                        : "glass-card hover:bg-muted/30"
                    }`}
                    onClick={() => setOpenCampaign(campaign.id)}
                  >
                    <CardContent className="py-4 flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${isCurrent ? "bg-primary/15" : "bg-primary/10"}`}>
                        <Folder className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{campaign.label}</p>
                          {isCurrent && (
                            <Badge className="text-[9px] bg-primary/15 text-primary border-primary/30 gap-1">
                              <Star className="w-2.5 h-2.5" /> Mês Atual
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {total} conteúdos • {campaign.briefing.objetivo} • Criado em {campaign.createdAt}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] gap-1 shrink-0 ${allApproved ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/5" : ""}`}
                      >
                        <CheckCircle2 className="w-3 h-3" /> {approved}/{total}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}

              {campaigns.length === 0 && (
                <div className="text-center py-16">
                  <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda</p>
                  <p className="text-xs text-muted-foreground mt-1">Clique em "Nova Campanha Mensal" para gerar seus primeiros conteúdos com IA</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══ TUTORIAL ═══ */}
        <TabsContent value="tutorial" className="space-y-4 mt-4">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold">Guia de Formatos</h2>
            <p className="text-sm text-muted-foreground mt-1">Tudo que você precisa saber para produzir conteúdo profissional</p>
          </div>

          {initialFormat && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium">Mostrando instruções para <span className="text-primary font-bold">{initialFormat}</span></p>
              <Button variant="ghost" size="sm" className="text-xs h-6 ml-auto" onClick={() => setSearchParams({})}>
                Ver todos
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tutorialData
              .filter(item => {
                if (!initialFormat) return true;
                if (initialFormat === "Reels") return item.formato.includes("Reels") || item.formato.includes("Vídeo Curto");
                if (initialFormat === "Story") return item.formato === "Story";
                return true;
              })
              .map((item) => (
              <Card key={item.formato} className={`border ${item.cor.split(" ").filter(c => c.startsWith("border-")).join(" ")} overflow-hidden ${initialFormat ? "ring-2 ring-primary/30" : ""}`}>
                <CardContent className="py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${item.cor.split(" ").filter(c => c.startsWith("bg-")).join(" ")}`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{item.formato}</p>
                        <p className="text-[11px] text-muted-foreground">{item.dimensao}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">{item.proporcao}</Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Especificações</p>
                    {item.specs.map((s, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span> {s}
                      </p>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Como Gravar
                    </p>
                    {item.comoGravar.map((tip, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">💡</span> {tip}
                      </p>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estrutura Ideal</p>
                    <div className="bg-muted/40 rounded-lg p-3">
                      <p className="text-[11px] text-foreground whitespace-pre-line leading-relaxed font-mono">{item.estrutura}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ HISTÓRICO ═══ */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold">Histórico de Campanhas</h2>
            <p className="text-sm text-muted-foreground mt-1">Todas as campanhas geradas em ordem cronológica</p>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma campanha no histórico</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const approved = campaign.conteudos.filter((c) => c.status === "approved").length;
                const total = campaign.conteudos.length;
                const formatCounts: Record<string, number> = {};
                campaign.conteudos.forEach((c) => {
                  formatCounts[c.formato] = (formatCounts[c.formato] || 0) + 1;
                });

                return (
                  <Collapsible key={campaign.id}>
                    <CollapsibleTrigger asChild>
                      <Card className="glass-card cursor-pointer hover:bg-muted/30 transition-all">
                        <CardContent className="py-4 flex items-center gap-4">
                          <div className="p-2 rounded-xl bg-primary/10">
                            <Clock className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{campaign.label}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {campaign.briefing.objetivo} • {campaign.briefing.tema}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {approved}/{total}
                            </Badge>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-6 mt-2 space-y-2 border-l-2 border-border pl-4 pb-2">
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(formatCounts).map(([formato, count]) => (
                            <Badge key={formato} variant="outline" className={`text-[10px] ${formatColors[formato] || ""}`}>
                              {count}× {formato}
                            </Badge>
                          ))}
                        </div>
                        {campaign.conteudos.slice(0, 5).map((c) => (
                          <div key={c.id} className="flex items-center gap-2 text-xs">
                            <ApprovalStatusBadge status={c.status} />
                            <span className={c.status === "approved" ? "" : "text-muted-foreground"}>{c.titulo}</span>
                            <Badge className={`text-[8px] ml-auto ${formatColors[c.formato] || ""}`}>{c.formato}</Badge>
                          </div>
                        ))}
                        {campaign.conteudos.length > 5 && (
                          <p className="text-[10px] text-muted-foreground">+ {campaign.conteudos.length - 5} mais conteúdos</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
