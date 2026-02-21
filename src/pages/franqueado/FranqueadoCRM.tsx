import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { KpiCard } from "@/components/KpiCard";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, DollarSign, Target, TrendingUp, ArrowLeft, Plus, Phone, Mail,
  Building2, FileSignature, FileCheck2, ClipboardCheck, CheckCircle2,
  Circle, Calendar, StickyNote,
} from "lucide-react";
import { getFranqueadoLeads, getFranqueadoPropostas, getDiagnosticosNOE, etapasCRM, FranqueadoLead, FranqueadoProposta } from "@/data/franqueadoData";
import { toast } from "sonner";

const etapaColors: Record<string, string> = {
  "Novo Lead": "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  "Primeiro Contato": "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400",
  "Follow-up": "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  "Diagnóstico": "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  "Estratégia": "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
  "Proposta": "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  "Venda": "bg-green-500/20 text-green-700 dark:text-green-400",
  "Perdido": "bg-red-500/20 text-red-700 dark:text-red-400",
};

function LeadIndicators({ lead }: { lead: FranqueadoLead }) {
  return (
    <div className="flex gap-1 mt-1.5 flex-wrap">
      {lead.diagnosticoId && (
        <span title="Diagnóstico feito" className="inline-flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400">
          <ClipboardCheck className="w-3 h-3" /> Diag
        </span>
      )}
      {lead.propostaId && (
        <span title="Proposta gerada" className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400">
          <FileSignature className="w-3 h-3" /> Prop
        </span>
      )}
      {lead.contratoId && (
        <span title="Contrato ativo" className="inline-flex items-center gap-0.5 text-[10px] text-purple-600 dark:text-purple-400">
          <FileCheck2 className="w-3 h-3" /> Contr
        </span>
      )}
    </div>
  );
}

