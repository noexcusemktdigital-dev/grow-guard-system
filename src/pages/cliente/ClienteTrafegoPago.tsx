// @ts-nocheck
import { useState, useEffect } from "react";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import { AssessoriaPopup } from "@/components/shared/AssessoriaPopup";
import {
  DollarSign, Sparkles, Target,
  Loader2, History, Folder, RefreshCw,
  ArrowLeft, ArrowRight, ChevronRight, BarChart2,
} from "lucide-react";
import { AdConnectionCards } from "@/components/trafego/AdConnectionCards";
import { useAdConnections, useAdMetrics, useAdMetricsSummary, useSyncMetrics } from "@/hooks/useAdPlatforms";
import { Facebook, Search, CheckCircle2, AlertCircle, Link2 } from "lucide-react";
import { AdMetricsDashboard } from "@/components/trafego/AdMetricsDashboard";
import { AdAIAnalysis } from "@/components/trafego/AdAIAnalysis";
import { TrafficKPICards } from "@/components/trafego/TrafficKPICards";
import { TrafficSmartAlerts } from "@/components/trafego/TrafficSmartAlerts";
import { TrafficOverview } from "@/components/trafego/TrafficOverview";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  useActiveTrafficStrategy, useTrafficStrategyHistory,
  useGenerateTrafficStrategy, useApproveTrafficStrategy,
  TrafficWizardData,
  type TrafficPlatformStrategy,
} from "@/hooks/useTrafficStrategy";
import { useActiveStrategy } from "@/hooks/useMarketingStrategy";
import { useClienteContent } from "@/hooks/useClienteContent";
import { usePostHistory } from "@/hooks/useClientePosts";
import { useClienteSitesDB } from "@/hooks/useClienteSitesDB";
import { useClienteWallet } from "@/hooks/useClienteWallet";
import { useClienteCampaignsDB, useCreateClientCampaign } from "@/hooks/useClienteCampaignsDB";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StrategyBanner } from "@/components/cliente/StrategyBanner";
import { InsufficientCreditsDialog, isInsufficientCreditsError } from "@/components/cliente/InsufficientCreditsDialog";
import {
  STEPS,
  platformColors, platformIcons, PLATFORM_TUTORIALS,
  campaignStatusLabels, campaignStatusColors,
} from "./ClienteTrafegoPagoConstants";
import { ClienteTrafegoPagoWizardStep } from "./ClienteTrafegoPagoWizardStep";
import { ClienteTrafegoPagoResult, TutorialDialog } from "./ClienteTrafegoPagoResult";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Rocket, ChevronDown, ChevronUp, Users, Eye, MousePointer, TrendingUp, Zap, Layers } from "lucide-react";
import { normalizePlatformType, CampaignStructureRenderer } from "./CampaignStructureRenderer";

