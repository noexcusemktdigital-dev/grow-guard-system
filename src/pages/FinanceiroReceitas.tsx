import { useState } from "react";
import { getReceitasForMonth, getMonthSummary, clientes, franqueados, type Receita } from "@/data/mockData";
import { KpiCard } from "@/components/KpiCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLORS = [
  "hsl(142, 71%, 45%)", "hsl(217, 91%, 60%)", "hsl(25, 95%, 53%)",
  "hsl(262, 83%, 58%)", "hsl(45, 93%, 47%)",
];

export default function FinanceiroReceitas() {
  const [mes, setMes] = useState("2026-02");

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header-title">Receitas</h1>
          <p className="text-sm text-muted-foreground mt-1">Logbook por produto</p>
        </div>
        <select value={mes} onChange={(e) => setMes(e.target.value)} className="bg-secondary text-foreground border border-border rounded-xl px-3 py-2 text-sm">
          <option value="2026-01">Jan/2026</option>
          <option value="2026-02">Fev/2026</option>
          <option value="2026-03">Mar/2026</option>
        </select>
      </div>

      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="assessoria">Assessoria</TabsTrigger>
          <TabsTrigger value="saas">SaaS</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
          <TabsTrigger value="franquia">Venda de Franquia</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral"><VisaoGeralTab mes={mes} /></TabsContent>
        <TabsContent value="assessoria"><ProdutoTab mes={mes} produto="Assessoria Noexcuse" /></TabsContent>
        <TabsContent value="saas"><ProdutoTab mes={mes} produto="SaaS" /></TabsContent>
        <TabsContent value="sistema"><SistemaTab mes={mes} /></TabsContent>
        <TabsContent value="franquia"><VendaFranquiaTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Visão Geral ── */
function VisaoGeralTab({ mes }: { mes: string }) {
  const summary = getMonthSummary(mes);
  const receitas = getReceitasForMonth(mes);

  const porTipo = Object.entries(summary.receitaPorTipo).map(([name, value]) => ({ name, value }));
  const porProduto = Object.entries(summary.receitaPorProduto || {}).map(([name, value]) => ({ name, value }));

  const recorrente = receitas.filter(r => r.tipo === "Recorrente").reduce((s, r) => s + r.valorBruto, 0);
  const unitaria = receitas.filter(r => r.tipo === "Unitária").reduce((s, r) => s + r.valorBruto, 0);

  const porOrigem: Record<string, number> = {};
  receitas.forEach(r => {
    const origem = r.origemRepasse || "Venda Interna";
    porOrigem[origem] = (porOrigem[origem] || 0) + r.valorBruto;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receita Bruta" value={formatBRL(summary.receitaBruta)} trend="up" />
        <KpiCard label="Receita Recorrente" value={formatBRL(recorrente)} />
        <KpiCard label="Receita Unitária" value={formatBRL(unitaria)} />
        <KpiCard label="Receita Líquida" value={formatBRL(summary.receitaLiquida)} trend="up" accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receita por Tipo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={porTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                {porTipo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => formatBRL(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receita por Produto</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porProduto}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="value" name="Receita" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Receita por Origem</h3>
        <div className="space-y-2">
          {Object.entries(porOrigem).map(([origem, valor]) => (
            <div key={origem} className="flex justify-between py-2 border-b border-border/30 last:border-0">
              <span className="text-sm text-foreground">{origem}</span>
              <span className="text-sm font-bold text-foreground">{formatBRL(valor)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Produto Tab (Assessoria / SaaS) com CRUD ── */
interface ReceitaLocal {
  id: string;
  clienteNome: string;
  valor: number;
  origem: string;
  status: "A Receber" | "Recebido" | "Atrasado";
  nfEmitida: boolean;
  geraRepasse: boolean;
  percentualRepasse: number;
  observacoes: string;
}

function ProdutoTab({ mes, produto }: { mes: string; produto: string }) {
  const receitas = getReceitasForMonth(mes);
  const { toast } = useToast();

  const receitasProduto = receitas.filter(r => {
    const cliente = clientes.find(c => c.id === r.clienteId);
    return cliente?.produto === produto;
  });

  const [localReceitas, setLocalReceitas] = useState<ReceitaLocal[]>(() =>
    receitasProduto.map(r => ({
      id: r.id,
      clienteNome: r.clienteNome || "",
      valor: r.valorBruto,
      origem: r.origemRepasse || "Venda Interna",
      status: r.pago ? "Recebido" : "A Receber",
      nfEmitida: r.notaFiscalEmitida,
      geraRepasse: r.aplicaRepasse,
      percentualRepasse: r.percentualRepasse,
      observacoes: r.notas,
    }))
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const emptyForm: Omit<ReceitaLocal, "id"> = {
    clienteNome: "", valor: 0, origem: "Venda Interna", status: "A Receber",
    nfEmitida: false, geraRepasse: false, percentualRepasse: 0, observacoes: "",
  };
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: ReceitaLocal) => {
    setEditingId(r.id);
    setForm({ clienteNome: r.clienteNome, valor: r.valor, origem: r.origem, status: r.status, nfEmitida: r.nfEmitida, geraRepasse: r.geraRepasse, percentualRepasse: r.percentualRepasse, observacoes: r.observacoes });
    setDialogOpen(true);
  };
  const handleSave = () => {
    if (editingId) {
      setLocalReceitas(prev => prev.map(r => r.id === editingId ? { ...r, ...form } : r));
      toast({ title: "Receita atualizada" });
    } else {
      setLocalReceitas(prev => [...prev, { id: `nr-${Date.now()}`, ...form }]);
      toast({ title: "Receita adicionada" });
    }
    setDialogOpen(false);
  };
  const handleDelete = (id: string) => {
    setLocalReceitas(prev => prev.filter(r => r.id !== id));
    toast({ title: "Receita excluída" });
  };

  const statusColor = (s: string) => {
    if (s === "Recebido") return "bg-emerald-500/15 text-emerald-500";
    if (s === "Atrasado") return "bg-red-500/15 text-red-500";
    return "bg-yellow-500/15 text-yellow-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-4 flex-1 mr-4">
          <KpiCard label="Receitas" value={String(localReceitas.length)} />
          <KpiCard label="Total do Mês" value={formatBRL(localReceitas.reduce((s, r) => s + r.valor, 0))} />
          <KpiCard label="Geram Repasse" value={String(localReceitas.filter(r => r.geraRepasse).length)} />
        </div>
        <Button size="sm" onClick={openCreate} className="gap-2 shrink-0"><Plus className="w-4 h-4" /> Nova Receita</Button>
      </div>

      <div className="glass-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Cliente</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Origem</th>
              <th className="text-right py-3 px-3 text-muted-foreground font-medium">Valor</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Status</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">NF</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Repasse</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {localReceitas.map(r => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-3 text-foreground font-medium">{r.clienteNome}</td>
                <td className="py-3 px-3 text-center text-xs text-muted-foreground">{r.origem}</td>
                <td className="py-3 px-3 text-right text-foreground">{formatBRL(r.valor)}</td>
                <td className="py-3 px-3 text-center"><span className={`text-xs px-2 py-0.5 rounded ${statusColor(r.status)}`}>{r.status}</span></td>
                <td className="py-3 px-3 text-center"><span className={`text-xs px-2 py-0.5 rounded ${r.nfEmitida ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>{r.nfEmitida ? "Sim" : "Não"}</span></td>
                <td className="py-3 px-3 text-center">{r.geraRepasse ? <span className="text-primary text-xs font-medium">{r.percentualRepasse}%</span> : "—"}</td>
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {localReceitas.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">Nenhuma receita cadastrada</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ReceitaDialog open={dialogOpen} onOpenChange={setDialogOpen} form={form} setForm={setForm} onSave={handleSave} isEditing={!!editingId} tipo="assessoria" />
    </div>
  );
}

/* ── Sistema Tab com CRUD ── */
interface SistemaLocal {
  id: string;
  franqueadoNome: string;
  valor: number;
  status: "Pago" | "A Receber" | "Atrasado";
}

function SistemaTab({ mes }: { mes: string }) {
  const receitas = getReceitasForMonth(mes).filter(r => r.tipo === "Sistema");
  const { toast } = useToast();

  const [localReceitas, setLocalReceitas] = useState<SistemaLocal[]>(() =>
    receitas.map(r => ({ id: r.id, franqueadoNome: r.clienteNome || "", valor: r.valorBruto, status: "Pago" as const }))
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ franqueadoNome: "", valor: 250, status: "A Receber" as SistemaLocal["status"] });

  const openCreate = () => { setEditingId(null); setForm({ franqueadoNome: "", valor: 250, status: "A Receber" }); setDialogOpen(true); };
  const openEdit = (r: SistemaLocal) => { setEditingId(r.id); setForm({ franqueadoNome: r.franqueadoNome, valor: r.valor, status: r.status }); setDialogOpen(true); };
  const handleSave = () => {
    if (editingId) {
      setLocalReceitas(prev => prev.map(r => r.id === editingId ? { ...r, ...form } : r));
      toast({ title: "Atualizado" });
    } else {
      setLocalReceitas(prev => [...prev, { id: `ns-${Date.now()}`, ...form }]);
      toast({ title: "Adicionado" });
    }
    setDialogOpen(false);
  };
  const handleDelete = (id: string) => { setLocalReceitas(prev => prev.filter(r => r.id !== id)); toast({ title: "Excluído" }); };

  const statusColor = (s: string) => {
    if (s === "Pago") return "bg-emerald-500/15 text-emerald-500";
    if (s === "Atrasado") return "bg-red-500/15 text-red-500";
    return "bg-yellow-500/15 text-yellow-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <KpiCard label="Total Sistema" value={formatBRL(localReceitas.reduce((s, r) => s + r.valor, 0))} sublabel={`${localReceitas.length} franqueados`} />
        <Button size="sm" onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Nova Receita</Button>
      </div>
      <div className="glass-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Franqueado</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {localReceitas.map(r => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="py-3 px-4 text-foreground font-medium">{r.franqueadoNome}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(r.valor)}</td>
                <td className="py-3 px-4 text-center"><span className={`text-xs px-2 py-0.5 rounded ${statusColor(r.status)}`}>{r.status}</span></td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Editar" : "Nova"} Receita Sistema</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Franqueado</label>
              <select value={form.franqueadoNome} onChange={e => setForm({ ...form, franqueadoNome: e.target.value })}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground">
                <option value="">Selecione...</option>
                {franqueados.map(f => <option key={f.id} value={f.nomeUnidade}>{f.nomeUnidade}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Valor (R$)</label>
              <input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: Number(e.target.value) })}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as SistemaLocal["status"] })}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground">
                <option value="A Receber">A Receber</option>
                <option value="Pago">Pago</option>
                <option value="Atrasado">Atrasado</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Venda de Franquia com CRUD ── */
interface VendaFranquiaLocal {
  id: string;
  nome: string;
  valor: number;
  status: "Pago" | "Pendente" | "Parcial";
  contrato: string;
  data: string;
  onboarding: string;
}

function VendaFranquiaTab() {
  const { toast } = useToast();
  const [localVendas, setLocalVendas] = useState<VendaFranquiaLocal[]>(() =>
    franqueados.map(f => ({
      id: f.id, nome: f.nomeUnidade, valor: 15000, status: "Pago" as const,
      contrato: "Ativo", data: "2025-06-01", onboarding: "Concluído",
    }))
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const emptyForm: Omit<VendaFranquiaLocal, "id"> = { nome: "", valor: 15000, status: "Pendente", contrato: "", data: "", onboarding: "Pendente" };
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (v: VendaFranquiaLocal) => { setEditingId(v.id); setForm({ nome: v.nome, valor: v.valor, status: v.status, contrato: v.contrato, data: v.data, onboarding: v.onboarding }); setDialogOpen(true); };
  const handleSave = () => {
    if (editingId) {
      setLocalVendas(prev => prev.map(v => v.id === editingId ? { ...v, ...form } : v));
      toast({ title: "Atualizado" });
    } else {
      setLocalVendas(prev => [...prev, { id: `vf-${Date.now()}`, ...form }]);
      toast({ title: "Adicionado" });
    }
    setDialogOpen(false);
  };
  const handleDelete = (id: string) => { setLocalVendas(prev => prev.filter(v => v.id !== id)); toast({ title: "Excluído" }); };

  const statusColor = (s: string) => {
    if (s === "Pago") return "bg-emerald-500/15 text-emerald-500";
    if (s === "Parcial") return "bg-yellow-500/15 text-yellow-500";
    return "bg-red-500/15 text-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="glass-card p-4 border border-primary/20 flex-1 mr-4">
          <p className="text-sm text-muted-foreground">🔗 Preparado para integração futura com módulo Onboarding</p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-2 shrink-0"><Plus className="w-4 h-4" /> Nova Venda</Button>
      </div>
      <div className="glass-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Franqueado</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status Pgto</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Contrato</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Data</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Onboarding</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {localVendas.map(v => (
              <tr key={v.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="py-3 px-4 text-foreground font-medium">{v.nome}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(v.valor)}</td>
                <td className="py-3 px-4 text-center"><span className={`text-xs px-2 py-0.5 rounded ${statusColor(v.status)}`}>{v.status}</span></td>
                <td className="py-3 px-4 text-center text-xs text-foreground">{v.contrato}</td>
                <td className="py-3 px-4 text-center text-xs text-muted-foreground">{v.data}</td>
                <td className="py-3 px-4 text-center text-xs text-foreground">{v.onboarding}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Editar" : "Nova"} Venda de Franquia</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Franqueado</label>
              <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Valor (R$)</label>
                <input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: Number(e.target.value) })}
                  className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Status Pagamento</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as VendaFranquiaLocal["status"] })}
                  className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground">
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                  <option value="Parcial">Parcial</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Contrato</label>
                <input value={form.contrato} onChange={e => setForm({ ...form, contrato: e.target.value })}
                  className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Data</label>
                <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })}
                  className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Onboarding</label>
              <select value={form.onboarding} onChange={e => setForm({ ...form, onboarding: e.target.value })}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground">
                <option value="Pendente">Pendente</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Dialog reutilizável para receita Assessoria/SaaS ── */
function ReceitaDialog({ open, onOpenChange, form, setForm, onSave, isEditing, tipo }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: Omit<ReceitaLocal, "id">;
  setForm: (f: Omit<ReceitaLocal, "id">) => void;
  onSave: () => void;
  isEditing: boolean;
  tipo: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{isEditing ? "Editar" : "Nova"} Receita</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Cliente</label>
            <input value={form.clienteNome} onChange={e => setForm({ ...form, clienteNome: e.target.value })}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Valor (R$)</label>
              <input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: Number(e.target.value) })}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Origem</label>
              <select value={form.origem} onChange={e => setForm({ ...form, origem: e.target.value })}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground">
                <option value="Venda Interna">Venda Interna</option>
                <option value="Franqueado">Franqueado</option>
                <option value="Parceiro">Parceiro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ReceitaLocal["status"] })}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground">
                <option value="A Receber">A Receber</option>
                <option value="Recebido">Recebido</option>
                <option value="Atrasado">Atrasado</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">NF Emitida</label>
              <select value={form.nfEmitida ? "sim" : "nao"} onChange={e => setForm({ ...form, nfEmitida: e.target.value === "sim" })}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground">
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.geraRepasse} onChange={e => setForm({ ...form, geraRepasse: e.target.checked })}
                className="rounded border-border" />
              <label className="text-xs text-muted-foreground">Gera repasse</label>
            </div>
            {form.geraRepasse && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">% Repasse</label>
                <input type="number" value={form.percentualRepasse} onChange={e => setForm({ ...form, percentualRepasse: Number(e.target.value) })}
                  className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground min-h-[60px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave}>{isEditing ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