export default function FranqueadoCRM() {
  const navigate = useNavigate();
  const [leads] = useState(() => getFranqueadoLeads());
  const [propostas, setPropostas] = useState(() => getFranqueadoPropostas());
  const diagnosticos = getDiagnosticosNOE();
  const [busca, setBusca] = useState("");
  const [etapaFiltro, setEtapaFiltro] = useState<string>("todas");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notasEdit, setNotasEdit] = useState<Record<string, string>>({});

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);
  const [formValorBase, setFormValorBase] = useState(3000);
  const [formExcedente, setFormExcedente] = useState(0);
  const [formTipo, setFormTipo] = useState<"Recorrente" | "Unitário">("Recorrente");
  const [formPrazo, setFormPrazo] = useState("12");
  const [formEmissor, setFormEmissor] = useState<"franqueado" | "matriz">("franqueado");

  // Dialog state
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
    toast.success("Proposta criada com sucesso!");
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
    const diagnostico = diagnosticos.find(d => d.id === selected.diagnosticoId);
    const notas = notasEdit[selected.id] ?? selected.notas ?? "";

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader title={selected.nome} subtitle={selected.empresa || "Sem empresa"}
          actions={<Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>}
        />

        {/* Dados básicos */}
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
          </CardContent>
        </Card>

        {/* Indicadores de integração */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Integrações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                {selected.diagnosticoId
                  ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                  : <Circle className="w-4 h-4 text-muted-foreground/40" />}
                <span className="text-sm">Diagnóstico NOE</span>
              </div>
              <div className="flex items-center gap-2">
                {selected.propostaId
                  ? <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  : <Circle className="w-4 h-4 text-muted-foreground/40" />}
                <span className="text-sm">Proposta gerada</span>
              </div>
              <div className="flex items-center gap-2">
                {proposta?.status === "aceita"
                  ? <CheckCircle2 className="w-4 h-4 text-orange-500" />
                  : <Circle className="w-4 h-4 text-muted-foreground/40" />}
                <span className="text-sm">Proposta aceita</span>
              </div>
              <div className="flex items-center gap-2">
                {selected.contratoId
                  ? <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  : <Circle className="w-4 h-4 text-muted-foreground/40" />}
                <span className="text-sm">Contrato ativo</span>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-border flex-wrap">
              {!selected.diagnosticoId && (
                <Button size="sm" variant="outline" onClick={() => navigate(`/franqueado/diagnostico?leadId=${selected.id}`)}>
                  <ClipboardCheck className="w-4 h-4 mr-1" /> Iniciar Diagnóstico NOE
                </Button>
              )}
              {selected.diagnosticoId && (
                <Button size="sm" variant="ghost" onClick={() => navigate(`/franqueado/diagnostico?leadId=${selected.id}`)}>
                  <ClipboardCheck className="w-4 h-4 mr-1" /> Ver Diagnóstico
                </Button>
              )}
              {(selected.etapa === "Proposta" || selected.etapa === "Estratégia") && !proposta && (
                <Button size="sm" variant="default" onClick={() => openDrawer(selected.id)}>
                  <FileSignature className="w-4 h-4 mr-1" /> Gerar Proposta
                </Button>
              )}
              {proposta && proposta.status === "aceita" && !selected.contratoId && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openConvertDialog(proposta)}>
                  <FileCheck2 className="w-4 h-4 mr-1" /> Converter em Contrato
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Histórico do Lead */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
              <div className="relative">
                <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-primary" />
                <p className="text-xs text-muted-foreground">{selected.criadoEm}</p>
                <p className="text-sm font-medium">Lead criado — {selected.origem}</p>
              </div>
              {diagnostico && (
                <div className="relative">
                  <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-xs text-muted-foreground">{diagnostico.criadoEm}</p>
                  <p className="text-sm font-medium">Diagnóstico NOE — {diagnostico.nivel} ({diagnostico.pontuacao}%)</p>
                </div>
              )}
              {proposta && (
                <div className="relative">
                  <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-blue-500" />
                  <p className="text-xs text-muted-foreground">{proposta.criadaEm}</p>
                  <p className="text-sm font-medium">Proposta {proposta.id} — R$ {proposta.valor.toLocaleString()} ({proposta.status})</p>
                </div>
              )}
              {selected.contratoId && (
                <div className="relative">
                  <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-purple-500" />
                  <p className="text-xs text-muted-foreground">{selected.ultimoContato}</p>
                  <p className="text-sm font-medium">Contrato {selected.contratoId} ativado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tarefas */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(selected.tarefas && selected.tarefas.length > 0) ? (
              <div className="space-y-2">
                {selected.tarefas.map(t => (
                  <div key={t.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <Checkbox checked={t.concluida} />
                    <span className={`text-sm flex-1 ${t.concluida ? "line-through text-muted-foreground" : ""}`}>{t.titulo}</span>
                    <span className="text-xs text-muted-foreground">{t.data}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa registrada</p>
            )}
          </CardContent>
        </Card>

        {/* Notas */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-primary" /> Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notas}
              onChange={e => setNotasEdit(prev => ({ ...prev, [selected.id]: e.target.value }))}
              placeholder="Adicione notas sobre este lead..."
              rows={4}
            />
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

      {/* Kanban */}
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
                          <LeadIndicators lead={l} />

                          {etapa === "Proposta" && !proposta && (
                            <Button size="sm" variant="default" className="w-full mt-2 text-xs h-7" onClick={(e) => { e.stopPropagation(); openDrawer(l.id); }}>
                              <FileSignature className="w-3 h-3 mr-1" /> Gerar Proposta
                            </Button>
                          )}
                          {proposta && proposta.status === "aceita" && !l.contratoId && (
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

      {/* Drawer: Gerar Proposta */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Gerar Proposta</SheetTitle>
            <SheetDescription>{drawerLead ? `${drawerLead.nome}${drawerLead.empresa ? ` — ${drawerLead.empresa}` : ""}` : ""}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2"><Label>Valor Base (R$)</Label><Input type="number" value={formValorBase} onChange={e => setFormValorBase(Number(e.target.value))} /></div>
            <div className="space-y-2"><Label>Valor Excedente (R$)</Label><Input type="number" value={formExcedente} onChange={e => setFormExcedente(Number(e.target.value))} /></div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formTipo} onValueChange={v => setFormTipo(v as "Recorrente" | "Unitário")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Recorrente">Recorrente</SelectItem><SelectItem value="Unitário">Unitário</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Select value={formPrazo} onValueChange={setFormPrazo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="6">6 meses</SelectItem><SelectItem value="12">12 meses</SelectItem><SelectItem value="24">24 meses</SelectItem></SelectContent>
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
            {formValorBase > 0 && (
              <Card className="border-primary/20 bg-primary/5 p-4">
                <p className="text-xs text-muted-foreground mb-1">Simulação — valor mensal do franqueado:</p>
                <p className="text-lg font-bold text-primary">
                  R$ {(formValorBase * 0.2 + (formEmissor === "franqueado" ? formExcedente : formExcedente * 0.2)).toLocaleString()}/mês
                </p>
              </Card>
            )}
            <Button className="w-full" onClick={handleGerarProposta}><FileSignature className="w-4 h-4 mr-1" /> Gerar Proposta</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog: Converter em Contrato */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Converter em Contrato</DialogTitle>
            <DialogDescription>Confirme os dados para criar o contrato automaticamente.</DialogDescription>
          </DialogHeader>
          {dialogProposta && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-semibold">{dialogProposta.clienteNome}</p></div>
              <div><p className="text-xs text-muted-foreground">Valor Base</p><p className="font-semibold">R$ {dialogProposta.valor.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Excedente</p><p className="font-semibold">{dialogProposta.valorExcedente ? `R$ ${dialogProposta.valorExcedente.toLocaleString()}` : "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Tipo</p><p className="font-semibold">{dialogProposta.tipo || "Recorrente"}</p></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleConverterContrato}><FileCheck2 className="w-4 h-4 mr-1" /> Criar Contrato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
