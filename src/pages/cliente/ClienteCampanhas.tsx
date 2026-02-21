import { useState, useMemo } from "react";
import { Rocket, Plus, FileText, Megaphone, Globe, Send, ChevronDown, ChevronUp } from "lucide-react";
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
import { getClienteCampanhas, type CampanhaMarketing } from "@/data/clienteData";
import { toast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  Ativa: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Pausada: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  Finalizada: "bg-muted text-muted-foreground",
  Rascunho: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export default function ClienteCampanhas() {
  const campanhas = useMemo(() => getClienteCampanhas(), []);
  const [filter, setFilter] = useState("Todas");
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

      <div className="space-y-3">
        {filtered.map(c => (
          <Card key={c.id} className="hover:shadow-md transition-all">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{c.name}</span>
                  <Badge variant="outline" className={`text-[9px] ${statusColors[c.status]}`}>{c.status}</Badge>
                  <Badge variant="outline" className="text-[9px]">{c.channel}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{c.startDate} → {c.endDate}</span>
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
                  <span>{Math.round((c.spent / c.budget) * 100)}%</span>
                </div>
                <Progress value={(c.spent / c.budget) * 100} className="h-1.5" />
              </div>

              {/* Entregáveis */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {c.entregaveis.conteudos > 0 && <Badge variant="secondary" className="text-[9px] gap-1"><FileText className="w-3 h-3" />{c.entregaveis.conteudos} conteúdos</Badge>}
                  {c.entregaveis.anuncios > 0 && <Badge variant="secondary" className="text-[9px] gap-1"><Megaphone className="w-3 h-3" />{c.entregaveis.anuncios} anúncios</Badge>}
                  {c.entregaveis.landingPages > 0 && <Badge variant="secondary" className="text-[9px] gap-1"><Globe className="w-3 h-3" />{c.entregaveis.landingPages} LPs</Badge>}
                  {c.entregaveis.disparos > 0 && <Badge variant="secondary" className="text-[9px] gap-1"><Send className="w-3 h-3" />{c.entregaveis.disparos} disparos</Badge>}
                </div>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                  Ver detalhes {expandedId === c.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
              </div>

              {/* Expanded details */}
              {expandedId === c.id && (
                <div className="mt-4 pt-4 border-t">
                  <Tabs defaultValue="resumo">
                    <TabsList className="h-8">
                      <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
                      <TabsTrigger value="conteudos" className="text-xs">Conteúdos</TabsTrigger>
                      <TabsTrigger value="anuncios" className="text-xs">Anúncios</TabsTrigger>
                      <TabsTrigger value="lps" className="text-xs">Landing Pages</TabsTrigger>
                    </TabsList>
                    <TabsContent value="resumo" className="mt-3 space-y-2 text-sm">
                      <div><span className="text-muted-foreground">Objetivo:</span> {c.objective}</div>
                      <div><span className="text-muted-foreground">Público:</span> {c.audience}</div>
                      <div><span className="text-muted-foreground">Canal:</span> {c.channel}</div>
                    </TabsContent>
                    <TabsContent value="conteudos" className="mt-3">
                      {c.entregaveis.conteudos > 0 ? (
                        <div className="space-y-2">
                          {Array.from({ length: c.entregaveis.conteudos }, (_, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30">
                              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Conteúdo #{i + 1} vinculado</span>
                              <Badge variant="outline" className="text-[9px] ml-auto">Publicado</Badge>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-muted-foreground">Nenhum conteúdo vinculado</p>}
                    </TabsContent>
                    <TabsContent value="anuncios" className="mt-3">
                      {c.entregaveis.anuncios > 0 ? (
                        <div className="space-y-2">
                          {Array.from({ length: c.entregaveis.anuncios }, (_, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30">
                              <Megaphone className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Anúncio #{i + 1}</span>
                              <Badge variant="outline" className="text-[9px] ml-auto">Ativo</Badge>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-muted-foreground">Nenhum anúncio vinculado</p>}
                    </TabsContent>
                    <TabsContent value="lps" className="mt-3">
                      {c.entregaveis.landingPages > 0 ? (
                        <div className="space-y-2">
                          {Array.from({ length: c.entregaveis.landingPages }, (_, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30">
                              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Landing Page #{i + 1}</span>
                              <Badge variant="outline" className="text-[9px] ml-auto">Ativa</Badge>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-muted-foreground">Nenhuma landing page vinculada</p>}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
