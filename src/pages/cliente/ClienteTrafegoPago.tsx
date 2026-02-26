import { useState } from "react";
import {
  DollarSign, Sparkles, Target, Users, Globe, BarChart3, Zap,
  Eye, MousePointer, TrendingUp, PlayCircle, ExternalLink,
  ChevronDown, ChevronUp, Clock, Loader2, History, CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { useActiveTrafficStrategy, useTrafficStrategyHistory, useGenerateTrafficStrategy } from "@/hooks/useTrafficStrategy";
import { useActiveStrategy } from "@/hooks/useMarketingStrategy";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const platformIcons: Record<string, React.ReactNode> = {
  Google: <Globe className="w-5 h-5" />,
  Meta: <Users className="w-5 h-5" />,
  TikTok: <PlayCircle className="w-5 h-5" />,
  LinkedIn: <BarChart3 className="w-5 h-5" />,
};

const platformColors: Record<string, string> = {
  Google: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Meta: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TikTok: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  LinkedIn: "bg-sky-500/10 text-sky-500 border-sky-500/20",
};

const platformLinks: Record<string, string> = {
  Google: "https://ads.google.com",
  Meta: "https://business.facebook.com/adsmanager",
  TikTok: "https://ads.tiktok.com",
  LinkedIn: "https://www.linkedin.com/campaignmanager",
};

const tutorials = [
  {
    platform: "Meta",
    steps: ["Acesse o Gerenciador de Anúncios do Meta", "Clique em 'Criar' para nova campanha", "Selecione o objetivo (Leads, Tráfego, Conversão)", "Defina o público-alvo com interesses e comportamentos", "Configure o orçamento diário ou vitalício", "Crie o anúncio (imagem/vídeo + copy)", "Revise e publique a campanha"],
    tips: ["Use Lookalike de clientes existentes", "Teste pelo menos 3 criativos diferentes", "Comece com orçamento baixo e escale"],
    checklist: ["Pixel Meta instalado no site", "Evento de conversão configurado", "Público-alvo definido", "Criativos aprovados", "Landing page testada"],
  },
  {
    platform: "Google",
    steps: ["Acesse o Google Ads (ads.google.com)", "Crie uma nova campanha Search", "Defina as palavras-chave alvo", "Escreva os anúncios responsivos", "Configure extensões (sitelinks, callouts)", "Defina o orçamento e lances", "Ative a campanha e monitore"],
    tips: ["Use correspondência de frase para palavras-chave", "Adicione palavras-chave negativas desde o início", "Configure acompanhamento de conversões"],
    checklist: ["Google Tag Manager instalado", "Conversão configurada no GA4", "Lista de palavras-chave negativas", "Anúncios responsivos criados", "Extensões configuradas"],
  },
  {
    platform: "TikTok",
    steps: ["Crie uma conta no TikTok Ads Manager", "Instale o pixel do TikTok no seu site", "Crie uma campanha com objetivo de Tráfego ou Conversão", "Defina a segmentação", "Faça upload do vídeo criativo (9:16, até 60s)", "Configure o orçamento e período", "Publique e acompanhe"],
    tips: ["Use vídeos nativos e autênticos", "Os primeiros 3 segundos são cruciais", "Teste diferentes hooks e CTAs"],
    checklist: ["Pixel TikTok instalado", "Vídeo no formato 9:16", "CTA claro no vídeo", "Landing page mobile-first"],
  },
  {
    platform: "LinkedIn",
    steps: ["Acesse o Campaign Manager do LinkedIn", "Crie uma campanha com objetivo de Awareness ou Leads", "Segmente por cargo, setor, tamanho da empresa", "Escolha o formato (Single Image, Carousel, Document)", "Escreva o copy profissional", "Defina orçamento e lances", "Publique e acompanhe"],
    tips: ["Conteúdo educativo performa melhor que comercial", "Use Document Ads para whitepapers", "Segmente decisores (C-level, Diretores)"],
    checklist: ["LinkedIn Insight Tag instalado", "Formulário de Lead Gen configurado", "Criativo profissional aprovado", "Segmentação por cargo definida"],
  },
];

export default function ClienteTrafegoPago() {
  const { data: activeStrategy, isLoading: loadingStrategy } = useActiveTrafficStrategy();
  const { data: history, isLoading: loadingHistory } = useTrafficStrategyHistory();
  const { data: marketingStrategy } = useActiveStrategy();
  const generateMutation = useGenerateTrafficStrategy();
  const [activeTab, setActiveTab] = useState("estrategia");
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const togglePlatform = (p: string) => setExpandedPlatforms((prev) => ({ ...prev, [p]: !prev[p] }));
  const toggleCheck = (key: string) => setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleGenerate = () => {
    if (!marketingStrategy) {
      toast({ title: "Estratégia de marketing necessária", description: "Gere primeiro sua estratégia de marketing para basear o tráfego pago.", variant: "destructive" });
      return;
    }
    generateMutation.mutate(undefined, {
      onSuccess: () => toast({ title: "Estratégia gerada!", description: "Sua estratégia de tráfego pago foi criada com sucesso." }),
      onError: (err: any) => {
        if (err.code === "INSUFFICIENT_CREDITS") {
          toast({ title: "Créditos insuficientes", description: "Você precisa de 200 créditos para gerar a estratégia.", variant: "destructive" });
        } else {
          toast({ title: "Erro ao gerar estratégia", description: err.message, variant: "destructive" });
        }
      },
    });
  };

  const platforms = (activeStrategy?.platforms || []) as any[];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Tráfego Pago"
        subtitle="Estratégia de campanhas gerada por IA + tutoriais por plataforma"
        icon={<DollarSign className="w-5 h-5 text-primary" />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="estrategia" className="text-xs gap-1.5"><Target className="w-3.5 h-3.5" /> Estratégia</TabsTrigger>
          <TabsTrigger value="tutoriais" className="text-xs gap-1.5"><PlayCircle className="w-3.5 h-3.5" /> Tutoriais</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs gap-1.5"><History className="w-3.5 h-3.5" /> Histórico</TabsTrigger>
        </TabsList>

        {/* ═══ ESTRATÉGIA ═══ */}
        <TabsContent value="estrategia" className="space-y-5 mt-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-5">
              <div className="flex items-start gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Estratégia de Tráfego com IA</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gera estratégia completa por plataforma baseada nas suas metas, estratégia de marketing, conteúdos e site.
                    <Badge variant="outline" className="ml-2 text-[9px]">200 créditos</Badge>
                  </p>
                </div>
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Gerando estratégia...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> {activeStrategy ? "Regerar Estratégia" : "Gerar Estratégia de Tráfego"}</>
                )}
              </Button>
              {!marketingStrategy && (
                <p className="text-xs text-destructive mt-2 text-center">⚠️ Gere sua Estratégia de Marketing primeiro para resultados melhores.</p>
              )}
            </CardContent>
          </Card>

          {loadingStrategy ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}><CardContent className="p-5 h-32 animate-pulse bg-muted/20" /></Card>
              ))}
            </div>
          ) : platforms.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {platforms.map((p: any) => {
                const isOpen = expandedPlatforms[p.platform] ?? false;
                return (
                  <Card key={p.platform} className={`border-l-4 ${platformColors[p.platform]?.split(" ").find((s: string) => s.startsWith("border-")) || ""}`}>
                    <CardContent className="py-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${platformColors[p.platform]}`}>
                            {platformIcons[p.platform]}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{p.platform} Ads</p>
                            <Badge className={`text-[9px] mt-0.5 ${platformColors[p.platform]}`}>{p.objective}</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-muted/30 border">
                        <p className="text-[10px] font-medium text-muted-foreground">PÚBLICO-ALVO</p>
                        <p className="text-xs mt-1">{p.audience}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-xl bg-muted/30 border">
                          <p className="text-[10px] font-medium text-muted-foreground">ORÇAMENTO SUGERIDO</p>
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

                      <Collapsible open={isOpen} onOpenChange={() => togglePlatform(p.platform)}>
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

                          {/* Keywords (Google) */}
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
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Interesses / Comportamentos</p>
                              <div className="flex flex-wrap gap-1">
                                {p.interests.map((int: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-[9px]">{int}</Badge>
                                ))}
                              </div>
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

                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1 text-xs gap-1.5"
                          onClick={() => {
                            setActiveTab("tutoriais");
                          }}
                        >
                          <Zap className="w-3.5 h-3.5" /> Criar Campanha
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5"
                          onClick={() => window.open(platformLinks[p.platform], "_blank")}
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Abrir {p.platform}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium">Nenhuma estratégia gerada</p>
                <p className="text-xs text-muted-foreground mt-1">Clique em "Gerar Estratégia de Tráfego" para criar sua primeira estratégia com IA.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ TUTORIAIS ═══ */}
        <TabsContent value="tutoriais" className="space-y-5 mt-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4 flex items-start gap-3">
              <PlayCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Guias Passo a Passo</p>
                <p className="text-xs text-muted-foreground mt-1">Aprenda a criar campanhas em cada plataforma com tutoriais práticos e checklists.</p>
              </div>
            </CardContent>
          </Card>

          {tutorials.map((t) => (
            <Card key={t.platform}>
              <CardContent className="py-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${platformColors[t.platform]}`}>
                      {platformIcons[t.platform]}
                    </div>
                    <div>
                      <p className="text-sm font-bold">Como Criar Campanhas no {t.platform}</p>
                      <p className="text-[10px] text-muted-foreground">{t.steps.length} passos · {t.checklist.length} itens no checklist</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => window.open(platformLinks[t.platform], "_blank")}>
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir {t.platform}
                  </Button>
                </div>

                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">PASSO A PASSO</p>
                <div className="space-y-2 mb-5">
                  {t.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                      <p className="text-sm">{step}</p>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">DICAS</p>
                <div className="space-y-2 mb-5">
                  {t.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs">{tip}</p>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">CHECKLIST</p>
                <div className="space-y-2">
                  {t.checklist.map((item, i) => {
                    const key = `${t.platform}-${i}`;
                    return (
                      <div key={key} className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-muted/10">
                        <Checkbox
                          checked={checkedItems[key] ?? false}
                          onCheckedChange={() => toggleCheck(key)}
                        />
                        <span className={`text-xs ${checkedItems[key] ? "line-through text-muted-foreground" : ""}`}>{item}</span>
                        {checkedItems[key] && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ═══ HISTÓRICO ═══ */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          {loadingHistory ? (
            <Card><CardContent className="p-5 h-20 animate-pulse bg-muted/20" /></Card>
          ) : history && history.length > 0 ? (
            history.map((h) => (
              <Card key={h.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        Estratégia de {format(new Date(h.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[9px]">
                      {(h.platforms as any[])?.length || 0} plataformas
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(h.platforms as any[])?.map((p: any) => (
                      <Badge key={p.platform} className={`text-[9px] ${platformColors[p.platform]}`}>
                        {p.platform} — {p.objective}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Baseado em: {(h.source_data as any)?.org_name || "—"} · {(h.source_data as any)?.contents_count || 0} conteúdos · {(h.source_data as any)?.sites_count || 0} sites
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <History className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-medium">Nenhum histórico</p>
                <p className="text-xs text-muted-foreground mt-1">Estratégias anteriores aparecerão aqui.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