export default function ClienteTrafegoPago() {
  const { data: activeStrategy, isLoading: loadingStrategy } = useActiveTrafficStrategy();
  const { data: history, isLoading: loadingHistory } = useTrafficStrategyHistory();
  const { data: marketingStrategy } = useActiveStrategy();
  const { data: contentData } = useClienteContent();
  const { data: postsData } = usePostHistory();
  const { data: sitesData } = useClienteSitesDB();
  const { data: wallet } = useClienteWallet();
  const { data: campaigns, isLoading: loadingCampaigns } = useClienteCampaignsDB();
  const generateMutation = useGenerateTrafficStrategy();
  const approveMutation = useApproveTrafficStrategy();
  const createCampaignMutation = useCreateClientCampaign();

  const { data: adConnections } = useAdConnections();
  const metaConnection = adConnections?.find((c) => c.platform === "meta_ads" && c.status === "active");
  const googleConnection = adConnections?.find((c) => c.platform === "google_ads" && c.status === "active");
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  const { data: adMetrics } = useAdMetrics(selectedPeriod);
  const adSummary = useAdMetricsSummary(adMetrics);
  const hasMetrics = (adMetrics?.length ?? 0) > 0;
  const syncMutationPage = useSyncMetrics();

  const handleSyncAllForPeriod = () => {
    if (metaConnection) syncMutationPage.mutate({ connectionId: metaConnection.id, periodDays: selectedPeriod });
    if (googleConnection) syncMutationPage.mutate({ connectionId: googleConnection.id, periodDays: selectedPeriod });
  };

  const [activeTab, setActiveTab] = useState("anuncios");
  const [step, setStep] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>({});
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [tutorialCampaign, setTutorialCampaign] = useState<{ platform: string; data: Record<string, unknown> } | null>(null);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  const [pendingRedirect, setPendingRedirect] = useState(false);

  // Robust redirect: wait for campaigns query to refetch, then switch tab
  useEffect(() => {
    if (pendingRedirect && campaigns && campaigns.length > 0) {
      setActiveTab("campanhas");
      setPendingRedirect(false);
    }
  }, [pendingRedirect, campaigns]);

  // Auto-switch to "anuncios" tab when returning from OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ads_connected") || params.get("ads_pick_account") || params.get("ads_error")) {
      setActiveTab("anuncios");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const detectedAssets: string[] = [];
  if (sitesData?.some((s) => s.status === "Aprovado" || s.status === "approved" || s.url)) detectedAssets.push("site");
  if (sitesData?.some((s) => s.type === "landing_page")) detectedAssets.push("landing_page");
  if (postsData?.some((p) => p.type === "art" && (p.status === "approved" || p.status === "pending"))) detectedAssets.push("artes");
  if (postsData?.some((p) => p.type === "video" && (p.status === "approved" || p.status === "pending"))) detectedAssets.push("videos");

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
      onError: (err: unknown) => {
        const errObj = err as { code?: string; message?: string };
        if (errObj.code === "RATE_LIMIT") {
          toast({ title: "Limite de requisições", description: "Aguarde alguns minutos e tente novamente.", variant: "destructive" });
        } else {
          toast({ title: "Erro ao gerar estratégia", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
        }
      },
    });
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id, {
      onSuccess: async () => {
        toast({ title: "Estratégia aprovada!", description: "25 créditos foram debitados. Criando campanhas..." });
        
        // Create one campaign per platform
        try {
          for (const p of platforms) {
            const platformKey = normalizePlatformType(String(p.platform));
            await createCampaignMutation.mutateAsync({
              name: `${platformKey} Ads — ${String(p.objective || "Campanha")}`,
              type: platformKey,
              content: {
                platform: platformKey,
                objective: p.objective,
                audience: p.audience,
                budget: p.budget_suggestion,
                creative_formats: p.creative_formats,
                kpis: p.kpis,
                ad_copies: p.ad_copies,
                keywords: p.keywords,
                interests: p.interests,
                campaign_structure: p.campaign_structure,
                optimization_actions: p.optimization_actions,
                tips: p.tips,
                strategy_id: id,
                auto_created: true,
              },
            });
          }
          toast({ title: "Campanhas criadas!", description: `${platforms.length} campanha(s) adicionada(s) ao repositório.` });
        } catch {
          // Campaigns creation is non-blocking
        }
        
        // Redirect to campaigns tab (immediate + pending for refetch)
        setActiveTab("campanhas");
        setPendingRedirect(true);
      },
      onError: (err: unknown) => {
        if (isInsufficientCreditsError(err)) {
          setShowCreditsDialog(true);
        } else {
          toast({ title: "Erro ao aprovar", description: err instanceof Error ? err.message : "Erro desconhecido", variant: "destructive" });
        }
      },
    });
  };

  const sourceData = (activeStrategy?.source_data || {}) as Record<string, unknown>;
  const platforms = (activeStrategy?.platforms || []) as TrafficPlatformStrategy[];

  // Filter campaigns by platform type (with normalization)
  const filteredCampaigns = (campaigns || []).filter((c) => {
    const normalized = normalizePlatformType(c.type || "");
    if (campaignFilter === "all") return ["Google", "Meta", "TikTok", "LinkedIn"].includes(normalized);
    return normalized === campaignFilter;
  });

  return (
    <div className="w-full space-y-6">
      <AssessoriaPopup storageKey="noexcuse_popup_trafego_v1" servico="Tráfego Pago" />
      <PageHeader
        title="Tráfego Pago"
        subtitle="Estratégia de campanhas gerada por IA com wizard guiado"
        icon={<DollarSign className="w-5 h-5 text-primary" />}
        actions={<FeatureTutorialButton slug="trafego" />}
      />

      <StrategyBanner toolName="o tráfego pago" dataUsed="Canais prioritários, funil e público-alvo" />

      {/* Plataformas conectadas (sempre visível no topo) */}
      <Card>
        <CardContent className="py-5 space-y-4">
          <div>
            <p className="text-sm font-semibold">Plataformas conectadas</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Conecte suas contas para visualizar métricas em tempo real
            </p>
          </div>
          <AdConnectionCards />
        </CardContent>
      </Card>

      {/* Seletor de período de análise */}
      {(metaConnection || googleConnection) && (
        <Card>
          <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold">Período de análise</p>
              <p className="text-[10px] text-muted-foreground">
                Selecione e clique em "Sincronizar período" para puxar os dados do intervalo escolhido
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[7, 30, 90, 180, 365].map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={selectedPeriod === p ? "default" : "outline"}
                  className="text-[10px] h-7 px-2"
                  onClick={() => setSelectedPeriod(p)}
                >
                  {p === 7 ? "7d" : p === 30 ? "30d" : p === 90 ? "90d" : p === 180 ? "6m" : "1 ano"}
                </Button>
              ))}
              <Button
                size="sm"
                className="text-[10px] h-7 px-2 gap-1.5"
                onClick={handleSyncAllForPeriod}
                disabled={syncMutationPage.isPending}
              >
                {syncMutationPage.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Sincronizar período
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs principais (Meta Ads conectado + dados disponíveis) */}
      {metaConnection && hasMetrics && <TrafficKPICards period={selectedPeriod} />}

      {/* Conta conectada mas sem métricas */}
      {metaConnection && !hasMetrics && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center space-y-2">
            <BarChart2 className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-semibold">Nenhuma campanha encontrada</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Clique em <span className="font-medium">"Sincronizar"</span> na aba Visão Geral para buscar dados da sua conta Meta Ads.
            </p>
          </CardContent>
        </Card>
      )}

      {!metaConnection && !googleConnection && (
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardContent className="p-6 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-primary/10">
              <Link2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-base font-bold">Conecte sua conta de anúncios</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                Conecte Meta Ads ou Google Ads acima para entender se seu investimento está gerando resultado:
                CPL, leads, CTR, performance por campanha — tudo em tempo real.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas inteligentes (Meta Ads conectado) */}
      {metaConnection && <TrafficSmartAlerts metaConnection={metaConnection} />}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="anuncios" className="text-xs gap-1.5"><BarChart2 className="w-3.5 h-3.5" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="campanhas" className="text-xs gap-1.5"><Folder className="w-3.5 h-3.5" /> Campanhas</TabsTrigger>
          <TabsTrigger value="estrategia" className="text-xs gap-1.5"><Target className="w-3.5 h-3.5" /> Estratégia</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs gap-1.5"><History className="w-3.5 h-3.5" /> Histórico</TabsTrigger>
        </TabsList>

        {/* ═══ ESTRATÉGIA ═══ */}
        <TabsContent value="estrategia" className="space-y-5 mt-4">
          {showWizard ? (
            <Card>
              <CardContent className="py-6">
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

                {generateMutation.isPending ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                    <p className="text-sm font-medium">Gerando sua estratégia de tráfego...</p>
                    <p className="text-xs text-muted-foreground">Isso pode levar até 30 segundos</p>
                  </div>
                ) : (
                  <>
                    <ClienteTrafegoPagoWizardStep
                      step={step}
                      wizardData={wizardData}
                      setWizardData={setWizardData}
                      toggleArrayItem={toggleArrayItem}
                      marketingStrategyPublicoAlvo={marketingStrategy?.answers?.publico_alvo as string}
                      sitesData={sitesData}
                      detectedAssets={detectedAssets}
                    />

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
              <Card className={activeStrategy ? "border-primary/20 bg-primary/5" : "border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5"}>
                <CardContent className="py-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-primary/15">
                      <Sparkles className="w-5 h-5 text-primary shrink-0" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">
                        {activeStrategy ? "Estratégia de Tráfego com IA" : "Crie sua estratégia de tráfego com IA"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activeStrategy
                          ? "Gere uma nova versão a qualquer momento."
                          : "Wizard guiado de 8 etapas que gera estratégia completa por plataforma (Meta, Google, TikTok, LinkedIn)."}
                        <Badge variant="outline" className="ml-2 text-[9px]">25 créditos na aprovação</Badge>
                      </p>
                    </div>
                  </div>
                  <Button className="w-full gap-2" onClick={() => setShowWizard(true)}>
                    <Sparkles className="w-4 h-4" /> {activeStrategy ? "Nova Estratégia" : "Criar Estratégia de Tráfego"}
                  </Button>
                </CardContent>
              </Card>

              <ClienteTrafegoPagoResult
                loadingStrategy={loadingStrategy}
                activeStrategy={activeStrategy}
                platforms={platforms}
                sourceData={sourceData}
                expandedPlatforms={expandedPlatforms}
                togglePlatformExpand={togglePlatformExpand}
                handleApprove={handleApprove}
                setShowWizard={setShowWizard}
                setStep={setStep}
                approveMutationIsPending={approveMutation.isPending}
              />
            </>
          )}
        </TabsContent>

        {/* ═══ CAMPANHAS (REPOSITÓRIO) ═══ */}
        <TabsContent value="campanhas" className="space-y-4 mt-4">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "Todas" },
              { value: "Google", label: "Google" },
              { value: "Meta", label: "Meta" },
              { value: "TikTok", label: "TikTok" },
              { value: "LinkedIn", label: "LinkedIn" },
            ].map((f) => (
              <Button
                key={f.value}
                variant={campaignFilter === f.value ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setCampaignFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {loadingCampaigns ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i}><CardContent className="p-5 h-20 animate-pulse bg-muted/20" /></Card>
              ))}
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredCampaigns.map((c) => {
                const content = (c.content || {}) as Record<string, unknown>;
                const kpis = (content.kpis || {}) as Record<string, unknown>;
                const normalizedType = normalizePlatformType(c.type || "");
                const hasTutorial = !!PLATFORM_TUTORIALS[normalizedType];
                const isExpanded = expandedCampaigns[c.id] ?? false;
                const platformBorderTop: Record<string, string> = {
                  Google: "border-t-emerald-500",
                  Meta: "border-t-blue-500",
                  TikTok: "border-t-purple-500",
                  LinkedIn: "border-t-sky-500",
                };
                return (
                  <Card key={c.id} className={`border-t-4 ${platformBorderTop[normalizedType] || ""}`}>
                    <CardContent className="py-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-xl ${platformColors[normalizedType] || "bg-muted"}`}>
                            {platformIcons[normalizedType] || <Folder className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(c.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Badge className={`text-[9px] ${campaignStatusColors[c.status] || ""}`}>
                          {campaignStatusLabels[c.status] || c.status}
                        </Badge>
                      </div>

                      {/* Objective */}
                      {content.objective && (
                        <div className="p-2.5 rounded-xl bg-muted/30 border">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Objetivo</p>
                          <p className="text-xs mt-0.5">{String(content.objective)}</p>
                        </div>
                      )}

                      {/* Audience */}
                      {content.audience && (
                        <div className="p-2.5 rounded-xl bg-muted/30 border">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Público-alvo</p>
                          </div>
                          <p className="text-xs leading-relaxed line-clamp-3">{String(content.audience)}</p>
                        </div>
                      )}

                      {/* Budget + KPIs grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {content.budget && (
                          <div className="p-2.5 rounded-lg bg-muted/20 border text-center">
                            <p className="text-[9px] text-muted-foreground uppercase">Orçamento</p>
                            <p className="text-xs font-bold">{String(content.budget)}</p>
                          </div>
                        )}
                        {kpis.estimated_cpl && (
                          <div className="p-2.5 rounded-lg bg-muted/20 border text-center">
                            <p className="text-[9px] text-muted-foreground uppercase">CPL Estimado</p>
                            <p className="text-xs font-bold">{String(kpis.estimated_cpl)}</p>
                          </div>
                        )}
                        {kpis.estimated_cpc && (
                          <div className="p-2.5 rounded-lg bg-muted/20 border text-center">
                            <p className="text-[9px] text-muted-foreground uppercase">CPC Estimado</p>
                            <p className="text-xs font-bold">{String(kpis.estimated_cpc)}</p>
                          </div>
                        )}
                        {kpis.estimated_reach && (
                          <div className="p-2.5 rounded-lg bg-muted/20 border text-center">
                            <p className="text-[9px] text-muted-foreground uppercase">Alcance</p>
                            <p className="text-xs font-bold">{String(kpis.estimated_reach)}</p>
                          </div>
                        )}
                      </div>

                      {/* Creative formats */}
                      {content.creative_formats && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Criativos</p>
                          <p className="text-xs text-muted-foreground">{String(content.creative_formats)}</p>
                        </div>
                      )}

                      {/* Campaign Structure */}
                      <CampaignStructureRenderer structure={content.campaign_structure} />

                      {/* Collapsible extras */}
                      <Collapsible open={isExpanded} onOpenChange={() => setExpandedCampaigns(prev => ({ ...prev, [c.id]: !prev[c.id] }))}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full text-xs gap-1.5">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {isExpanded ? "Menos detalhes" : "Mais detalhes"}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3 pt-2">
                          {Array.isArray(content.keywords) && (content.keywords as string[]).length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Palavras-chave</p>
                              <div className="flex flex-wrap gap-1">
                                {(content.keywords as string[]).map((kw, i) => (
                                  <Badge key={i} variant="outline" className="text-[9px]">{String(kw)}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {Array.isArray(content.interests) && (content.interests as string[]).length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Interesses</p>
                              <div className="flex flex-wrap gap-1">
                                {(content.interests as string[]).map((int, i) => (
                                  <Badge key={i} variant="outline" className="text-[9px]">{String(int)}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {Array.isArray(content.optimization_actions) && (content.optimization_actions as string[]).length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Otimização</p>
                              {(content.optimization_actions as string[]).map((act, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/10 border mb-1">
                                  <Zap className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                                  <p className="text-[11px]">{String(act)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {Array.isArray(content.ad_copies) && (content.ad_copies as string[]).length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Copies de Anúncio</p>
                              {(content.ad_copies as string[]).map((copy, i) => (
                                <div key={i} className="p-2.5 rounded-lg bg-muted/20 border mb-1.5">
                                  <p className="text-xs italic">"{String(copy)}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Tutorial CTA */}
                      {hasTutorial && (
                        <Button
                          className="w-full text-xs gap-1.5"
                          onClick={() => setTutorialCampaign({ platform: normalizedType, data: content })}
                        >
                          <Rocket className="w-3.5 h-3.5" /> Criar Campanha
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Folder className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma campanha salva</p>
                <p className="text-xs text-muted-foreground mt-1">Gere e aprove uma estratégia para criar campanhas automaticamente.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ VISÃO GERAL — gráfico + tabela campanhas ═══ */}
        <TabsContent value="anuncios" className="space-y-6 mt-4">
          <TrafficOverview metaConnection={metaConnection} period={selectedPeriod} />
          {metaConnection && hasMetrics && <AdAIAnalysis />}
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
                        {((h.platforms as unknown as Record<string, unknown>[]) || []).map((p: Record<string, unknown>) => p.platform).join(", ")}
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
      {/* Tutorial Dialog for Campaigns tab */}
      {tutorialCampaign && (
        <TutorialDialog
          open={!!tutorialCampaign}
          onOpenChange={(v) => { if (!v) setTutorialCampaign(null); }}
          platformKey={tutorialCampaign.platform}
          platformData={tutorialCampaign.data}
        />
      )}
    </div>
  );
}