import { useState } from "react";
import { getDespesasForMonth, getFolhaForMonth, parcelas } from "@/data/mockData";
import { KpiCard } from "@/components/KpiCard";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLORS = [
  "hsl(355, 78%, 56%)", "hsl(217, 91%, 60%)", "hsl(25, 95%, 53%)",
  "hsl(262, 83%, 58%)", "hsl(45, 93%, 47%)", "hsl(142, 71%, 45%)",
  "hsl(180, 60%, 45%)",
];

const categorias = ["Todas", "Pessoas", "Plataformas", "Estrutura", "Empréstimos", "Investimentos", "Eventos", "Treinamentos"] as const;

export default function FinanceiroDespesas() {
  const [mes, setMes] = useState("2026-02");
  const [catFiltro, setCatFiltro] = useState<string>("Todas");

  const despesas = getDespesasForMonth(mes);
  const folha = getFolhaForMonth(mes);
  const filtered = catFiltro === "Todas" ? despesas : despesas.filter(d => d.categoria === catFiltro);

  const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);
  const totalFolha = folha.total;
  const totalInvestimentos = parcelas.filter(p => p.status === "Ativo" && p.tipo === "Investimento" && p.inicio <= mes + "-31").reduce((s, p) => s + p.valorMensal, 0);
  const clientesAtivos = 20; // approximation
  const custoMedioPorCliente = clientesAtivos > 0 ? totalDespesas / clientesAtivos : 0;

  const porCategoria: Record<string, number> = {};
  despesas.forEach(d => { porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + d.valor; });
  const pieData = Object.entries(porCategoria).map(([name, value]) => ({ name, value }));

  const despesasFixas = despesas.filter(d => d.recorrente).reduce((s, d) => s + d.valor, 0);
  const despesasVariaveis = totalDespesas - despesasFixas;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro • Despesas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão completa de custos</p>
        </div>
        <select value={mes} onChange={(e) => setMes(e.target.value)} className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm">
          <option value="2026-01">Jan/2026</option>
          <option value="2026-02">Fev/2026</option>
          <option value="2026-03">Mar/2026</option>
          <option value="2026-04">Abr/2026</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Total Despesas" value={formatBRL(totalDespesas)} />
        <KpiCard label="Despesas Fixas" value={formatBRL(despesasFixas)} />
        <KpiCard label="Despesas Variáveis" value={formatBRL(despesasVariaveis)} />
        <KpiCard label="Total Folha" value={formatBRL(totalFolha)} sublabel={`Op: ${formatBRL(folha.operacional)} | PL: ${formatBRL(folha.proLabore)}`} />
        <KpiCard label="Investimentos" value={formatBRL(totalInvestimentos)} />
        <KpiCard label="Custo/Cliente" value={formatBRL(custoMedioPorCliente)} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Despesa por Categoria</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => formatBRL(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Despesas por Categoria (Barras)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pieData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" width={100} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="value" name="Valor" radius={[0, 4, 4, 0]}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categorias.map(c => (
          <button key={c} onClick={() => setCatFiltro(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              catFiltro === c ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >{c}</button>
        ))}
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
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-4"><span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{d.categoria}</span></td>
                <td className="py-3 px-4 text-foreground">{d.subcategoria}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(d.valor)}</td>
                <td className="py-3 px-4 text-center text-muted-foreground text-xs">{d.recorrente ? "Fixa" : "Variável"}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded ${d.status === "Pago" ? "bg-kpi-positive/15 text-kpi-positive" : "bg-chart-orange/15 text-chart-orange"}`}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-secondary/20">
              <td colSpan={2} className="py-3 px-4 font-semibold text-foreground">Total</td>
              <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(filtered.reduce((s, d) => s + d.valor, 0))}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
