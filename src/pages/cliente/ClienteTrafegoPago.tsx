import { useState } from "react";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import { AdConnectionCards } from "@/components/trafego/AdConnectionCards";
import { AdMetricsDashboard } from "@/components/trafego/AdMetricsDashboard";
import { AdAIAnalysis } from "@/components/trafego/AdAIAnalysis";
import {
  DollarSign, Sparkles, Target, Users, Globe, BarChart3, Zap,
  Eye, MousePointer, TrendingUp, PlayCircle, ExternalLink,
  ChevronDown, ChevronUp, Loader2, History, CheckCircle2,
  ArrowLeft, ArrowRight, Briefcase, MapPin, Package, Link2,
  Image, Video, Layout, Monitor, MessageSquare, BookOpen,
  PieChart, Lightbulb, Trophy, ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import {
  useActiveTrafficStrategy, useTrafficStrategyHistory,
  useGenerateTrafficStrategy, useApproveTrafficStrategy,
  TrafficWizardData,
} from "@/hooks/useTrafficStrategy";
import { useActiveStrategy } from "@/hooks/useMarketingStrategy";
import { useClienteContent } from "@/hooks/useClienteContent";
import { usePostHistory } from "@/hooks/useClientePosts";
import { useClienteSitesDB } from "@/hooks/useClienteSitesDB";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StrategyBanner } from "@/components/cliente/StrategyBanner";
import { InsufficientCreditsDialog, isInsufficientCreditsError } from "@/components/cliente/InsufficientCreditsDialog";

// ── Constants ──
const OBJECTIVES = [
  { value: "gerar_leads", label: "Gerar Leads", icon: Users },
  { value: "vender_produtos", label: "Vender Produtos", icon: DollarSign },
  { value: "agendar_reunioes", label: "Agendar Reuniões", icon: Briefcase },
  { value: "captar_franqueados", label: "Captar Franqueados", icon: Trophy },
  { value: "trafego_site", label: "Tráfego no Site", icon: Globe },
];

const AUDIENCES = ["Empresários", "Médicos", "Pequenas Empresas", "Consumidores Finais", "Profissionais Liberais", "Startups"];

const DESTINATIONS = [
  { value: "site", label: "Site Institucional", icon: Monitor },
  { value: "landing_page", label: "Landing Page", icon: Layout },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "formulario", label: "Formulário", icon: BookOpen },
];

