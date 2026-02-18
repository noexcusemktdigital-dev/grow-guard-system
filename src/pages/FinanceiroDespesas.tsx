import { useState } from "react";
import { getDespesasForMonth, getFolhaForMonth, parcelas, type Despesa } from "@/data/mockData";
import { KpiCard } from "@/components/KpiCard";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLORS = [
  "hsl(355, 78%, 56%)", "hsl(217, 91%, 60%)", "hsl(25, 95%, 53%)",
  "hsl(262, 83%, 58%)", "hsl(45, 93%, 47%)", "hsl(142, 71%, 45%)",
  "hsl(180, 60%, 45%)",
];

const categorias = ["Todas", "Pessoas", "Plataformas", "Estrutura", "Empréstimos", "Investimentos", "Eventos", "Treinamentos", "Outros"] as const;
const statusOptions = ["Previsto", "Pago", "Atrasado", "Cancelado"] as const;
const tipoOptions = ["Fixa", "Variável"] as const;

const emptyDespesa: Omit<Despesa, "id"> = {
  mes: "2026-02", categoria: "Plataformas", subcategoria: "", recorrente: true,
  valor: 0, vencimento: 1, status: "Previsto", notas: "",
};

export default function FinanceiroDespesas() {
  const [mes, setMes] = useState("2026-02");
  const [catFiltro, setCatFiltro] = useState<string>("Todas");
  const [statusFiltro, setStatusFiltro] = useState<string>("Todos");
  const [tipoFiltro, setTipoFiltro] = useState<string>("Todos");

  // Local CRUD state
  const [extraDespesas, setExtraDespesas] = useState<Despesa[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [editedDespesas, setEditedDespesas] = useState<Map<string, Partial<Despesa>>>(new Map());

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [form, setForm] = useState(emptyDespesa);

  const baseDespesas = getDespesasForMonth(mes);
  const folha = getFolhaForMonth(mes);

  // Merge base + extras, remove deleted, apply edits
  const allDespesas = [
    ...baseDespesas.filter(d => !deletedIds.has(d.id)).map(d => {
      const edits = editedDespesas.get(d.id);
      return edits ? { ...d, ...edits } : d;
    }),
    ...extraDespesas.filter(d => d.mes === mes && !deletedIds.has(d.id)),
  ];

  const filtered = allDespesas
    .filter(d => catFiltro === "Todas" || d.categoria === catFiltro)
    .filter(d => statusFiltro === "Todos" || d.status === statusFiltro)
    .filter(d => tipoFiltro === "Todos" || (tipoFiltro === "Fixa" ? d.recorrente : !d.recorrente));

  const totalDespesas = allDespesas.reduce((s, d) => s + d.valor, 0);
  const despesasFixas = allDespesas.filter(d => d.recorrente).reduce((s, d) => s + d.valor, 0);
  const despesasVariaveis = totalDespesas - despesasFixas;
  const totalFolha = folha.total;

  const top5 = [...allDespesas].sort((a, b) => b.valor - a.valor).slice(0, 5);

  const porCategoria: Record<string, number> = {};
  allDespesas.forEach(d => { porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + d.valor; });
  const pieData = Object.entries(porCategoria).map(([name, value]) => ({ name, value }));

  // 6-month evolution
  const evoMeses = ["2026-01", "2026-02", "2026-03", "2026-04"];
  const evoData = evoMeses.map(m => {
    const d = getDespesasForMonth(m);
    return { mes: m === "2026-01" ? "Jan" : m === "2026-02" ? "Fev" : m === "2026-03" ? "Mar" : "Abr", total: d.reduce((s, x) => s + x.valor, 0) };
  });

  const openCreate = () => {
    setEditingDespesa(null);
    setForm({ ...emptyDespesa, mes });
    setDialogOpen(true);
  };

  const openEdit = (d: Despesa) => {
    setEditingDespesa(d);
    setForm({ mes: d.mes, categoria: d.categoria, subcategoria: d.subcategoria, recorrente: d.recorrente, valor: d.valor, vencimento: d.vencimento, status: d.status, notas: d.notas });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingDespesa) {
      // Edit existing
      if (baseDespesas.find(d => d.id === editingDespesa.id)) {
        setEditedDespesas(prev => new Map(prev).set(editingDespesa.id, { ...form }));
      } else {
        setExtraDespesas(prev => prev.map(d => d.id === editingDespesa.id ? { ...d, ...form } : d));
      }
    } else {
      // Create new
      const newDespesa: Despesa = { id: `custom-${Date.now()}`, ...form } as Despesa;
      setExtraDespesas(prev => [...prev, newDespesa]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setDeletedIds(prev => new Set(prev).add(id));
  };

  const handleStatusChange = (id: string, newStatus: Despesa["status"]) => {
    if (baseDespesas.find(d => d.id === id)) {
      setEditedDespesas(prev => new Map(prev).set(id, { ...(prev.get(id) || {}), status: newStatus }));
    } else {
      setExtraDespesas(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro • Despesas</h1>
          <p className="text-sm text-muted-foreground mt-1">Logbook CRUD — Gestão completa de custos</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={mes} onChange={(e) => setMes(e.target.value)} className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm">
            <option value="2026-01">Jan/2026</option>
            <option value="2026-02">Fev/2026</option>
            <option value="2026-03">Mar/2026</option>
            <option value="2026-04">Abr/2026</option>
          </select>
          <Button size="sm" onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        </div>
      </div>

      {/* Mini Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total do Mês" value={formatBRL(totalDespesas)} />
        <KpiCard label="Despesas Fixas" value={formatBRL(despesasFixas)} />
        <KpiCard label="Despesas Variáveis" value={formatBRL(despesasVariaveis)} />
        <KpiCard label="Folha Total" value={formatBRL(totalFolha)} sublabel={`Op: ${formatBRL(folha.operacional)} | PL: ${formatBRL(folha.proLabore)}`} />
        <KpiCard label="Top 1 Despesa" value={top5[0] ? formatBRL(top5[0].valor) : "—"} sublabel={top5[0]?.subcategoria || ""} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Despesa por Categoria</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => formatBRL(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Evolução Despesas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={evoData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="total" name="Total" fill="hsl(355,78%,56%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Folha Card */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">Folha de Pagamento</h3>
        <div className="grid grid-cols-3 gap-4">
          <div><span className="text-xs text-muted-foreground">Operacional</span><p className="text-lg font-bold text-foreground">{formatBRL(folha.operacional)}</p></div>
          <div><span className="text-xs text-muted-foreground">Pró-labore</span><p className="text-lg font-bold text-foreground">{formatBRL(folha.proLabore)}</p></div>
          <div><span className="text-xs text-muted-foreground">Total</span><p className="text-lg font-bold text-foreground">{formatBRL(folha.total)}</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Categoria</span>
          <div className="flex gap-1 flex-wrap">
            {categorias.map(c => (
              <button key={c} onClick={() => setCatFiltro(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${catFiltro === c ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >{c}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Status</span>
          <div className="flex gap-1">
            {["Todos", ...statusOptions].map(s => (
              <button key={s} onClick={() => setStatusFiltro(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFiltro === s ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >{s}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Tipo</span>
          <div className="flex gap-1">
            {["Todos", ...tipoOptions].map(t => (
              <button key={t} onClick={() => setTipoFiltro(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tipoFiltro === t ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Categoria</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Subcategoria</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Tipo</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Vcto</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-4"><span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{d.categoria}</span></td>
                <td className="py-3 px-4 text-foreground">{d.subcategoria}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(d.valor)}</td>
                <td className="py-3 px-4 text-center text-muted-foreground text-xs">{d.recorrente ? "Fixa" : "Variável"}</td>
                <td className="py-3 px-4 text-center text-muted-foreground text-xs">Dia {d.vencimento}</td>
                <td className="py-3 px-4 text-center">
                  <select value={d.status} onChange={(e) => handleStatusChange(d.id, e.target.value as Despesa["status"])}
                    className={`text-xs px-2 py-0.5 rounded border-0 cursor-pointer ${
                      d.status === "Pago" ? "bg-emerald-500/15 text-emerald-500" :
                      d.status === "Atrasado" ? "bg-red-500/15 text-red-500" :
                      d.status === "Cancelado" ? "bg-muted text-muted-foreground" :
                      "bg-yellow-500/15 text-yellow-500"
                    }`}>
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-secondary/20">
              <td colSpan={2} className="py-3 px-4 font-semibold text-foreground">Total ({filtered.length} itens)</td>
              <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(filtered.reduce((s, d) => s + d.valor, 0))}</td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDespesa ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Mês</label>
                <select value={form.mes} onChange={e => setForm({ ...form, mes: e.target.value })} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground">
                  <option value="2026-01">Jan/2026</option>
                  <option value="2026-02">Fev/2026</option>
                  <option value="2026-03">Mar/2026</option>
                  <option value="2026-04">Abr/2026</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Categoria</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value as Despesa["categoria"] })} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground">
                  {categorias.filter(c => c !== "Todas").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Subcategoria</label>
              <input value={form.subcategoria} onChange={e => setForm({ ...form, subcategoria: e.target.value })}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" placeholder="Ex: CapCut, Aluguel..." />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Valor (R$)</label>
                <input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: Number(e.target.value) })}
                  className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Vencimento</label>
                <input type="number" value={form.vencimento} onChange={e => setForm({ ...form, vencimento: Number(e.target.value) })} min={1} max={31}
                  className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Despesa["status"] })} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground">
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.recorrente} onChange={() => setForm({ ...form, recorrente: !form.recorrente })} className="rounded border-border accent-primary" />
              <span className="text-sm text-foreground">Recorrente (Fixa)</span>
            </label>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Observação</label>
              <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingDespesa ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
