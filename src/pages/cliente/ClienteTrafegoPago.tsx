import { useState, useMemo } from "react";
import { DollarSign, Plus, Sparkles, Target, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export default function ClienteTrafegoPago() {
  const data = useMemo(() => getTrafegoPagoData(), []);
  const [period, setPeriod] = useState("30d");
  const [createOpen, setCreateOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(false);

  const totalSpent = mockCampaigns.reduce((s, c) => s + c.spent, 0);
  const totalLeads = mockCampaigns.reduce((s, c) => s + c.leads, 0);
  const avgCPC = (mockCampaigns.reduce((s, c) => s + c.cpc, 0) / mockCampaigns.length).toFixed(2);
  const avgROI = Math.round(mockCampaigns.filter(c => c.status === "Ativa").reduce((s, c) => s + c.roi, 0) / mockCampaigns.filter(c => c.status === "Ativa").length);

  const generateStructure = () => {
    setAiSuggestion(true);
    toast({ title: "Estrutura gerada!", description: "IA sugeriu estrutura de campanha com segmentação e copy." });
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
            <Button size="sm" onClick={() => { setCreateOpen(true); setAiSuggestion(false); }}>
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

          {/* Platform breakdown */}
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

      {/* Create Campaign Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Campanha de Tráfego</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select defaultValue="Meta"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Meta">Meta Ads</SelectItem>
                    <SelectItem value="Google">Google Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Select defaultValue="leads"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leads">Geração de Leads</SelectItem>
                    <SelectItem value="conversao">Conversão</SelectItem>
                    <SelectItem value="trafego">Tráfego</SelectItem>
                    <SelectItem value="reconhecimento">Reconhecimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Nome da Campanha</Label><Input placeholder="Ex: Search Produto X" /></div>
            <div className="space-y-2"><Label>Público-alvo</Label><Textarea placeholder="Descreva o público..." rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Orçamento Diário (R$)</Label><Input type="number" placeholder="50" /></div>
              <div className="space-y-2"><Label>Duração (dias)</Label><Input type="number" placeholder="30" /></div>
            </div>
            <div className="space-y-2"><Label>Criativo / Copy do Anúncio</Label><Textarea placeholder="Headline e descrição do anúncio..." rows={2} /></div>

            <Button variant="outline" className="w-full gap-2" onClick={generateStructure}>
              <Sparkles className="w-4 h-4" /> Gerar Estrutura com IA
            </Button>

            {aiSuggestion && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Estrutura Sugerida</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div><span className="font-medium">Campanha:</span> Conversão — Geração de Leads Qualificados</div>
                    <div><span className="font-medium">Grupo 1:</span> Lookalike 1% — Clientes ativos</div>
                    <div><span className="font-medium">Grupo 2:</span> Interesse — Marketing Digital + CRM</div>
                    <div><span className="font-medium">Grupo 3:</span> Remarketing — Visitantes site 30 dias</div>
                    <div className="pt-2 border-t">
                      <span className="font-medium">Copy sugerida:</span>
                      <p className="mt-1 text-muted-foreground">"🚀 Automatize suas vendas e triplique seus resultados. CRM + Marketing + IA em uma só plataforma. Agende uma demo gratuita!"</p>
                    </div>
                    <div>
                      <span className="font-medium">Segmentação:</span>
                      <p className="text-muted-foreground">25-55 anos, Empresários, Marketing Digital, Gestão Empresarial</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button className="w-full" onClick={() => { toast({ title: "Campanha criada!" }); setCreateOpen(false); }}>Criar Campanha</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
