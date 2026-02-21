import { useState, useMemo } from "react";
import { DollarSign, Plus, Sparkles, Target, BarChart3, CheckCircle2, Circle, ArrowRight, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { getTrafegoPagoData } from "@/data/clienteData";
import { toast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const chartData = [
  { period: "Sem 1", investimento: 1800, leads: 95, cpc: 2.8, ctr: 3.2 },
  { period: "Sem 2", investimento: 2100, leads: 110, cpc: 2.3, ctr: 3.8 },
  { period: "Sem 3", investimento: 1600, leads: 85, cpc: 2.6, ctr: 3.5 },
  { period: "Sem 4", investimento: 1700, leads: 90, cpc: 2.1, ctr: 4.1 },
];

interface PaidCampaign {
  id: string;
  name: string;
  platform: "Meta" | "Google";
  objective: string;
  status: "Ativa" | "Pausada" | "Finalizada";
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpc: number;
  ctr: number;
  cpa: number;
  roi: number;
}

const mockCampaigns: PaidCampaign[] = [
  { id: "1", name: "Search — Produto X", platform: "Google", objective: "Conversão", status: "Ativa", budget: 2500, spent: 1800, impressions: 45000, clicks: 1200, leads: 120, cpc: 1.50, ctr: 2.67, cpa: 15.00, roi: 320 },
  { id: "2", name: "Remarketing Site", platform: "Meta", objective: "Conversão", status: "Ativa", budget: 1800, spent: 1100, impressions: 32000, clicks: 960, leads: 95, cpc: 1.15, ctr: 3.00, cpa: 11.58, roi: 450 },
  { id: "3", name: "Lookalike Clientes", platform: "Meta", objective: "Leads", status: "Ativa", budget: 1400, spent: 900, impressions: 28000, clicks: 840, leads: 80, cpc: 1.07, ctr: 3.00, cpa: 11.25, roi: 380 },
  { id: "4", name: "Display Branding", platform: "Google", objective: "Reconhecimento", status: "Pausada", budget: 1500, spent: 1200, impressions: 85000, clicks: 680, leads: 25, cpc: 1.76, ctr: 0.80, cpa: 48.00, roi: 80 },
];

const platformColors: Record<string, string> = {
  Meta: "bg-blue-500/10 text-blue-500",
  Google: "bg-emerald-500/10 text-emerald-500",
};

const statusColors: Record<string, string> = {
  Ativa: "bg-emerald-500/10 text-emerald-500",
  Pausada: "bg-yellow-500/10 text-yellow-500",
  Finalizada: "bg-muted text-muted-foreground",
};

const WIZARD_STEPS = [
  { title: "Plataforma & Objetivo", description: "Escolha onde anunciar e o que deseja alcançar" },
  { title: "Público & Segmentação", description: "Defina quem verá seus anúncios" },
  { title: "Orçamento & Duração", description: "Configure investimento e período" },
  { title: "Criativo & Copy", description: "Adicione texto e criativos do anúncio" },
  { title: "Revisão & Publicação", description: "Confira tudo antes de publicar" },
];

export default function ClienteTrafegoPago() {
  const data = useMemo(() => getTrafegoPagoData(), []);
  const [period, setPeriod] = useState("30d");
  const [createOpen, setCreateOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [aiSuggestion, setAiSuggestion] = useState(false);

  // Wizard form state
  const [wizardData, setWizardData] = useState({
    platform: "Meta",
    objective: "leads",
    name: "",
    audience: "",
    dailyBudget: "",
    duration: "",
    copy: "",
  });

  const totalSpent = mockCampaigns.reduce((s, c) => s + c.spent, 0);
  const totalLeads = mockCampaigns.reduce((s, c) => s + c.leads, 0);
  const avgCPC = (mockCampaigns.reduce((s, c) => s + c.cpc, 0) / mockCampaigns.length).toFixed(2);
  const avgROI = Math.round(mockCampaigns.filter(c => c.status === "Ativa").reduce((s, c) => s + c.roi, 0) / mockCampaigns.filter(c => c.status === "Ativa").length);

  const openWizard = () => {
    setWizardStep(0);
    setAiSuggestion(false);
    setWizardData({ platform: "Meta", objective: "leads", name: "", audience: "", dailyBudget: "", duration: "", copy: "" });
    setCreateOpen(true);
  };

  const generateStructure = () => {
    setAiSuggestion(true);
    toast({ title: "Estrutura gerada!", description: "IA sugeriu estrutura de campanha com segmentação e copy." });
  };

  const renderWizardContent = () => {
    switch (wizardStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <div className="grid grid-cols-2 gap-3">
                {["Meta", "Google"].map(p => (
                  <div
                    key={p}
                    className={`p-4 border rounded-xl cursor-pointer transition-all text-center ${
                      wizardData.platform === p ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-muted/30"
                    }`}
                    onClick={() => setWizardData(d => ({ ...d, platform: p }))}
                  >
                    <Badge className={`text-xs ${platformColors[p]}`}>{p} Ads</Badge>
                    <p className="text-[10px] text-muted-foreground mt-2">{p === "Meta" ? "Facebook & Instagram" : "Search & Display"}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Select value={wizardData.objective} onValueChange={v => setWizardData(d => ({ ...d, objective: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads">Geração de Leads</SelectItem>
                  <SelectItem value="conversao">Conversão</SelectItem>
                  <SelectItem value="trafego">Tráfego</SelectItem>
                  <SelectItem value="reconhecimento">Reconhecimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome da Campanha</Label>
              <Input value={wizardData.name} onChange={e => setWizardData(d => ({ ...d, name: e.target.value }))} placeholder="Ex: Search Produto X" />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Público-alvo</Label>
              <Textarea value={wizardData.audience} onChange={e => setWizardData(d => ({ ...d, audience: e.target.value }))} placeholder="Descreva o público-alvo..." rows={3} />
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={generateStructure}>
              <Sparkles className="w-4 h-4" /> Sugerir Segmentação com IA
            </Button>
            {aiSuggestion && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="font-semibold">Segmentação Sugerida</span>
                  </div>
                  <div><span className="font-medium">Grupo 1:</span> Lookalike 1% — Clientes ativos</div>
                  <div><span className="font-medium">Grupo 2:</span> Interesse — Marketing Digital + CRM</div>
                  <div><span className="font-medium">Grupo 3:</span> Remarketing — Visitantes site 30 dias</div>
                  <div><span className="font-medium">Faixa etária:</span> 25-55 anos, Empresários</div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Orçamento Diário (R$)</Label>
                <Input type="number" value={wizardData.dailyBudget} onChange={e => setWizardData(d => ({ ...d, dailyBudget: e.target.value }))} placeholder="50" />
              </div>
              <div className="space-y-2">
                <Label>Duração (dias)</Label>
                <Input type="number" value={wizardData.duration} onChange={e => setWizardData(d => ({ ...d, duration: e.target.value }))} placeholder="30" />
              </div>
            </div>
            {wizardData.dailyBudget && wizardData.duration && (
              <Card>
                <CardContent className="py-3">
                  <p className="text-xs text-muted-foreground">Investimento Total Estimado</p>
                  <p className="text-2xl font-bold text-primary">R$ {(Number(wizardData.dailyBudget) * Number(wizardData.duration)).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">R$ {wizardData.dailyBudget}/dia × {wizardData.duration} dias</p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Copy do Anúncio</Label>
              <Textarea value={wizardData.copy} onChange={e => setWizardData(d => ({ ...d, copy: e.target.value }))} placeholder="Headline e descrição do anúncio..." rows={4} />
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={() => {
              setWizardData(d => ({ ...d, copy: "🚀 Automatize suas vendas e triplique seus resultados. CRM + Marketing + IA em uma só plataforma. Agende uma demo gratuita!" }));
              toast({ title: "Copy gerado com IA!" });
            }}>
              <Sparkles className="w-4 h-4" /> Gerar Copy com IA
            </Button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-xs font-medium text-muted-foreground">Revisão da Campanha</p>
            <div className="space-y-2">
              <div className="flex justify-between p-3 rounded-lg bg-muted/30 border text-sm">
                <span className="text-muted-foreground">Plataforma</span>
                <Badge className={`text-[10px] ${platformColors[wizardData.platform]}`}>{wizardData.platform} Ads</Badge>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/30 border text-sm">
                <span className="text-muted-foreground">Objetivo</span>
                <span className="font-medium capitalize">{wizardData.objective}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/30 border text-sm">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium">{wizardData.name || "—"}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/30 border text-sm">
                <span className="text-muted-foreground">Orçamento Total</span>
                <span className="font-medium text-primary">R$ {wizardData.dailyBudget && wizardData.duration ? (Number(wizardData.dailyBudget) * Number(wizardData.duration)).toLocaleString() : "—"}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/30 border text-sm">
                <span className="text-muted-foreground">Duração</span>
                <span className="font-medium">{wizardData.duration ? `${wizardData.duration} dias` : "—"}</span>
              </div>
            </div>
            {wizardData.copy && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Copy</p>
                <p className="text-sm bg-muted/30 p-3 rounded-lg border">{wizardData.copy}</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Tráfego Pago"
        subtitle="Estruture campanhas Meta e Google com dashboard de performance"
        icon={<DollarSign className="w-5 h-5 text-primary" />}
        actions={
          <div className="flex gap-2">
            <div className="flex gap-1">
              {["7d", "30d", "90d"].map(p => (
                <Button key={p} variant={period === p ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setPeriod(p)}>{p}</Button>
              ))}
            </div>
            <Button size="sm" onClick={openWizard}>
              <Plus className="w-4 h-4 mr-1" /> Nova Campanha
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Investimento" value={`R$ ${totalSpent.toLocaleString()}`} variant="accent" />
        <KpiCard label="CPC Médio" value={`R$ ${avgCPC}`} trend="down" />
        <KpiCard label="Leads" value={totalLeads.toString()} trend="up" />
        <KpiCard label="CPA Médio" value={`R$ ${(totalSpent / totalLeads).toFixed(2)}`} trend="down" />
        <KpiCard label="ROI Médio" value={`${avgROI}%`} trend="up" />
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="campanhas" className="text-xs">Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Investimento vs Leads</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Line yAxisId="left" type="monotone" dataKey="investimento" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Investimento (R$)" />
                      <Line yAxisId="right" type="monotone" dataKey="leads" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} name="Leads" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">CPC e CTR por Semana</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="cpc" fill="hsl(var(--primary))" name="CPC (R$)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ctr" fill="hsl(var(--chart-3))" name="CTR (%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(["Meta", "Google"] as const).map(platform => {
              const camps = mockCampaigns.filter(c => c.platform === platform);
              const pSpent = camps.reduce((s, c) => s + c.spent, 0);
              const pLeads = camps.reduce((s, c) => s + c.leads, 0);
              return (
                <Card key={platform}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`text-[10px] ${platformColors[platform]}`}>{platform}</Badge>
                      <span className="text-sm font-semibold">{camps.length} campanhas</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><p className="text-lg font-bold">R$ {pSpent.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Investido</p></div>
                      <div><p className="text-lg font-bold text-primary">{pLeads}</p><p className="text-[10px] text-muted-foreground">Leads</p></div>
                      <div><p className="text-lg font-bold">R$ {(pSpent / pLeads).toFixed(2)}</p><p className="text-[10px] text-muted-foreground">CPA</p></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="campanhas" className="space-y-3 mt-4">
          {mockCampaigns.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-all">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{c.name}</span>
                    <Badge className={`text-[9px] ${platformColors[c.platform]}`}>{c.platform}</Badge>
                    <Badge variant="outline" className={`text-[9px] ${statusColors[c.status]}`}>{c.status}</Badge>
                  </div>
                  <Badge variant="outline" className="text-[9px]">{c.objective}</Badge>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Orçamento: R$ {c.budget.toLocaleString()}</span>
                    <span>{Math.round((c.spent / c.budget) * 100)}% utilizado</span>
                  </div>
                  <Progress value={(c.spent / c.budget) * 100} className="h-1.5" />
                </div>
                <div className="grid grid-cols-6 gap-3 text-center">
                  <div><p className="text-sm font-bold">{(c.impressions / 1000).toFixed(1)}k</p><p className="text-[9px] text-muted-foreground">Impressões</p></div>
                  <div><p className="text-sm font-bold">{c.clicks.toLocaleString()}</p><p className="text-[9px] text-muted-foreground">Cliques</p></div>
                  <div><p className="text-sm font-bold text-primary">{c.leads}</p><p className="text-[9px] text-muted-foreground">Leads</p></div>
                  <div><p className="text-sm font-bold">R$ {c.cpc.toFixed(2)}</p><p className="text-[9px] text-muted-foreground">CPC</p></div>
                  <div><p className="text-sm font-bold">{c.ctr.toFixed(1)}%</p><p className="text-[9px] text-muted-foreground">CTR</p></div>
                  <div><p className="text-sm font-bold text-emerald-500">{c.roi}%</p><p className="text-[9px] text-muted-foreground">ROI</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Wizard Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nova Campanha de Tráfego</SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            {/* Wizard step indicators */}
            <div className="flex items-center justify-between mb-6">
              {WIZARD_STEPS.map((step, idx) => (
                <div key={idx} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold transition-all cursor-pointer ${
                      idx < wizardStep ? "bg-primary border-primary text-primary-foreground" :
                      idx === wizardStep ? "border-primary text-primary" :
                      "border-muted-foreground/30 text-muted-foreground/50"
                    }`}
                    onClick={() => idx <= wizardStep && setWizardStep(idx)}
                  >
                    {idx < wizardStep ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  {idx < WIZARD_STEPS.length - 1 && (
                    <div className={`w-6 h-0.5 mx-0.5 ${idx < wizardStep ? "bg-primary" : "bg-muted-foreground/20"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step title */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold">{WIZARD_STEPS[wizardStep].title}</h3>
              <p className="text-xs text-muted-foreground">{WIZARD_STEPS[wizardStep].description}</p>
            </div>

            {/* Step content */}
            {renderWizardContent()}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}
                disabled={wizardStep === 0}
                className="gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Anterior
              </Button>
              <span className="text-xs text-muted-foreground">{wizardStep + 1} / {WIZARD_STEPS.length}</span>
              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <Button size="sm" onClick={() => setWizardStep(wizardStep + 1)} className="gap-1">
                  Próximo <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => { toast({ title: "Campanha criada!" }); setCreateOpen(false); }}>
                  Publicar
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
