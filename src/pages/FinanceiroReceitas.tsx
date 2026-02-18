import { useState } from "react";
import { getReceitasForMonth, getMonthSummary } from "@/data/mockData";
import { KpiCard } from "@/components/KpiCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLORS = [
  "hsl(142, 71%, 45%)", "hsl(217, 91%, 60%)", "hsl(25, 95%, 53%)",
  "hsl(262, 83%, 58%)", "hsl(45, 93%, 47%)",
];

const tipoFiltros = ["Todas", "Recorrente", "Unitária", "Sistema", "Franquia", "SaaS"] as const;

export default function FinanceiroReceitas() {
  const [mes, setMes] = useState("2026-02");
  const [tipoFiltro, setTipoFiltro] = useState<string>("Todas");

  const receitas = getReceitasForMonth(mes);
  const summary = getMonthSummary(mes);
  const filtered = tipoFiltro === "Todas" ? receitas : receitas.filter(r => r.tipo === tipoFiltro);

  const porTipo = Object.entries(summary.receitaPorTipo).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro • Receitas</h1>
          <p className="text-sm text-muted-foreground mt-1">Clientes, Franquias, SaaS e Sistema</p>
        </div>
        <select value={mes} onChange={(e) => setMes(e.target.value)} className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm">
          <option value="2026-01">Jan/2026</option>
          <option value="2026-02">Fev/2026</option>
          <option value="2026-03">Mar/2026</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receita Bruta" value={formatBRL(summary.receitaBruta)} trend="up" />
        <KpiCard label="(-) Repasse" value={formatBRL(summary.totalRepasse)} />
        <KpiCard label="Receita Líquida" value={formatBRL(summary.receitaLiquida)} trend="up" accent />
        <KpiCard label="NF Não Emitidas" value={String(summary.nfNaoEmitidas)} trend={summary.nfNaoEmitidas > 0 ? "down" : "up"} />
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receita por Tipo</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={porTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
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
            <span className="text-sm text-muted-foreground">Pagos</span>
            <span className="text-sm font-semibold text-kpi-positive">{receitas.filter(r => r.pago).length}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Não pagos</span>
            <span className="text-sm font-semibold text-kpi-negative">{receitas.filter(r => !r.pago).length}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">NF Emitida</span>
            <span className="text-sm font-semibold text-foreground">{receitas.filter(r => r.notaFiscalEmitida).length}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">NF Pendente</span>
            <span className="text-sm font-semibold text-kpi-negative">{receitas.filter(r => !r.notaFiscalEmitida).length}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Geram Repasse</span>
            <span className="text-sm font-semibold text-primary">{receitas.filter(r => r.aplicaRepasse).length}</span>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {tipoFiltros.map(t => (
          <button key={t} onClick={() => setTipoFiltro(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tipoFiltro === t ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >{t}</button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tipo</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Pago</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">NF</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Imposto</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Repasse</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Vlr Repasse</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Líquido</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-3 px-4 text-foreground font-medium">{r.clienteNome}</td>
                <td className="py-3 px-4"><span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{r.tipo}</span></td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(r.valorBruto)}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded ${r.pago ? "bg-kpi-positive/15 text-kpi-positive" : "bg-kpi-negative/15 text-kpi-negative"}`}>
                    {r.pago ? "Sim" : "Não"}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded ${r.notaFiscalEmitida ? "bg-kpi-positive/15 text-kpi-positive" : "bg-kpi-negative/15 text-kpi-negative"}`}>
                    {r.notaFiscalEmitida ? "Sim" : "Não"}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-muted-foreground text-xs">{r.geraImposto ? "Sim" : "Não"}</td>
                <td className="py-3 px-4 text-center">
                  {r.aplicaRepasse ? <span className="text-primary text-xs font-medium">{r.percentualRepasse}%</span> : <span className="text-muted-foreground text-xs">—</span>}
                </td>
                <td className="py-3 px-4 text-right text-kpi-negative">{r.valorRepasse > 0 ? formatBRL(r.valorRepasse) : "—"}</td>
                <td className="py-3 px-4 text-right font-medium text-foreground">{formatBRL(r.valorLiquido)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-secondary/20">
              <td colSpan={2} className="py-3 px-4 font-semibold text-foreground">Total</td>
              <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(filtered.reduce((s, r) => s + r.valorBruto, 0))}</td>
              <td colSpan={4} />
              <td className="py-3 px-4 text-right font-bold text-kpi-negative">{formatBRL(filtered.reduce((s, r) => s + r.valorRepasse, 0))}</td>
              <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(filtered.reduce((s, r) => s + r.valorLiquido, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
