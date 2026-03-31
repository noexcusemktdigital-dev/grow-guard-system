// @ts-nocheck
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, ChevronDown, ChevronUp, DollarSign, ExternalLink,
  Eye, Lightbulb, Loader2, MousePointer, Sparkles, Target,
  TrendingUp, Zap, Rocket, ArrowLeft, ArrowRight, BookOpen, Save,
  PieChart, Users, BarChart3, Layers,
} from "lucide-react";
import { platformColors, platformIcons, platformLinks, PLATFORM_TUTORIALS, TutorialStep } from "./ClienteTrafegoPagoConstants";
import { useCreateClientCampaign } from "@/hooks/useClienteCampaignsDB";
import { toast } from "@/hooks/use-toast";

interface TrafficStrategy {
  id: string;
  status: string;
  source_data?: unknown;
  platforms?: unknown[];
}

interface ClienteTrafegoPagoResultProps {
  loadingStrategy: boolean;
  activeStrategy: TrafficStrategy | null | undefined;
  platforms: Record<string, unknown>[];
  sourceData: Record<string, unknown>;
  expandedPlatforms: Record<string, boolean>;
  togglePlatformExpand: (p: string) => void;
  handleApprove: (id: string) => void;
  setShowWizard: (v: boolean) => void;
  setStep: (v: number) => void;
  approveMutationIsPending: boolean;
}

