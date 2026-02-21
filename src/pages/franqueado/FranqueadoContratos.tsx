import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/KpiCard";
import { AlertCard } from "@/components/AlertCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileSignature, DollarSign, Clock, AlertTriangle, Download, ArrowLeft,
  Upload, CheckCircle2, XCircle, Plus
} from "lucide-react";
import {
  getFranqueadoContratos, getFranqueadoLeads, getFranqueadoPropostas,
  type FranqueadoContrato
} from "@/data/franqueadoData";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  ativo: "bg-green-500/20 text-green-400 border-green-400/30",
  vencendo: "bg-orange-500/20 text-orange-400 border-orange-400/30",
  pendente: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  encerrado: "bg-muted text-muted-foreground border-muted-foreground/30",
};

function calcValorFranqueado(base: number, exc: number, emissor: "franqueado" | "matriz" | null) {
  const b = base * 0.2;
  if (!emissor || exc === 0) return b;
  return emissor === "franqueado" ? b + exc : b + exc * 0.2;
}

export default function FranqueadoContratos() {
  const [contratos] = useState(() => getFranqueadoContratos());
  const leads = getFranqueadoLeads();
  const propostas = getFranqueadoPropostas();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("lista");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");

  // form state
  const [formCliente, setFormCliente] = useState("");
  const [formProposta, setFormProposta] = useState("");
  const [formValorBase, setFormValorBase] = useState(0);
  const [formExcedente, setFormExcedente] = useState(0);
  const [formEmissor, setFormEmissor] = useState<"franqueado" | "matriz">("franqueado");
  const [formPrazo, setFormPrazo] = useState("12");
  const [formTipo, setFormTipo] = useState<"Recorrente" | "Unitário">("Recorrente");

  const selected = contratos.find(c => c.id === selectedId);

  // KPIs
  const ativos = contratos.filter(c => c.status === "ativo").length;
  const receitaRecorrente = contratos.filter(c => c.status === "ativo").reduce((s, c) => s + c.valorBase, 0);
  const vencendo = contratos.filter(c => c.status === "vencendo").length;
  const semAssinatura = contratos.filter(c => !c.assinado).length;

  // Filters
  const filtered = contratos.filter(c => {
    if (statusFilter !== "todos" && c.status !== statusFilter) return false;
    if (tipoFilter !== "todos" && c.tipo !== tipoFilter) return false;
    return true;
  });

  // Alertas
  const alertas = [
    ...(vencendo > 0 ? [{ tipo: "warning" as const, mensagem: `${vencendo} contrato(s) vencendo nos próximos 15 dias` }] : []),
    ...(semAssinatura > 0 ? [{ tipo: "clock" as const, mensagem: `${semAssinatura} contrato(s) sem assinatura confirmada` }] : []),
  ];

  const propostasAceitas = propostas.filter(p => p.status === "aceita");

  function handleSelectProposta(id: string) {
    setFormProposta(id);
    const p = propostas.find(x => x.id === id);
    if (p) {
      setFormValorBase(p.valor);
      const lead = leads.find(l => l.nome === p.clienteNome);
      if (lead) setFormCliente(lead.id);
    }
  }

  function handleGerarContrato() {
    if (!formCliente || formValorBase <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    toast.success("Contrato gerado com sucesso! Download disponível.");
  }

  // ── DETALHE DO CONTRATO ──
  if (selected) {
    const valorFranqueado = calcValorFranqueado(selected.valorBase, selected.valorExcedente, selected.emissorExcedente);
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader title={`Contrato ${selected.id}`} subtitle={selected.clienteNome}
          actions={<Button variant="ghost" size="sm" onClick={() => { setSelectedId(null); setActiveTab("lista"); }}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>}
        />
        <Card className="glass-card">
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-semibold">{selected.clienteNome}</p></div>
              <div><p className="text-xs text-muted-foreground">Status</p><Badge className={statusColors[selected.status]}>{selected.status}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Valor Base</p><p className="font-semibold">R$ {selected.valorBase.toLocaleString()}/mês</p></div>
              <div><p className="text-xs text-muted-foreground">Excedente</p><p className="font-semibold">{selected.valorExcedente > 0 ? `R$ ${selected.valorExcedente.toLocaleString()}` : "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Emissor Cobrança</p><p className="font-semibold">{selected.emissorExcedente === "franqueado" ? "Franqueado" : selected.emissorExcedente === "matriz" ? "Matriz" : "N/A"}</p></div>
              <div><p className="text-xs text-muted-foreground">Valor Final Franqueado</p><p className="font-semibold text-primary">R$ {valorFranqueado.toLocaleString()}/mês</p></div>
              <div><p className="text-xs text-muted-foreground">Tipo</p><p className="font-semibold">{selected.tipo}</p></div>
              <div><p className="text-xs text-muted-foreground">Assinado</p>
                {selected.assinado
                  ? <span className="flex items-center gap-1 text-green-400 font-semibold"><CheckCircle2 className="w-4 h-4" /> Sim</span>
                  : <span className="flex items-center gap-1 text-yellow-400 font-semibold"><XCircle className="w-4 h-4" /> Pendente</span>}
              </div>
              <div><p className="text-xs text-muted-foreground">Início</p><p className="font-semibold">{selected.inicioEm}</p></div>
              <div><p className="text-xs text-muted-foreground">Vencimento</p><p className="font-semibold">{selected.fimEm}</p></div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">Histórico</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>📄 Contrato criado em {selected.inicioEm}</p>
                {selected.assinado && <p>✅ Contrato assinado pelo cliente</p>}
                {selected.propostaId && <p>🔗 Vinculado à proposta {selected.propostaId}</p>}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border">
              <Button size="sm"><Download className="w-4 h-4 mr-1" /> Download PDF</Button>
              <Button size="sm" variant="outline"><Upload className="w-4 h-4 mr-1" /> Anexar Assinado</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Meus Contratos" subtitle="Gerencie contratos de clientes da unidade" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista">Lista de Contratos</TabsTrigger>
          <TabsTrigger value="gerar">Gerar Novo Contrato</TabsTrigger>
        </TabsList>

        {/* ── ABA 1: LISTA ── */}
        <TabsContent value="lista" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Contratos Ativos" value={String(ativos)} icon={FileSignature} delay={0} />
            <KpiCard label="Receita Recorrente" value={`R$ ${receitaRecorrente.toLocaleString()}`} icon={DollarSign} delay={1} variant="accent" />
            <KpiCard label="Vencendo em 15 dias" value={String(vencendo)} icon={Clock} delay={2} />
            <KpiCard label="Sem Assinatura" value={String(semAssinatura)} icon={AlertTriangle} delay={3} />
          </div>

          {alertas.length > 0 && (
            <Card className="glass-card">
              <CardContent className="p-4 space-y-2">
                {alertas.map((a, i) => <AlertCard key={i} type={a.tipo} message={a.mensagem} />)}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="vencendo">Vencendo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Tipos</SelectItem>
                <SelectItem value="Recorrente">Recorrente</SelectItem>
                <SelectItem value="Unitário">Unitário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="glass-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor Base</TableHead>
                  <TableHead>Excedente</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assinado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => { setSelectedId(c.id); }}>
                    <TableCell className="font-medium">{c.clienteNome}</TableCell>
                    <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                    <TableCell className="font-semibold">R$ {c.valorBase.toLocaleString()}</TableCell>
                    <TableCell>{c.valorExcedente > 0 ? `R$ ${c.valorExcedente.toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.inicioEm}</TableCell>
                    <TableCell className="text-muted-foreground">{c.fimEm}</TableCell>
                    <TableCell><Badge className={statusColors[c.status]}>{c.status}</Badge></TableCell>
                    <TableCell>
                      {c.assinado
                        ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                        : <XCircle className="w-4 h-4 text-yellow-400" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── ABA 2: GERAR NOVO CONTRATO ── */}
        <TabsContent value="gerar" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4" /> Gerar Novo Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proposta Vinculada (aceitas)</Label>
                  <Select value={formProposta} onValueChange={handleSelectProposta}>
                    <SelectTrigger><SelectValue placeholder="Selecionar proposta" /></SelectTrigger>
                    <SelectContent>
                      {propostasAceitas.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.id} — {p.clienteNome} (R$ {p.valor.toLocaleString()})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cliente (CRM)</Label>
                  <Select value={formCliente} onValueChange={setFormCliente}>
                    <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                    <SelectContent>
                      {leads.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.nome}{l.empresa ? ` — ${l.empresa}` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor Base (R$)</Label>
                  <Input type="number" value={formValorBase} onChange={e => setFormValorBase(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Valor Excedente (R$)</Label>
                  <Input type="number" value={formExcedente} onChange={e => setFormExcedente(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Forma de Cobrança do Excedente</Label>
                  <Select value={formEmissor} onValueChange={v => setFormEmissor(v as "franqueado" | "matriz")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="franqueado">Franqueado emite (100% seu)</SelectItem>
                      <SelectItem value="matriz">Matriz emite (20% da matriz)</SelectItem>
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
                  <Label>Tipo</Label>
                  <Select value={formTipo} onValueChange={v => setFormTipo(v as "Recorrente" | "Unitário")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Recorrente">Recorrente</SelectItem>
                      <SelectItem value="Unitário">Unitário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formValorBase > 0 && (
                <Card className="border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Simulação de valor mensal para o franqueado:</p>
                  <p className="text-lg font-bold text-primary">
                    R$ {calcValorFranqueado(formValorBase, formExcedente, formEmissor).toLocaleString()}/mês
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Base 20%: R$ {(formValorBase * 0.2).toLocaleString()}
                    {formExcedente > 0 && ` + Excedente (${formEmissor === "franqueado" ? "100%" : "20%"}): R$ ${(formEmissor === "franqueado" ? formExcedente : formExcedente * 0.2).toLocaleString()}`}
                  </p>
                </Card>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleGerarContrato}><FileSignature className="w-4 h-4 mr-1" /> Gerar Contrato</Button>
                <Button variant="outline"><Download className="w-4 h-4 mr-1" /> Baixar PDF</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
