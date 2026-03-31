// @ts-nocheck
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle2, ChevronDown, ChevronUp, DollarSign, ExternalLink,
  Eye, Lightbulb, Loader2, MousePointer, PieChart, Sparkles, Target,
  TrendingUp, Zap, Rocket, ArrowLeft, ArrowRight, BookOpen, Save,
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

function TutorialDialog({
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

        {/* Progress */}
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

        {/* Step content */}
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

          {/* Contextual data from strategy */}
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

        {/* Navigation */}
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
              disabled={approveMutationIsPending}
            >
              {approveMutationIsPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
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
                <p className="text-xs mt-1 text-muted-foreground">{String(sourceData.diagnostico)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investment Plan */}
      {(sourceData.investment_plan as Record<string, unknown>)?.distribution && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><PieChart className="w-4 h-4" /> Plano de Investimento</CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {((sourceData.investment_plan as Record<string, unknown>).distribution as Record<string, unknown>[]).map((d) => (
                <div key={String(d.platform)} className={`p-3 rounded-xl border ${platformColors[String(d.platform)] || ""}`}>
                  <p className="text-xs font-bold">{String(d.platform)}</p>
                  <p className="text-lg font-bold mt-1">{String(d.percentage)}%</p>
                  <p className="text-[10px] text-muted-foreground">R$ {Number(d.amount)?.toLocaleString("pt-BR") || "—"}</p>
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
                { label: "Leads Estimados", value: (sourceData.projections as Record<string, unknown>).total_leads },
                { label: "Clientes Estimados", value: (sourceData.projections as Record<string, unknown>).total_clients },
                { label: "Faturamento", value: (sourceData.projections as Record<string, unknown>).estimated_revenue },
                { label: "ROI Estimado", value: (sourceData.projections as Record<string, unknown>).estimated_roi },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-muted/30 border text-center">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">{item.label}</p>
                  <p className="text-sm font-bold mt-1">{String(item.value || "—")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Tracking */}
      {(sourceData.kpi_tracking as string[])?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-muted-foreground">KPIs sugeridos:</span>
          {(sourceData.kpi_tracking as string[]).map((kpi) => (
            <Badge key={kpi} variant="outline" className="text-[10px]">{kpi}</Badge>
          ))}
        </div>
      )}

      {/* Platform Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map((p) => {
          const platformKey = String(p.platform);
          const isOpen = expandedPlatforms[platformKey] ?? false;
          const hasTutorial = !!PLATFORM_TUTORIALS[platformKey];
          return (
            <Card key={platformKey} className={`border-l-4 ${platformColors[platformKey]?.split(" ").find((s: string) => s.startsWith("border-")) || ""}`}>
              <CardContent className="py-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${platformColors[platformKey]}`}>
                    {platformIcons[platformKey]}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{platformKey} Ads</p>
                    <Badge className={`text-[9px] mt-0.5 ${platformColors[platformKey]}`}>{String(p.objective)}</Badge>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border">
                  <p className="text-[10px] font-medium text-muted-foreground">PÚBLICO-ALVO</p>
                  <p className="text-xs mt-1">{String(p.audience)}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-muted/30 border">
                    <p className="text-[10px] font-medium text-muted-foreground">ORÇAMENTO</p>
                    <p className="text-sm font-bold mt-1">{String(p.budget_suggestion)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border">
                    <p className="text-[10px] font-medium text-muted-foreground">CRIATIVOS</p>
                    <p className="text-xs mt-1">{String(p.creative_formats)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { icon: Eye, label: "Alcance", value: (p.kpis as Record<string, unknown>)?.estimated_reach },
                    { icon: MousePointer, label: "Cliques", value: (p.kpis as Record<string, unknown>)?.estimated_clicks },
                    { icon: TrendingUp, label: "CPC", value: (p.kpis as Record<string, unknown>)?.estimated_cpc },
                    { icon: DollarSign, label: "CPL", value: (p.kpis as Record<string, unknown>)?.estimated_cpl },
                  ].map((kpi) => (
                    <div key={kpi.label} className="text-center p-2 rounded-lg bg-muted/20">
                      <kpi.icon className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                      <p className="text-[10px] font-bold">{String(kpi.value || "—")}</p>
                      <p className="text-[8px] text-muted-foreground">{kpi.label}</p>
                    </div>
                  ))}
                </div>

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

                    {(p.campaign_structure as Record<string, unknown>)?.campaigns && ((p.campaign_structure as Record<string, unknown>).campaigns as Record<string, unknown>[]).length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Estrutura de Campanhas</p>
                        {((p.campaign_structure as Record<string, unknown>).campaigns as Record<string, unknown>[]).map((c, ci) => (
                          <div key={ci} className="p-2.5 rounded-lg bg-muted/10 border mb-1.5">
                            <p className="text-xs font-bold">{String(c.name)}</p>
                            {(c.ad_sets as Record<string, unknown>[])?.map((as_, ai) => (
                              <div key={ai} className="ml-3 mt-1.5 pl-2 border-l-2 border-muted">
                                <p className="text-[11px] font-medium">{String(as_.name)}</p>
                                <p className="text-[10px] text-muted-foreground">{String(as_.targeting)}</p>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

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