import { useState } from "react";
import { getReceitasForMonth, getMonthSummary, clientes, franqueados, type Cliente, type Receita } from "@/data/mockData";
import { KpiCard } from "@/components/KpiCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Plus, Pencil, Trash2, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLORS = [
  "hsl(142, 71%, 45%)", "hsl(217, 91%, 60%)", "hsl(25, 95%, 53%)",
  "hsl(262, 83%, 58%)", "hsl(45, 93%, 47%)",
];

const statusRecOptions = ["A Receber", "Recebido", "Atrasado", "Cancelado"] as const;
const tipoRecOptions = ["Recorrente", "Unitária", "Franquia", "SaaS", "Sistema"] as const;
const origemOptions = ["Venda Interna", "Franqueado", "Parceiro"] as const;
const produtoOptions = ["Assessoria Noexcuse", "SaaS", "Sistema"] as const;

export default function FinanceiroReceitas() {
  const [mes, setMes] = useState("2026-02");

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro • Receitas</h1>
          <p className="text-sm text-muted-foreground mt-1">Logbook + Clientes</p>
        </div>
        <select value={mes} onChange={(e) => setMes(e.target.value)} className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm">
          <option value="2026-01">Jan/2026</option>
          <option value="2026-02">Fev/2026</option>
          <option value="2026-03">Mar/2026</option>
        </select>
      </div>

      <Tabs defaultValue="receitas" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="receitas">
          <ReceitasTab mes={mes} />
        </TabsContent>

        <TabsContent value="clientes">
          <ClientesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Receitas Tab ── */
function ReceitasTab({ mes }: { mes: string }) {
  const receitas = getReceitasForMonth(mes);
  const summary = getMonthSummary(mes);
  const [tipoFiltro, setTipoFiltro] = useState<string>("Todas");
  const [editedStatus, setEditedStatus] = useState<Map<string, string>>(new Map());
  const [editedNF, setEditedNF] = useState<Map<string, boolean>>(new Map());

  const filtered = tipoFiltro === "Todas" ? receitas : receitas.filter(r => r.tipo === tipoFiltro);

  const porTipo = Object.entries(summary.receitaPorTipo).map(([name, value]) => ({ name, value }));

  const getStatus = (r: Receita) => {
    if (editedStatus.has(r.id)) return editedStatus.get(r.id)!;
    if (r.pago) return "Recebido";
    return "A Receber";
  };

  const getNF = (r: Receita) => editedNF.has(r.id) ? editedNF.get(r.id)! : r.notaFiscalEmitida;

  const handleDarBaixa = (id: string) => {
    setEditedStatus(prev => new Map(prev).set(id, "Recebido"));
  };

  const handleMarcarNF = (id: string) => {
    setEditedNF(prev => new Map(prev).set(id, true));
  };

  const statusColor = (s: string) => {
    if (s === "Recebido") return "bg-emerald-500/15 text-emerald-500";
    if (s === "Atrasado") return "bg-red-500/15 text-red-500";
    if (s === "Cancelado") return "bg-muted text-muted-foreground";
    return "bg-yellow-500/15 text-yellow-500";
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receita Bruta" value={formatBRL(summary.receitaBruta)} trend="up" />
        <KpiCard label="(-) Repasse" value={formatBRL(summary.totalRepasse)} />
        <KpiCard label="Receita Líquida" value={formatBRL(summary.receitaLiquida)} trend="up" accent />
        <KpiCard label="NF Pendentes" value={String(summary.nfNaoEmitidas)} trend={summary.nfNaoEmitidas > 0 ? "down" : "up"} />
      </div>

      {/* Chart */}
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

        <div className="glass-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground mb-2">Status de Receitas</h3>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Recebidos</span>
            <span className="text-sm font-semibold text-emerald-500">{receitas.filter(r => r.pago).length}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">A Receber</span>
            <span className="text-sm font-semibold text-yellow-500">{receitas.filter(r => !r.pago).length}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">NF Emitida</span>
            <span className="text-sm font-semibold text-foreground">{receitas.filter(r => r.notaFiscalEmitida).length}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Geram Repasse</span>
            <span className="text-sm font-semibold text-primary">{receitas.filter(r => r.aplicaRepasse).length}</span>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["Todas", ...tipoRecOptions].map(t => (
          <button key={t} onClick={() => setTipoFiltro(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tipoFiltro === t ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >{t}</button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Cliente</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Tipo</th>
              <th className="text-right py-3 px-3 text-muted-foreground font-medium">Valor</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Status</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">NF</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Repasse</th>
              <th className="text-right py-3 px-3 text-muted-foreground font-medium">Líquido</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const status = getStatus(r);
              const nf = getNF(r);
              return (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-3 text-foreground font-medium">{r.clienteNome}</td>
                  <td className="py-3 px-3"><span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{r.tipo}</span></td>
                  <td className="py-3 px-3 text-right text-foreground">{formatBRL(r.valorBruto)}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColor(status)}`}>{status}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${nf ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
                      {nf ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {r.aplicaRepasse ? <span className="text-primary text-xs font-medium">{r.percentualRepasse}%</span> : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-foreground">{formatBRL(r.valorLiquido)}</td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {status !== "Recebido" && (
                        <button onClick={() => handleDarBaixa(r.id)} title="Dar baixa" className="p-1.5 rounded hover:bg-emerald-500/10 transition-colors text-muted-foreground hover:text-emerald-500">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!nf && (
                        <button onClick={() => handleMarcarNF(r.id)} title="Marcar NF emitida" className="p-1.5 rounded hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary">
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-secondary/20">
              <td colSpan={2} className="py-3 px-3 font-semibold text-foreground">Total</td>
              <td className="py-3 px-3 text-right font-bold text-foreground">{formatBRL(filtered.reduce((s, r) => s + r.valorBruto, 0))}</td>
              <td colSpan={3} />
              <td className="py-3 px-3 text-right font-bold text-foreground">{formatBRL(filtered.reduce((s, r) => s + r.valorLiquido, 0))}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ── Clientes Tab ── */
function ClientesTab() {
  const [origemFiltro, setOrigemFiltro] = useState<string>("todos");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [localClientes, setLocalClientes] = useState<Cliente[]>([...clientes]);

  const emptyCliente: Omit<Cliente, "id"> = {
    nome: "", valor: 0, status: "Ativo", tipoReceita: "Recorrente", origem: "Venda Interna",
    produto: "Assessoria Noexcuse", geraRepasse: false, percentualRepasse: 0, inicio: "2026-02-01",
    notaFiscalEmitida: false, pago: false, observacoes: "",
  };
  const [form, setForm] = useState(emptyCliente);

  const filtered = localClientes.filter(c => {
    if (origemFiltro !== "todos" && c.origem !== origemFiltro) return false;
    if (tipoFiltro !== "todos" && c.tipoReceita !== tipoFiltro) return false;
    return true;
  });

  const statusColor = (s: string) => {
    if (s === "Ativo") return "bg-emerald-500/15 text-emerald-500";
    if (s === "Pausado") return "bg-yellow-500/15 text-yellow-500";
    return "bg-red-500/15 text-red-500";
  };

  const openCreate = () => {
    setEditingCliente(null);
    setForm(emptyCliente);
    setDialogOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditingCliente(c);
    setForm({ nome: c.nome, valor: c.valor, status: c.status, tipoReceita: c.tipoReceita, origem: c.origem, produto: c.produto, geraRepasse: c.geraRepasse, percentualRepasse: c.percentualRepasse, inicio: c.inicio, notaFiscalEmitida: c.notaFiscalEmitida, pago: c.pago, observacoes: c.observacoes, franqueadoVinculado: c.franqueadoVinculado });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingCliente) {
      setLocalClientes(prev => prev.map(c => c.id === editingCliente.id ? { ...c, ...form } : c));
    } else {
      setLocalClientes(prev => [...prev, { id: `c-${Date.now()}`, ...form } as Cliente]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setLocalClientes(prev => prev.filter(c => c.id !== id));
  };

  const handleStatusChange = (id: string, newStatus: Cliente["status"]) => {
    setLocalClientes(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  // Auto-set geraRepasse based on origem
  const handleOrigemChange = (origem: Cliente["origem"]) => {
    const geraRepasse = origem === "Franqueado" || origem === "Parceiro";
    const percentualRepasse = origem === "Franqueado" ? 20 : origem === "Parceiro" ? 10 : 0;
    setForm({ ...form, origem, geraRepasse, percentualRepasse });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{localClientes.length} clientes • Total: {formatBRL(localClientes.filter(c => c.status === "Ativo").reduce((s, c) => s + c.valor, 0))}/mês</p>
        <Button size="sm" onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Novo Cliente</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Origem</span>
          <div className="flex gap-1">
            {["todos", "Venda Interna", "Franqueado", "Parceiro"].map(f => (
              <button key={f} onClick={() => setOrigemFiltro(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${origemFiltro === f ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >{f}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Tipo</span>
          <div className="flex gap-1">
            {["todos", "Recorrente", "Unitária", "Sistema"].map(f => (
              <button key={f} onClick={() => setTipoFiltro(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tipoFiltro === f ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >{f}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Cliente</th>
              <th className="text-right py-3 px-3 text-muted-foreground font-medium">Valor</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Tipo</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Origem</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Repasse</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Status</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-3 text-foreground font-medium">{c.nome}</td>
                <td className="py-3 px-3 text-right text-foreground">{c.valor > 0 ? formatBRL(c.valor) : <span className="text-muted-foreground text-xs">A definir</span>}</td>
                <td className="py-3 px-3 text-center"><span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{c.tipoReceita}</span></td>
                <td className="py-3 px-3 text-center text-xs text-muted-foreground">{c.origem}</td>
                <td className="py-3 px-3 text-center">
                  {c.geraRepasse ? <span className="text-primary text-xs font-medium">{c.percentualRepasse}%</span> : <span className="text-muted-foreground text-xs">—</span>}
                </td>
                <td className="py-3 px-3 text-center">
                  <select value={c.status} onChange={e => handleStatusChange(c.id, e.target.value as Cliente["status"])}
                    className={`text-xs px-2 py-0.5 rounded border-0 cursor-pointer ${statusColor(c.status)}`}>
                    <option value="Ativo">Ativo</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Nome</label>
              <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Mensalidade (R$)</label>
                <input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: Number(e.target.value) })}
                  className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Produto</label>
                <select value={form.produto} onChange={e => setForm({ ...form, produto: e.target.value as Cliente["produto"] })} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground">
                  {produtoOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Tipo Receita</label>
                <select value={form.tipoReceita} onChange={e => setForm({ ...form, tipoReceita: e.target.value as Cliente["tipoReceita"] })} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground">
                  <option value="Recorrente">Recorrente</option>
                  <option value="Unitária">Unitária</option>
                  <option value="Sistema">Sistema</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Origem</label>
                <select value={form.origem} onChange={e => handleOrigemChange(e.target.value as Cliente["origem"])} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground">
                  {origemOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            {form.geraRepasse && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">% Repasse</label>
                  <input type="number" value={form.percentualRepasse} onChange={e => setForm({ ...form, percentualRepasse: Number(e.target.value) })}
                    className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Franqueado Vinculado</label>
                  <select value={form.franqueadoVinculado || ""} onChange={e => setForm({ ...form, franqueadoVinculado: e.target.value || undefined })} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground">
                    <option value="">Nenhum</option>
                    {franqueados.map(f => <option key={f.id} value={f.id}>{f.nomeUnidade}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Observações</label>
              <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingCliente ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
