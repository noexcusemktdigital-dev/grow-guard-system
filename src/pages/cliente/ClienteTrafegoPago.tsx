// @ts-nocheck
import { useState } from "react";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import { AdConnectionCards } from "@/components/trafego/AdConnectionCards";
import { AdMetricsDashboard } from "@/components/trafego/AdMetricsDashboard";
import { AdAIAnalysis } from "@/components/trafego/AdAIAnalysis";
import {
  DollarSign, Sparkles, Target, BarChart3,
  Loader2, History,
  ArrowLeft, ArrowRight, ChevronRight,
} from "lucide-react";
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
import {
  STEPS,
} from "./ClienteTrafegoPagoConstants";
import { ClienteTrafegoPagoWizardStep } from "./ClienteTrafegoPagoWizardStep";
import { ClienteTrafegoPagoResult } from "./ClienteTrafegoPagoResult";

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
  const [metricsPeriod, setMetricsPeriod] = useState(30);
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

  // Auto-detect assets (status values: "approved", "Aprovado", "pending")
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
      onError: (err: unknown) => {
        if (isInsufficientCreditsError(err)) {
          setShowCreditsDialog(true);
        } else {
          toast({ title: "Erro ao aprovar", description: err?.message || "Erro desconhecido", variant: "destructive" });
        }
      },
    });
  };

  const sourceData = (activeStrategy?.source_data || {}) as Record<string, unknown>;
  const platforms = (activeStrategy?.platforms || []) as Record<string, unknown>[];


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
          <TabsTrigger value="metricas" className="text-xs gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Métricas</TabsTrigger>
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
                    <ClienteTrafegoPagoWizardStep
                      step={step}
                      wizardData={wizardData}
                      setWizardData={setWizardData}
                      toggleArrayItem={toggleArrayItem}
                      marketingStrategyPublicoAlvo={marketingStrategy?.answers?.publico_alvo}
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

        {/* ═══ MÉTRICAS ═══ */}
        <TabsContent value="metricas" className="space-y-6 mt-4">
          {/* Connection Cards */}
          <div>
            <p className="text-sm font-semibold mb-3">Contas de Anúncio</p>
            <AdConnectionCards />
          </div>

          {/* Period selector */}
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <Button
                key={d}
                variant={metricsPeriod === d ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setMetricsPeriod(d)}
              >
                {d}d
              </Button>
            ))}
          </div>

          {/* Metrics Dashboard */}
          <AdMetricsDashboard period={metricsPeriod} />

          {/* AI Analysis */}
          <AdAIAnalysis />
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
                        {((h.platforms as Record<string, unknown>[]) || []).map((p: Record<string, unknown>) => p.platform).join(", ")}
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
