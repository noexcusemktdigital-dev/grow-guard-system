import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KpiCard } from "@/components/KpiCard";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, DollarSign, Target, TrendingUp, ArrowLeft, Plus, Phone, Mail, Building2, FileSignature, FileCheck2 } from "lucide-react";
import { getFranqueadoLeads, getFranqueadoPropostas, etapasCRM, FranqueadoLead, FranqueadoProposta } from "@/data/franqueadoData";
import { toast } from "sonner";

const etapaColors: Record<string, string> = {
  "Novo Lead": "bg-blue-500/20 text-blue-400",
  "Primeiro Contato": "bg-cyan-500/20 text-cyan-400",
  "Follow-up": "bg-yellow-500/20 text-yellow-400",
  "Diagnóstico": "bg-purple-500/20 text-purple-400",
  "Estratégia": "bg-indigo-500/20 text-indigo-400",
  "Proposta": "bg-orange-500/20 text-orange-400",
  "Venda": "bg-green-500/20 text-green-400",
  "Perdido": "bg-red-500/20 text-red-400",
};

export default function FranqueadoCRM() {
  const navigate = useNavigate();
  const [leads] = useState(() => getFranqueadoLeads());
  const [propostas, setPropostas] = useState(() => getFranqueadoPropostas());
  const [busca, setBusca] = useState("");
  const [etapaFiltro, setEtapaFiltro] = useState<string>("todas");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Drawer state (Gerar Proposta)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);
  const [formValorBase, setFormValorBase] = useState(3000);
  const [formExcedente, setFormExcedente] = useState(0);
  const [formTipo, setFormTipo] = useState<"Recorrente" | "Unitário">("Recorrente");
  const [formPrazo, setFormPrazo] = useState("12");
  const [formEmissor, setFormEmissor] = useState<"franqueado" | "matriz">("franqueado");

  // Dialog state (Converter em Contrato)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProposta, setDialogProposta] = useState<FranqueadoProposta | null>(null);

  const filtrados = useMemo(() => {
    return leads.filter(l => {
      if (busca && !l.nome.toLowerCase().includes(busca.toLowerCase()) && !l.empresa?.toLowerCase().includes(busca.toLowerCase())) return false;
      if (etapaFiltro !== "todas" && l.etapa !== etapaFiltro) return false;
      return true;
    });
  }, [leads, busca, etapaFiltro]);

  const selected = leads.find(l => l.id === selectedId);
  const totalValor = leads.filter(l => l.etapa !== "Perdido").reduce((s, l) => s + (l.valor || 0), 0);
  const vendas = leads.filter(l => l.etapa === "Venda").length;

  function getPropostaForLead(leadId: string) {
    return propostas.find(p => p.leadId === leadId);
  }

  function openDrawer(leadId: string) {
    const lead = leads.find(l => l.id === leadId);
    setDrawerLeadId(leadId);
    setFormValorBase(lead?.valor || 3000);
    setFormExcedente(0);
    setFormTipo("Recorrente");
    setFormPrazo("12");
    setFormEmissor("franqueado");
    setDrawerOpen(true);
  }

  function handleGerarProposta() {
    if (!drawerLeadId) return;
    const lead = leads.find(l => l.id === drawerLeadId);
    if (!lead) return;
    const newProposta: FranqueadoProposta = {
      id: `P-${Date.now()}`,
      clienteNome: lead.nome,
      valor: formValorBase,
      valorExcedente: formExcedente,
      emissorExcedente: formEmissor,
      tipo: formTipo,
      prazo: formPrazo,
      status: "enviada",
      criadaEm: new Date().toISOString().split("T")[0],
      validaAte: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      servicos: ["Marketing Digital"],
      leadId: drawerLeadId,
    };
    setPropostas(prev => [...prev, newProposta]);
    setDrawerOpen(false);
    toast.success("Proposta criada com sucesso! PDF gerado.");
  }

  function openConvertDialog(proposta: FranqueadoProposta) {
    setDialogProposta(proposta);
    setDialogOpen(true);
  }

  function handleConverterContrato() {
    if (!dialogProposta) return;
    setDialogOpen(false);
    toast.success("Contrato ativado com sucesso!");
    navigate("/franqueado/contratos?novo=CT-novo");
  }

  // ── DETALHE DO LEAD ──
  if (selected) {
    const proposta = getPropostaForLead(selected.id);
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader title={selected.nome} subtitle={selected.empresa || "Sem empresa"}
          actions={<Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>}
        />
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground">Etapa</p><Badge className={etapaColors[selected.etapa]}>{selected.etapa}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-semibold">{selected.valor ? `R$ ${selected.valor.toLocaleString()}` : "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Origem</p><p className="font-semibold">{selected.origem}</p></div>
              <div><p className="text-xs text-muted-foreground">Criado em</p><p className="font-semibold">{selected.criadoEm}</p></div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-border flex-wrap">
              <Button variant="outline" size="sm"><Phone className="w-4 h-4 mr-1" /> {selected.telefone}</Button>
              <Button variant="outline" size="sm"><Mail className="w-4 h-4 mr-1" /> {selected.email}</Button>
            </div>

            {/* Ações integradas */}
            <div className="flex gap-2 pt-4 border-t border-border flex-wrap">
              {(selected.etapa === "Proposta" || selected.etapa === "Estratégia") && !proposta && (
                <Button size="sm" variant="destructive" onClick={() => openDrawer(selected.id)}>
                  <FileSignature className="w-4 h-4 mr-1" /> Gerar Proposta
                </Button>
              )}
              {proposta && proposta.status === "enviada" && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-400/30">Proposta enviada ({proposta.id})</Badge>
              )}
              {proposta && proposta.status === "aceita" && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openConvertDialog(proposta)}>
                  <FileCheck2 className="w-4 h-4 mr-1" /> Converter em Contrato
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const drawerLead = leads.find(l => l.id === drawerLeadId);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="CRM de Vendas" subtitle="Gerencie seus leads e oportunidades"
        actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Lead</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total de Leads" value={String(leads.length)} icon={Users} delay={0} />
        <KpiCard label="Pipeline" value={`R$ ${totalValor.toLocaleString()}`} icon={DollarSign} delay={1} variant="accent" />
        <KpiCard label="Vendas Fechadas" value={String(vendas)} icon={Target} delay={2} />
        <KpiCard label="Taxa Conversão" value={leads.length ? `${Math.round((vendas / leads.length) * 100)}%` : "0%"} icon={TrendingUp} delay={3} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Input placeholder="Buscar lead..." value={busca} onChange={e => setBusca(e.target.value)} className="max-w-xs" />
        <div className="flex gap-1 flex-wrap">
          {["todas", ...etapasCRM].map(et => (
            <Button key={et} variant={etapaFiltro === et ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setEtapaFiltro(et)}>
              {et === "todas" ? "Todas" : et}
            </Button>
          ))}
        </div>
      </div>

      {/* Kanban view */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {etapasCRM.map(etapa => {
            const leadsEtapa = filtrados.filter(l => l.etapa === etapa);
            return (
              <div key={etapa} className="w-64 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider">{etapa}</h3>
                  <Badge variant="secondary" className="text-[10px]">{leadsEtapa.length}</Badge>
                </div>
                <div className="space-y-2">
                  {leadsEtapa.map(l => {
                    const proposta = getPropostaForLead(l.id);
                    return (
                      <Card key={l.id} className="glass-card hover-lift cursor-pointer" onClick={() => setSelectedId(l.id)}>
                        <CardContent className="p-3">
                          <p className="text-sm font-semibold truncate">{l.nome}</p>
                          {l.empresa && <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" /> {l.empresa}</p>}
                          {l.valor && <p className="text-xs font-semibold text-primary mt-1">R$ {l.valor.toLocaleString()}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">{l.origem}</p>

                          {/* Ações inline no card */}
                          {etapa === "Proposta" && !proposta && (
                            <Button size="sm" variant="destructive" className="w-full mt-2 text-xs h-7" onClick={(e) => { e.stopPropagation(); openDrawer(l.id); }}>
                              <FileSignature className="w-3 h-3 mr-1" /> Gerar Proposta
                            </Button>
                          )}
                          {proposta && proposta.status === "enviada" && (
                            <Badge variant="outline" className="mt-2 text-[10px] bg-blue-500/10 text-blue-400 border-blue-400/30 w-full justify-center">
                              Proposta Enviada
                            </Badge>
                          )}
                          {proposta && proposta.status === "aceita" && (
                            <Button size="sm" className="w-full mt-2 text-xs h-7 bg-green-600 hover:bg-green-700" onClick={(e) => { e.stopPropagation(); openConvertDialog(proposta); }}>
                              <FileCheck2 className="w-3 h-3 mr-1" /> Converter em Contrato
                            </Button>
                          )}
                          {(etapa === "Venda") && proposta && proposta.status === "aceita" && (
                            <Button size="sm" className="w-full mt-2 text-xs h-7 bg-green-600 hover:bg-green-700" onClick={(e) => { e.stopPropagation(); openConvertDialog(proposta); }}>
                              <FileCheck2 className="w-3 h-3 mr-1" /> Converter em Contrato
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {leadsEtapa.length === 0 && <p className="text-xs text-muted-foreground/50 text-center py-4">Nenhum lead</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DRAWER: Gerar Proposta ── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Gerar Proposta</SheetTitle>
            <SheetDescription>
              {drawerLead ? `${drawerLead.nome}${drawerLead.empresa ? ` — ${drawerLead.empresa}` : ""}` : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Valor Base (R$)</Label>
              <Input type="number" value={formValorBase} onChange={e => setFormValorBase(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Valor Excedente (R$)</Label>
              <Input type="number" value={formExcedente} onChange={e => setFormExcedente(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formTipo} onValueChange={v => setFormTipo(v as "Recorrente" | "Unitário")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recorrente">Recorrente</SelectItem>
                  <SelectItem value="Unitário">Unitário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Select value={formPrazo} onValueChange={setFormPrazo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                  <SelectItem value="24">24 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quem emite a cobrança</Label>
              <Select value={formEmissor} onValueChange={v => setFormEmissor(v as "franqueado" | "matriz")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="franqueado">Franqueado (100% excedente seu)</SelectItem>
                  <SelectItem value="matriz">Matriz (20% excedente para matriz)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Simulação */}
            {formValorBase > 0 && (
              <Card className="border-primary/20 bg-primary/5 p-4">
                <p className="text-xs text-muted-foreground mb-1">Simulação — valor mensal do franqueado:</p>
                <p className="text-lg font-bold text-primary">
                  R$ {(formValorBase * 0.2 + (formEmissor === "franqueado" ? formExcedente : formExcedente * 0.2)).toLocaleString()}/mês
                </p>
              </Card>
            )}

            <Button className="w-full" onClick={handleGerarProposta}>
              <FileSignature className="w-4 h-4 mr-1" /> Gerar Proposta
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── DIALOG: Converter em Contrato ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Converter em Contrato</DialogTitle>
            <DialogDescription>Confirme os dados para criar o contrato automaticamente.</DialogDescription>
          </DialogHeader>
          {dialogProposta && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-semibold">{dialogProposta.clienteNome}</p></div>
                <div><p className="text-xs text-muted-foreground">Valor Base</p><p className="font-semibold">R$ {dialogProposta.valor.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Excedente</p><p className="font-semibold">{dialogProposta.valorExcedente ? `R$ ${dialogProposta.valorExcedente.toLocaleString()}` : "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Tipo</p><p className="font-semibold">{dialogProposta.tipo || "Recorrente"}</p></div>
                <div><p className="text-xs text-muted-foreground">Data Início</p><p className="font-semibold">{new Date().toISOString().split("T")[0]}</p></div>
                <div><p className="text-xs text-muted-foreground">Vencimento</p><p className="font-semibold">{new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0]}</p></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleConverterContrato}>
              <FileCheck2 className="w-4 h-4 mr-1" /> Criar Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