/* ── Tutorial Dialog — exported for reuse ── */
export function TutorialDialog({
  open,
  onOpenChange,
  platformKey,
  platformData,
  strategyId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  platformKey: string;
  platformData: Record<string, unknown>;
  strategyId?: string;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const createCampaign = useCreateClientCampaign();
  const tutorial = PLATFORM_TUTORIALS[platformKey];
  if (!tutorial) return null;

  const steps = tutorial.steps;
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleSave = () => {
    createCampaign.mutate(
      {
        name: `${platformKey} Ads — ${String(platformData.objective || "Campanha")}`,
        type: platformKey,
        content: {
          platform: platformKey,
          objective: platformData.objective,
          audience: platformData.audience,
          budget: platformData.budget_suggestion,
          strategy_id: strategyId,
          tutorial_completed: true,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Campanha salva!", description: `Campanha ${platformKey} salva no repositório.` });
          onOpenChange(false);
          setCurrentStep(0);
        },
        onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className={`p-1.5 rounded-lg ${platformColors[platformKey]}`}>
              {platformIcons[platformKey]}
            </div>
            Tutorial: {tutorial.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-1 mb-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-right">
          Passo {currentStep + 1} de {steps.length}
        </p>

        <div className="space-y-4 mt-2">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
              {currentStep + 1}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">{step.title}</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">
                {step.description}
              </p>
            </div>
          </div>

          {step.tip && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/15">
              <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-primary uppercase">Dica da estratégia</p>
                <p className="text-xs text-muted-foreground mt-1">{step.tip}</p>
              </div>
            </div>
          )}

          {currentStep === 0 && platformData.audience && (
            <div className="p-3 rounded-xl bg-muted/30 border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Público sugerido pela IA</p>
              <p className="text-xs mt-1">{String(platformData.audience)}</p>
            </div>
          )}

          {(currentStep === 4 || currentStep === 3) && platformData.budget_suggestion && (
            <div className="p-3 rounded-xl bg-muted/30 border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Orçamento sugerido</p>
              <p className="text-xs mt-1 font-medium">{String(platformData.budget_suggestion)}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Anterior
          </Button>

          {isLast ? (
            <Button
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleSave}
              disabled={createCampaign.isPending}
            >
              {createCampaign.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Salvar Campanha
            </Button>
          ) : (
            <Button
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setCurrentStep((s) => s + 1)}
            >
              Próximo <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Helper: platform border color for top accent ── */
const platformBorderTop: Record<string, string> = {
  Google: "border-t-emerald-500",
  Meta: "border-t-blue-500",
  TikTok: "border-t-purple-500",
  LinkedIn: "border-t-sky-500",
};

/* ── Main Component ── */
export function ClienteTrafegoPagoResult({
  loadingStrategy,
  activeStrategy,
  platforms,
  sourceData,
  expandedPlatforms,
  togglePlatformExpand,
  handleApprove,
  setShowWizard,
  setStep,
  approveMutationIsPending,
}: ClienteTrafegoPagoResultProps) {
  const [tutorialPlatform, setTutorialPlatform] = useState<string | null>(null);
  const [tutorialPlatformData, setTutorialPlatformData] = useState<Record<string, unknown>>({});

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

  const investmentPlan = sourceData.investment_plan as Record<string, unknown> | undefined;
  const distribution = (investmentPlan?.distribution as Record<string, unknown>[]) || [];
  const projections = sourceData.projections as Record<string, unknown> | undefined;
  const totalBudget = distribution.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  return (
    <div className="space-y-5">
      {/* ═══ HERO HEADER ═══ */}
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">Estratégia de Tráfego Pago</h3>
                  <Badge
                    variant={activeStrategy.status === "approved" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {activeStrategy.status === "approved" ? "✅ Aprovada" : "⏳ Pendente"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {platforms.length} plataforma{platforms.length > 1 ? "s" : ""} •{" "}
                  {totalBudget > 0
                    ? `R$ ${totalBudget.toLocaleString("pt-BR")} investimento total`
                    : "Investimento configurado"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {activeStrategy.status !== "approved" && (
                <Button
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => handleApprove(activeStrategy.id)}
                  disabled={approveMutationIsPending}
                >
                  {approveMutationIsPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
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
        </div>
      </Card>

      {/* ═══ DIAGNÓSTICO ═══ */}
      {sourceData.diagnostico && (
        <Card className="border-primary/15">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Diagnóstico de Mídia</p>
                <p className="text-xs mt-1.5 text-muted-foreground leading-relaxed">{String(sourceData.diagnostico)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ PLANO DE INVESTIMENTO ═══ */}
      {distribution.length > 0 && (
        <Card>
          <CardContent className="py-5 space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold">Plano de Investimento</h4>
              {totalBudget > 0 && (
                <Badge variant="outline" className="ml-auto text-[10px]">
                  Total: R$ {totalBudget.toLocaleString("pt-BR")}
                </Badge>
              )}
            </div>

            {/* Visual distribution bars */}
            <div className="space-y-3">
              {distribution.map((d) => {
                const pct = Number(d.percentage) || 0;
                const platformKey = String(d.platform);
                return (
                  <div key={platformKey} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-md ${platformColors[platformKey] || "bg-muted"}`}>
                          {platformIcons[platformKey] ? (
                            <span className="[&>svg]:w-3.5 [&>svg]:h-3.5">{platformIcons[platformKey]}</span>
                          ) : null}
                        </div>
                        <span className="text-xs font-semibold">{platformKey}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          R$ {Number(d.amount)?.toLocaleString("pt-BR") || "—"}
                        </span>
                        <Badge variant="secondary" className="text-[10px] font-bold min-w-[40px] justify-center">
                          {pct}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ PROJEÇÕES ═══ */}
      {projections && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users, label: "Leads Estimados", value: projections.total_leads, color: "text-blue-500 bg-blue-500/10" },
            { icon: BarChart3, label: "Clientes Estimados", value: projections.total_clients, color: "text-emerald-500 bg-emerald-500/10" },
            { icon: DollarSign, label: "Faturamento", value: projections.estimated_revenue, color: "text-amber-500 bg-amber-500/10" },
            { icon: TrendingUp, label: "ROI Estimado", value: projections.estimated_roi, color: "text-purple-500 bg-purple-500/10" },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="py-4 text-center space-y-2">
                <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center mx-auto`}>
                  <item.icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-sm font-bold">{String(item.value || "—")}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ KPIs SUGERIDOS ═══ */}
      {(sourceData.kpi_tracking as string[])?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">KPIs sugeridos:</span>
          {(sourceData.kpi_tracking as string[]).map((kpi) => (
            <Badge key={kpi} variant="outline" className="text-[10px]">{kpi}</Badge>
          ))}
        </div>
      )}

      {/* ═══ PLATFORM CARDS ═══ */}
      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map((p) => {
          const platformKey = String(p.platform);
          const isOpen = expandedPlatforms[platformKey] ?? false;
          const hasTutorial = !!PLATFORM_TUTORIALS[platformKey];
          const kpis = (p.kpis || {}) as Record<string, unknown>;

          return (
            <Card
              key={platformKey}
              className={`border-t-4 ${platformBorderTop[platformKey] || ""} overflow-hidden`}
            >
              <CardContent className="py-5 space-y-4">
                {/* Platform header */}
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${platformColors[platformKey]}`}>
                    {platformIcons[platformKey]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{platformKey} Ads</p>
                    <Badge className={`text-[9px] mt-0.5 ${platformColors[platformKey]}`}>
                      {String(p.objective)}
                    </Badge>
                  </div>
                  {platformLinks[platformKey] && (
                    <a
                      href={platformLinks[platformKey]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Audience */}
                <div className="p-3 rounded-xl bg-muted/30 border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Público-alvo</p>
                  </div>
                  <p className="text-xs leading-relaxed">{String(p.audience)}</p>
                </div>

                {/* Budget + Creatives grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-muted/30 border">
                    <div className="flex items-center gap-1.5 mb-1">
                      <DollarSign className="w-3 h-3 text-muted-foreground" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Orçamento</p>
                    </div>
                    <p className="text-sm font-bold">{String(p.budget_suggestion)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Layers className="w-3 h-3 text-muted-foreground" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Criativos</p>
                    </div>
                    <p className="text-xs">{String(p.creative_formats)}</p>
                  </div>
                </div>

                {/* KPIs mini-dashboard 2x2 */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Eye, label: "Alcance", value: kpis.estimated_reach },
                    { icon: MousePointer, label: "Cliques", value: kpis.estimated_clicks },
                    { icon: TrendingUp, label: "CPC", value: kpis.estimated_cpc },
                    { icon: DollarSign, label: "CPL", value: kpis.estimated_cpl },
                  ].map((kpi) => (
                    <div key={kpi.label} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/20 border">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <kpi.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{String(kpi.value || "—")}</p>
                        <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Collapsible details */}
                <Collapsible open={isOpen} onOpenChange={() => togglePlatformExpand(platformKey)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full text-xs gap-1.5">
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isOpen ? "Menos detalhes" : "Mais detalhes"}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-2">
                    {(p.ad_copies as string[])?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Copies de Anúncio</p>
                        {(p.ad_copies as string[]).map((copy, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-muted/20 border mb-1.5">
                            <p className="text-xs italic">"{copy}"</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {(p.keywords as string[])?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Palavras-chave</p>
                        <div className="flex flex-wrap gap-1">
                          {(p.keywords as string[]).map((kw, i) => (
                            <Badge key={i} variant="outline" className="text-[9px]">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(p.interests as string[])?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Interesses</p>
                        <div className="flex flex-wrap gap-1">
                          {(p.interests as string[]).map((int, i) => (
                            <Badge key={i} variant="outline" className="text-[9px]">{int}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <CampaignStructureRenderer structure={p.campaign_structure} />

                    {(p.optimization_actions as string[])?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Otimização</p>
                        {(p.optimization_actions as string[]).map((act, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/10 border mb-1">
                            <Zap className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                            <p className="text-[11px]">{act}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {(p.tips as string[])?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Dicas</p>
                        {(p.tips as string[]).map((tip, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 mb-1">
                            <Sparkles className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                            <p className="text-[11px]">{tip}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* CTA: Criar Campanha */}
                {hasTutorial && (
                  <Button
                    className="w-full text-xs gap-1.5"
                    onClick={() => {
                      setTutorialPlatform(platformKey);
                      setTutorialPlatformData(p);
                    }}
                  >
                    <Rocket className="w-3.5 h-3.5" /> Criar Campanha
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tutorial Dialog */}
      {tutorialPlatform && (
        <TutorialDialog
          open={!!tutorialPlatform}
          onOpenChange={(v) => { if (!v) setTutorialPlatform(null); }}
          platformKey={tutorialPlatform}
          platformData={tutorialPlatformData}
          strategyId={activeStrategy?.id}
        />
      )}
    </div>
  );
}
