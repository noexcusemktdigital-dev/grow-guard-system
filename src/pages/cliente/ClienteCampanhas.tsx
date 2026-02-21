import { useState, useMemo } from "react";
import { Rocket, Plus, FileText, Megaphone, Globe, Send, Sparkles, Target, Calendar, Clock, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getClienteCampanhas, getPlanoMarketing360, type CampanhaMarketing } from "@/data/clienteData";
import { toast } from "@/hooks/use-toast";

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  Ativa: { bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500" },
  Pausada: { bg: "bg-yellow-500/10", text: "text-yellow-500", dot: "bg-yellow-500" },
  Finalizada: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  Rascunho: { bg: "bg-blue-500/10", text: "text-blue-500", dot: "bg-blue-500" },
};

export default function ClienteCampanhas() {
  const campanhas = useMemo(() => getClienteCampanhas(), []);
  const plano = useMemo(() => getPlanoMarketing360(), []);
  const [filter, setFilter] = useState("Todas");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampanhaMarketing | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const filters = ["Todas", "Ativa", "Pausada", "Finalizada", "Rascunho"];
  const filtered = filter === "Todas" ? campanhas : campanhas.filter(c => c.status === filter);

  const totalBudget = campanhas.reduce((s, c) => s + c.budget, 0);
  const totalSpent = campanhas.reduce((s, c) => s + c.spent, 0);
  const totalLeads = campanhas.reduce((s, c) => s + c.leads, 0);
  const ativas = campanhas.filter(c => c.status === "Ativa").length;

  const handleCreate = () => {
    toast({ title: "Campanha criada!", description: "Nova campanha adicionada com sucesso." });
    setCreateOpen(false);
  };

  const generateMonthlyCampaign = () => {
    setAiGenerated(true);
    toast({ title: "Campanha mensal gerada!", description: "Estrutura baseada nas metas do seu plano de marketing." });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Campanhas"
        subtitle="Hub de organização — gerencie campanhas e entregáveis vinculados"
        icon={<Rocket className="w-5 h-5 text-primary" />}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Campanha</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nova Campanha</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Nome da Campanha</Label><Input placeholder="Ex: Lançamento Q2" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Objetivo</Label>
                    <Select defaultValue="leads"><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leads">Gerar Leads</SelectItem>
                        <SelectItem value="vendas">Vendas</SelectItem>
                        <SelectItem value="awareness">Brand Awareness</SelectItem>
                        <SelectItem value="lancamento">Lançamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Canal Principal</Label>
                    <Select defaultValue="multi"><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="multi">Multi-canal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Público-alvo</Label><Textarea placeholder="Descreva o público-alvo..." rows={2} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Data Início</Label><Input type="date" /></div>
                  <div className="space-y-2"><Label>Data Fim</Label><Input type="date" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Orçamento (R$)</Label><Input type="number" placeholder="5000" /></div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select defaultValue="Rascunho"><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativa">Ativa</SelectItem>
                        <SelectItem value="Pausada">Pausada</SelectItem>
                        <SelectItem value="Rascunho">Rascunho</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" onClick={handleCreate}>Criar Campanha</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Orçamento Total" value={`R$ ${totalBudget.toLocaleString()}`} variant="accent" />
        <KpiCard label="Gasto" value={`R$ ${totalSpent.toLocaleString()}`} sublabel={`${Math.round((totalSpent / totalBudget) * 100)}%`} />
        <KpiCard label="Leads Totais" value={totalLeads.toString()} trend="up" />
        <KpiCard label="Campanhas Ativas" value={ativas.toString()} />
      </div>

      <div className="flex gap-2">
        {filters.map(f => <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setFilter(f)}>{f}</Button>)}
      </div>

      {/* Timeline Visual */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {filtered.map((c, idx) => {
            const sc = statusColors[c.status];
            const budgetPct = Math.round((c.spent / c.budget) * 100);
            return (
              <div key={c.id} className="relative pl-14">
                {/* Timeline node */}
                <div className="absolute left-[1.125rem] top-5 z-10 flex items-center justify-center">
                  <div className={`w-4 h-4 rounded-full border-2 border-background ${sc.dot}`} />
                </div>
                {/* Date label */}
                <div className="absolute left-0 top-5 -translate-x-0">
                </div>

                <Card
                  className="cursor-pointer hover:shadow-md transition-all hover:border-primary/20"
                  onClick={() => setSelectedCampaign(c)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                        <span className="text-sm font-semibold">{c.name}</span>
                        <Badge variant="outline" className={`text-[9px] ${sc.bg} ${sc.text}`}>{c.status}</Badge>
                        <Badge variant="outline" className="text-[9px]">{c.channel}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{c.startDate}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{c.endDate}</span>
                      </div>
                    </div>

                    {/* KPIs inline */}
                    <div className="grid grid-cols-4 gap-4 text-center mb-3">
                      <div><p className="text-lg font-bold">R$ {c.budget.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Orçamento</p></div>
                      <div><p className="text-lg font-bold">R$ {c.spent.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Gasto</p></div>
                      <div><p className="text-lg font-bold text-primary">{c.leads}</p><p className="text-[10px] text-muted-foreground">Leads</p></div>
                      <div><p className="text-lg font-bold">{c.conversions}</p><p className="text-[10px] text-muted-foreground">Conversões</p></div>
                    </div>

                    {/* Budget progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Orçamento utilizado</span>
                        <span>{budgetPct}%</span>
                      </div>
                      <Progress value={budgetPct} className="h-1.5" />
                    </div>

                    {/* Entregáveis */}
                    <div className="flex gap-2 flex-wrap">
                      {c.entregaveis.conteudos > 0 && <Badge variant="secondary" className="text-[9px] gap-1"><FileText className="w-3 h-3" />{c.entregaveis.conteudos} conteúdos</Badge>}
                      {c.entregaveis.anuncios > 0 && <Badge variant="secondary" className="text-[9px] gap-1"><Megaphone className="w-3 h-3" />{c.entregaveis.anuncios} anúncios</Badge>}
                      {c.entregaveis.landingPages > 0 && <Badge variant="secondary" className="text-[9px] gap-1"><Globe className="w-3 h-3" />{c.entregaveis.landingPages} LPs</Badge>}
                      {c.entregaveis.disparos > 0 && <Badge variant="secondary" className="text-[9px] gap-1"><Send className="w-3 h-3" />{c.entregaveis.disparos} disparos</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaign Detail Sheet */}
      <Sheet open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedCampaign && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedCampaign.name}
                  <Badge variant="outline" className={`text-[9px] ${statusColors[selectedCampaign.status].bg} ${statusColors[selectedCampaign.status].text}`}>
                    {selectedCampaign.status}
                  </Badge>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <Tabs defaultValue="resumo">
                  <TabsList className="h-8">
                    <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
                    <TabsTrigger value="conteudos" className="text-xs">Conteúdos</TabsTrigger>
                    <TabsTrigger value="anuncios" className="text-xs">Anúncios</TabsTrigger>
                    <TabsTrigger value="lps" className="text-xs">Landing Pages</TabsTrigger>
                  </TabsList>
                  <TabsContent value="resumo" className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Card><CardContent className="py-3 text-center"><p className="text-lg font-bold">R$ {selectedCampaign.budget.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Orçamento</p></CardContent></Card>
                      <Card><CardContent className="py-3 text-center"><p className="text-lg font-bold">R$ {selectedCampaign.spent.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Gasto</p></CardContent></Card>
                      <Card><CardContent className="py-3 text-center"><p className="text-lg font-bold text-primary">{selectedCampaign.leads}</p><p className="text-[10px] text-muted-foreground">Leads</p></CardContent></Card>
                      <Card><CardContent className="py-3 text-center"><p className="text-lg font-bold">{selectedCampaign.conversions}</p><p className="text-[10px] text-muted-foreground">Conversões</p></CardContent></Card>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-muted-foreground">Objetivo:</span> {selectedCampaign.objective}</div>
                      <div><span className="text-muted-foreground">Público:</span> {selectedCampaign.audience}</div>
                      <div><span className="text-muted-foreground">Canal:</span> {selectedCampaign.channel}</div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" /> {selectedCampaign.startDate} → {selectedCampaign.endDate}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="conteudos" className="mt-4">
                    {selectedCampaign.entregaveis.conteudos > 0 ? (
                      <div className="space-y-2">
                        {Array.from({ length: selectedCampaign.entregaveis.conteudos }, (_, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm p-3 rounded-lg bg-muted/30 border">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Conteúdo #{i + 1} vinculado</span>
                            <Badge variant="outline" className="text-[9px] ml-auto">Publicado</Badge>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground py-4 text-center">Nenhum conteúdo vinculado</p>}
                  </TabsContent>
                  <TabsContent value="anuncios" className="mt-4">
                    {selectedCampaign.entregaveis.anuncios > 0 ? (
                      <div className="space-y-2">
                        {Array.from({ length: selectedCampaign.entregaveis.anuncios }, (_, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm p-3 rounded-lg bg-muted/30 border">
                            <Megaphone className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Anúncio #{i + 1}</span>
                            <Badge variant="outline" className="text-[9px] ml-auto">Ativo</Badge>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground py-4 text-center">Nenhum anúncio vinculado</p>}
                  </TabsContent>
                  <TabsContent value="lps" className="mt-4">
                    {selectedCampaign.entregaveis.landingPages > 0 ? (
                      <div className="space-y-2">
                        {Array.from({ length: selectedCampaign.entregaveis.landingPages }, (_, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm p-3 rounded-lg bg-muted/30 border">
                            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Landing Page #{i + 1}</span>
                            <Badge variant="outline" className="text-[9px] ml-auto">Ativa</Badge>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma landing page vinculada</p>}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Generate Monthly Campaign */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Gerar Campanha Mensal</span>
            </div>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={generateMonthlyCampaign}>
              <Sparkles className="w-3.5 h-3.5" /> Gerar com base nas metas
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Meta do plano: {plano.objetivo.metaLeads} leads/mês · {plano.objetivo.metaVendas} vendas/mês · ROI {plano.objetivo.roiEsperado}%
          </p>
          {aiGenerated && (
            <div className="space-y-3 pt-3 border-t">
              <p className="text-xs font-medium">Campanha sugerida para Março/2026:</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 bg-background rounded-lg border"><span className="text-muted-foreground">Nome:</span> Captação Março Q1</div>
                <div className="p-2 bg-background rounded-lg border"><span className="text-muted-foreground">Objetivo:</span> Gerar {plano.objetivo.metaLeads} leads</div>
                <div className="p-2 bg-background rounded-lg border"><span className="text-muted-foreground">Orçamento:</span> R$ {plano.orcamento.pago.toLocaleString()}</div>
                <div className="p-2 bg-background rounded-lg border"><span className="text-muted-foreground">Canal:</span> Multi-canal</div>
              </div>
              <div className="text-xs space-y-1">
                <p className="font-medium">Entregáveis sugeridos:</p>
                <p className="text-muted-foreground">• 8 conteúdos orgânicos (Topo + Meio de funil)</p>
                <p className="text-muted-foreground">• 4 anúncios pagos (Google Search + Meta Remarketing)</p>
                <p className="text-muted-foreground">• 1 landing page de captura</p>
                <p className="text-muted-foreground">• 2 disparos WhatsApp segmentados</p>
              </div>
              <Button size="sm" className="w-full" onClick={() => toast({ title: "Campanha criada!", description: "Campanha mensal gerada e adicionada." })}>
                Criar Campanha
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