const PLATFORMS = [
  { value: "Meta", label: "Meta Ads", icon: Users, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { value: "Google", label: "Google Ads", icon: Globe, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { value: "TikTok", label: "TikTok Ads", icon: PlayCircle, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { value: "LinkedIn", label: "LinkedIn Ads", icon: BarChart3, color: "bg-sky-500/10 text-sky-500 border-sky-500/20" },
];

const ASSETS = [
  { value: "site", label: "Site", icon: Monitor },
  { value: "landing_page", label: "Landing Page", icon: Layout },
  { value: "artes", label: "Artes", icon: Image },
  { value: "videos", label: "Vídeos", icon: Video },
];

const STEPS = [
  { id: "objetivo", label: "Objetivo", icon: Target },
  { id: "produto", label: "Produto", icon: Package },
  { id: "publico", label: "Público", icon: Users },
  { id: "destino", label: "Destino", icon: Link2 },
  { id: "orcamento", label: "Orçamento", icon: DollarSign },
  { id: "plataformas", label: "Plataformas", icon: Globe },
  { id: "regiao", label: "Região", icon: MapPin },
  { id: "ativos", label: "Ativos", icon: Image },
] as const;

const platformColors: Record<string, string> = {
  Google: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Meta: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TikTok: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  LinkedIn: "bg-sky-500/10 text-sky-500 border-sky-500/20",
};

const platformIcons: Record<string, React.ReactNode> = {
  Google: <Globe className="w-5 h-5" />,
  Meta: <Users className="w-5 h-5" />,
  TikTok: <PlayCircle className="w-5 h-5" />,
  LinkedIn: <BarChart3 className="w-5 h-5" />,
};

const platformLinks: Record<string, string> = {
  Google: "https://ads.google.com",
  Meta: "https://business.facebook.com/adsmanager",
  TikTok: "https://ads.tiktok.com",
  LinkedIn: "https://www.linkedin.com/campaignmanager",
};

export default function ClienteTrafegoPago() {
  const { data: activeStrategy, isLoading: loadingStrategy } = useActiveTrafficStrategy();
  const { data: history, isLoading: loadingHistory } = useTrafficStrategyHistory();
  const { data: marketingStrategy } = useActiveStrategy();
  const { data: contentData } = useClienteContent();
  const { data: postsData } = usePostHistory();
  const { data: sitesData } = useClienteSitesDB();
  const { data: wallet } = useClienteWallet();
  const generateMutation = useGenerateTrafficStrategy();
  const approveMutation = useApproveTrafficStrategy();

  const [activeTab, setActiveTab] = useState("estrategia");
  const [step, setStep] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>({});
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);

  const [wizardData, setWizardData] = useState<TrafficWizardData>({
    objetivo: "",
    produto: "",
    publico: [],
    publico_custom: "",
    pagina_destino: "",
    orcamento: 2000,
    plataformas: [],
    regiao: "",
    ativos: [],
  });

  const togglePlatformExpand = (p: string) => setExpandedPlatforms((prev) => ({ ...prev, [p]: !prev[p] }));
  const toggleArrayItem = (field: keyof TrafficWizardData, val: string) => {
    setWizardData((prev) => {
      const arr = prev[field] as string[];
      return { ...prev, [field]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
  };

  // Auto-detect assets
  const detectedAssets: string[] = [];
  if (sitesData?.some((s) => s.status === "Publicado" || s.url)) detectedAssets.push("site");
  if (sitesData?.some((s) => s.type === "landing_page")) detectedAssets.push("landing_page");
  if (postsData?.some((p) => p.type === "art" && p.status === "done")) detectedAssets.push("artes");
  if (postsData?.some((p) => p.type === "video" && p.status === "done")) detectedAssets.push("videos");

  const canAdvance = () => {
    switch (STEPS[step].id) {
      case "objetivo": return !!wizardData.objetivo;
      case "produto": return wizardData.produto.trim().length > 5;
      case "publico": return wizardData.publico.length > 0 || wizardData.publico_custom.trim().length > 0;
      case "destino": return !!wizardData.pagina_destino;
      case "orcamento": return wizardData.orcamento >= 500;
      case "plataformas": return wizardData.plataformas.length > 0;
      case "regiao": return wizardData.regiao.trim().length > 2;
      case "ativos": return true;
      default: return true;
    }
  };

  const handleGenerate = () => {
    generateMutation.mutate({ ...wizardData, strategy_id: marketingStrategy?.id }, {
      onSuccess: () => {
        toast({ title: "Estratégia gerada!", description: "Revise e aprove para debitar os créditos." });
        setShowWizard(false);
        setStep(0);
      },
      onError: (err: any) => {
        if (err.code === "RATE_LIMIT") {
          toast({ title: "Limite de requisições", description: "Aguarde alguns minutos e tente novamente.", variant: "destructive" });
        } else {
          toast({ title: "Erro ao gerar estratégia", description: err.message, variant: "destructive" });
        }
      },
    });
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id, {
      onSuccess: () => toast({ title: "Estratégia aprovada!", description: "200 créditos foram debitados." }),
      onError: (err: any) => {
        if (isInsufficientCreditsError(err)) {
          setShowCreditsDialog(true);
        } else {
          toast({ title: "Erro ao aprovar", description: err?.message || "Erro desconhecido", variant: "destructive" });
        }
      },
    });
  };

  const sourceData = (activeStrategy?.source_data || {}) as any;
  const platforms = (activeStrategy?.platforms || []) as any[];

  // ── Wizard Steps Render ──
  const renderStep = () => {
    const stepId = STEPS[step].id;

    switch (stepId) {
      case "objetivo":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">Qual é o principal objetivo das campanhas?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {OBJECTIVES.map((o) => (
                <Card
                  key={o.value}
                  className={`cursor-pointer transition-all hover:shadow-md ${wizardData.objetivo === o.value ? "ring-2 ring-primary border-primary" : "border-muted"}`}
                  onClick={() => setWizardData((p) => ({ ...p, objetivo: o.value }))}
                >
                  <CardContent className="py-4 flex flex-col items-center gap-2 text-center">
                    <o.icon className={`w-6 h-6 ${wizardData.objetivo === o.value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">{o.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "produto":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">Qual produto ou serviço será anunciado?</p>
            <Textarea
              placeholder="Descreva o produto ou serviço principal que será anunciado..."
              value={wizardData.produto}
              onChange={(e) => setWizardData((p) => ({ ...p, produto: e.target.value }))}
              rows={4}
            />
          </div>
        );

      case "publico":
        return (
          <div className="space-y-4">
            <p className="text-sm font-medium">Quem você deseja atingir com os anúncios?</p>
            {marketingStrategy?.answers?.publico_alvo && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-[10px] font-semibold text-primary uppercase">📋 Da sua Estratégia de Marketing</p>
                <p className="text-xs mt-1 text-muted-foreground">{marketingStrategy.answers.publico_alvo}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {AUDIENCES.map((a) => (
                <Badge
                  key={a}
                  variant={wizardData.publico.includes(a) ? "default" : "outline"}
                  className="cursor-pointer text-xs py-1.5 px-3"
                  onClick={() => toggleArrayItem("publico", a)}
                >
                  {a}
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Ou descreva seu público personalizado..."
              value={wizardData.publico_custom}
              onChange={(e) => setWizardData((p) => ({ ...p, publico_custom: e.target.value }))}
            />
          </div>
        );

      case "destino":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">Para onde o anúncio deve levar o usuário?</p>
            {sitesData && sitesData.length > 0 && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-[10px] font-semibold text-primary uppercase">🌐 Sites detectados</p>
                <p className="text-xs mt-1 text-muted-foreground">{sitesData.map((s) => s.name).join(", ")}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {DESTINATIONS.map((d) => (
                <Card
                  key={d.value}
                  className={`cursor-pointer transition-all hover:shadow-md ${wizardData.pagina_destino === d.value ? "ring-2 ring-primary border-primary" : "border-muted"}`}
                  onClick={() => setWizardData((p) => ({ ...p, pagina_destino: d.value }))}
                >
                  <CardContent className="py-4 flex flex-col items-center gap-2 text-center">
                    <d.icon className={`w-6 h-6 ${wizardData.pagina_destino === d.value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">{d.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "orcamento":
        return (
          <div className="space-y-5">
            <p className="text-sm font-medium">Qual orçamento mensal para anúncios?</p>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">R$ {wizardData.orcamento.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-1">por mês</p>
            </div>
            <Slider
              value={[wizardData.orcamento]}
              onValueChange={([v]) => setWizardData((p) => ({ ...p, orcamento: v }))}
              min={500}
              max={50000}
              step={500}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>R$ 500</span>
              <span>R$ 50.000</span>
            </div>
          </div>
        );

      case "plataformas":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">Em quais plataformas deseja anunciar?</p>
            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.map((p) => {
                const selected = wizardData.plataformas.includes(p.value);
                return (
                  <Card
                    key={p.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-primary border-primary" : "border-muted"}`}
                    onClick={() => toggleArrayItem("plataformas", p.value)}
                  >
                    <CardContent className="py-4 flex flex-col items-center gap-2 text-center">
                      <div className={`p-2 rounded-xl ${p.color}`}>
                        <p.icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium">{p.label}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case "regiao":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium">Em qual região deseja anunciar?</p>
            <Input
              placeholder="Ex: São Paulo, Brasil inteiro, Região Sul..."
              value={wizardData.regiao}
              onChange={(e) => setWizardData((p) => ({ ...p, regiao: e.target.value }))}
            />
          </div>
        );

      case "ativos":
        return (
          <div className="space-y-4">
            <p className="text-sm font-medium">Quais ativos você já possui?</p>
            {detectedAssets.length > 0 && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-[10px] font-semibold text-primary uppercase">✅ Detectados automaticamente</p>
                <p className="text-xs mt-1 text-muted-foreground">{detectedAssets.join(", ")}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {ASSETS.map((a) => {
                const selected = wizardData.ativos.includes(a.value);
                return (
                  <Card
                    key={a.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-primary border-primary" : "border-muted"}`}
                    onClick={() => toggleArrayItem("ativos", a.value)}
                  >
                    <CardContent className="py-4 flex flex-col items-center gap-2 text-center">
                      <a.icon className={`w-6 h-6 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium">{a.label}</span>
                      {detectedAssets.includes(a.value) && !selected && (
                        <Badge variant="outline" className="text-[8px]">detectado</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
    }
  };

  // ── Result Render ──
  const renderResult = () => {
    if (loadingStrategy) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-5 h-32 animate-pulse bg-muted/20" /></Card>
          ))}
        </div>
      );
    }

    if (!activeStrategy || platforms.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium">Nenhuma estratégia gerada</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em "Nova Estratégia" para iniciar o wizard.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-5">
        {/* Status + Approve */}
        <div className="flex items-center justify-between">
          <Badge variant={activeStrategy.status === "approved" ? "default" : "secondary"} className="text-xs">
            {activeStrategy.status === "approved" ? "✅ Aprovada" : "⏳ Pendente de aprovação"}
          </Badge>
          <div className="flex gap-2">
            {activeStrategy.status !== "approved" && (
              <Button
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => handleApprove(activeStrategy.id)}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Aprovar (200 créditos)
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => { setShowWizard(true); setStep(0); }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Regerar
            </Button>
          </div>
        </div>

        {/* Diagnóstico */}
        {sourceData.diagnostico && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Diagnóstico de Mídia</p>
                  <p className="text-xs mt-1 text-muted-foreground">{sourceData.diagnostico}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investment Plan */}
        {sourceData.investment_plan?.distribution && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><PieChart className="w-4 h-4" /> Plano de Investimento</CardTitle>
            </CardHeader>
            <CardContent className="py-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {sourceData.investment_plan.distribution.map((d: any) => (
                  <div key={d.platform} className={`p-3 rounded-xl border ${platformColors[d.platform] || ""}`}>
                    <p className="text-xs font-bold">{d.platform}</p>
                    <p className="text-lg font-bold mt-1">{d.percentage}%</p>
                    <p className="text-[10px] text-muted-foreground">R$ {d.amount?.toLocaleString("pt-BR") || "—"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projections */}
        {sourceData.projections && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Projeção de Resultados</CardTitle>
            </CardHeader>
            <CardContent className="py-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Leads Estimados", value: sourceData.projections.total_leads },
                  { label: "Clientes Estimados", value: sourceData.projections.total_clients },
                  { label: "Faturamento", value: sourceData.projections.estimated_revenue },
                  { label: "ROI Estimado", value: sourceData.projections.estimated_roi },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-muted/30 border text-center">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">{item.label}</p>
                    <p className="text-sm font-bold mt-1">{item.value || "—"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Tracking */}
        {sourceData.kpi_tracking?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-muted-foreground">KPIs sugeridos:</span>
            {sourceData.kpi_tracking.map((kpi: string) => (
              <Badge key={kpi} variant="outline" className="text-[10px]">{kpi}</Badge>
            ))}
          </div>
        )}

        {/* Platform Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {platforms.map((p: any) => {
            const isOpen = expandedPlatforms[p.platform] ?? false;
            return (
              <Card key={p.platform} className={`border-l-4 ${platformColors[p.platform]?.split(" ").find((s: string) => s.startsWith("border-")) || ""}`}>
                <CardContent className="py-5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${platformColors[p.platform]}`}>
                      {platformIcons[p.platform]}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{p.platform} Ads</p>
                      <Badge className={`text-[9px] mt-0.5 ${platformColors[p.platform]}`}>{p.objective}</Badge>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/30 border">
                    <p className="text-[10px] font-medium text-muted-foreground">PÚBLICO-ALVO</p>
                    <p className="text-xs mt-1">{p.audience}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-muted/30 border">
                      <p className="text-[10px] font-medium text-muted-foreground">ORÇAMENTO</p>
                      <p className="text-sm font-bold mt-1">{p.budget_suggestion}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border">
                      <p className="text-[10px] font-medium text-muted-foreground">CRIATIVOS</p>
                      <p className="text-xs mt-1">{p.creative_formats}</p>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { icon: Eye, label: "Alcance", value: p.kpis?.estimated_reach },
                      { icon: MousePointer, label: "Cliques", value: p.kpis?.estimated_clicks },
                      { icon: TrendingUp, label: "CPC", value: p.kpis?.estimated_cpc },
                      { icon: DollarSign, label: "CPL", value: p.kpis?.estimated_cpl },
                    ].map((kpi) => (
                      <div key={kpi.label} className="text-center p-2 rounded-lg bg-muted/20">
                        <kpi.icon className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                        <p className="text-[10px] font-bold">{kpi.value || "—"}</p>
                        <p className="text-[8px] text-muted-foreground">{kpi.label}</p>
                      </div>
                    ))}
                  </div>

                  <Collapsible open={isOpen} onOpenChange={() => togglePlatformExpand(p.platform)}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full text-xs gap-1.5">
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isOpen ? "Menos detalhes" : "Mais detalhes"}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-2">
                      {/* Ad copies */}
                      {p.ad_copies?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Copies de Anúncio</p>
                          {p.ad_copies.map((copy: string, i: number) => (
                            <div key={i} className="p-2.5 rounded-lg bg-muted/20 border mb-1.5">
                              <p className="text-xs italic">"{copy}"</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Keywords */}
                      {p.keywords?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Palavras-chave</p>
                          <div className="flex flex-wrap gap-1">
                            {p.keywords.map((kw: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[9px]">{kw}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interests */}
                      {p.interests?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Interesses</p>
                          <div className="flex flex-wrap gap-1">
                            {p.interests.map((int: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[9px]">{int}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Campaign Structure */}
                      {p.campaign_structure?.campaigns?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Estrutura de Campanhas</p>
                          {p.campaign_structure.campaigns.map((c: any, ci: number) => (
                            <div key={ci} className="p-2.5 rounded-lg bg-muted/10 border mb-1.5">
                              <p className="text-xs font-bold">{c.name}</p>
                              {c.ad_sets?.map((as_: any, ai: number) => (
                                <div key={ai} className="ml-3 mt-1.5 pl-2 border-l-2 border-muted">
                                  <p className="text-[11px] font-medium">{as_.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{as_.targeting}</p>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Optimization */}
                      {p.optimization_actions?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Otimização</p>
                          {p.optimization_actions.map((act: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/10 border mb-1">
                              <Zap className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                              <p className="text-[11px]">{act}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tutorial */}
                      {p.tutorial?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Tutorial de Execução</p>
                          {p.tutorial.map((step_: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 mb-1">
                              <span className="text-[10px] font-bold text-primary shrink-0">{i + 1}.</span>
                              <p className="text-[11px]">{step_}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tips */}
                      {p.tips?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Dicas</p>
                          {p.tips.map((tip: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 mb-1">
                              <Sparkles className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                              <p className="text-[11px]">{tip}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5"
                    onClick={() => window.open(platformLinks[p.platform], "_blank")}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir {p.platform}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Tráfego Pago"
        subtitle="Estratégia de campanhas gerada por IA com wizard guiado"
        icon={<DollarSign className="w-5 h-5 text-primary" />}
        actions={<FeatureTutorialButton slug="trafego" />}
      />

      <StrategyBanner toolName="o tráfego pago" dataUsed="Canais prioritários, funil e público-alvo" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="estrategia" className="text-xs gap-1.5"><Target className="w-3.5 h-3.5" /> Estratégia</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs gap-1.5"><History className="w-3.5 h-3.5" /> Histórico</TabsTrigger>
        </TabsList>

        {/* ═══ ESTRATÉGIA ═══ */}
        <TabsContent value="estrategia" className="space-y-5 mt-4">
          {showWizard ? (
            <Card>
              <CardContent className="py-6">
                {/* Stepper */}
                <div className="flex items-center justify-center gap-1 mb-6 overflow-x-auto pb-2">
                  {STEPS.map((s, i) => (
                    <div key={s.id} className="flex items-center">
                      <button
                        onClick={() => i <= step && setStep(i)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${
                          i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <s.icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{s.label}</span>
                      </button>
                      {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground mx-0.5" />}
                    </div>
                  ))}
                </div>

                {/* Generate loading */}
                {generateMutation.isPending ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                    <p className="text-sm font-medium">Gerando sua estratégia de tráfego...</p>
                    <p className="text-xs text-muted-foreground">Isso pode levar até 30 segundos</p>
                  </div>
                ) : (
                  <>
                    {renderStep()}

                    <div className="flex justify-between mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5"
                        onClick={() => step === 0 ? setShowWizard(false) : setStep((s) => s - 1)}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> {step === 0 ? "Cancelar" : "Voltar"}
                      </Button>

                      {step < STEPS.length - 1 ? (
                        <Button
                          size="sm"
                          className="text-xs gap-1.5"
                          disabled={!canAdvance()}
                          onClick={() => setStep((s) => s + 1)}
                        >
                          Próximo <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="text-xs gap-1.5"
                          onClick={handleGenerate}
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Gerar Estratégia
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* CTA Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-5">
                  <div className="flex items-start gap-3 mb-4">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Estratégia de Tráfego com IA</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Wizard guiado de 8 etapas que gera estratégia completa por plataforma.
                        <Badge variant="outline" className="ml-2 text-[9px]">200 créditos na aprovação</Badge>
                      </p>
                    </div>
                  </div>
                  <Button className="w-full gap-2" onClick={() => setShowWizard(true)}>
                    <Sparkles className="w-4 h-4" /> {activeStrategy ? "Nova Estratégia" : "Criar Estratégia de Tráfego"}
                  </Button>
                </CardContent>
              </Card>

              {renderResult()}
            </>
          )}
        </TabsContent>

        {/* ═══ HISTÓRICO ═══ */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i}><CardContent className="p-5 h-20 animate-pulse bg-muted/20" /></Card>
              ))}
            </div>
          ) : history && history.length > 0 ? (
            history.map((h) => (
              <Card key={h.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Estratégia de {format(new Date(h.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(h.platforms as any[])?.map((p: any) => p.platform).join(", ")}
                      </p>
                    </div>
                    <Badge variant={h.status === "approved" ? "default" : "secondary"} className="text-[10px]">
                      {h.status === "approved" ? "Aprovada" : "Pendente"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <History className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma estratégia anterior</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      <InsufficientCreditsDialog
        open={showCreditsDialog}
        onOpenChange={setShowCreditsDialog}
        actionLabel="esta estratégia de tráfego"
        creditCost={200}
      />
    </div>
  );
}
