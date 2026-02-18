import { useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { AlertCard } from "@/components/AlertCard";
import { getMonthSummary, getHistoricalData, parcelas, getActiveClientsForMonth } from "@/data/mockData";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PIE_COLORS = [
  "hsl(355, 78%, 56%)",   // primary/red
  "hsl(217, 91%, 60%)",   // blue
  "hsl(25, 95%, 53%)",    // orange
  "hsl(262, 83%, 58%)",   // purple
  "hsl(45, 93%, 47%)",    // yellow
  "hsl(142, 71%, 45%)",   // green
  "hsl(0, 0%, 45%)",      // gray
  "hsl(180, 60%, 45%)",   // teal
];

export default function FinanceiroDashboard() {
  const [mesSelecionado] = useState("2026-02");
  const summary = getMonthSummary(mesSelecionado);
  const historicalData = getHistoricalData();

  const pieData = Object.entries(summary.despesasPorCategoria).map(([name, value]) => ({ name, value }));

  const topClientes = getActiveClientsForMonth(mesSelecionado)
    .sort((a, b) => b.mensalidade - a.mensalidade)
    .slice(0, 5);

  const proximasParcelas = parcelas
    .filter(p => p.status === "Ativo")
    .sort((a, b) => a.totalParcelas - a.parcelaAtual - (b.totalParcelas - b.parcelaAtual));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro • Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral — Fevereiro 2026</p>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receita Bruta" value={formatBRL(summary.receitaBruta)} trend="up" />
        <KpiCard label="Repasse Franqueados" value={formatBRL(summary.totalRepasse)} sublabel="20% por cliente franqueado" />
        <KpiCard label="Receita Líquida" value={formatBRL(summary.receitaLiquida)} trend="up" accent />
        <KpiCard label="Impostos" value={formatBRL(summary.impostos)} sublabel="10% s/ faturamento + folha op." />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Custos Fixos" value={formatBRL(summary.custosDespesas)} />
        <KpiCard label="Investimentos do Mês" value={formatBRL(parcelas.reduce((s, p) => s + (p.status === "Ativo" ? p.valorMensal : 0), 0))} />
        <KpiCard label="Resultado" value={formatBRL(summary.resultado)} trend={summary.resultado >= 0 ? "up" : "down"} accent />
        <KpiCard label="Caixa / Runway" value={`${formatBRL(summary.caixaAtual)}`} sublabel={`${summary.runway} meses`} trend={summary.runway > 3 ? "up" : "down"} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receita Líquida × Custos Totais</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,16%)" />
              <XAxis dataKey="mes" tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(0,0%,9%)", border: "1px solid hsl(0,0%,16%)", borderRadius: 8, color: "#fff" }} formatter={(v: number) => formatBRL(v)} />
              <Line type="monotone" dataKey="receitaLiquida" stroke="hsl(142,71%,45%)" strokeWidth={2} name="Receita Líquida" dot={{ fill: "hsl(142,71%,45%)", r: 3 }} />
              <Line type="monotone" dataKey="custos" stroke="hsl(355,78%,56%)" strokeWidth={2} name="Custos" dot={{ fill: "hsl(355,78%,56%)", r: 3 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "hsl(0,0%,55%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Composição de Despesas</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(0,0%,9%)", border: "1px solid hsl(0,0%,16%)", borderRadius: 8, color: "#fff" }} formatter={(v: number) => formatBRL(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Resultado Mensal</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,16%)" />
              <XAxis dataKey="mes" tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(0,0%,9%)", border: "1px solid hsl(0,0%,16%)", borderRadius: 8, color: "#fff" }} formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="resultado" name="Resultado" radius={[4, 4, 0, 0]}>
                {historicalData.map((entry, i) => (
                  <Cell key={i} fill={entry.resultado >= 0 ? "hsl(142,71%,45%)" : "hsl(355,78%,56%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Capacidade + Alertas */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Alertas do Mês</h3>
          <div className="space-y-3">
            <AlertCard type="clock" message={`Móveis Escritório: acaba em ${parcelas[1].totalParcelas - parcelas[1].parcelaAtual} meses`} />
            <AlertCard type="warning" message="Folha sobe em Março (+R$ 1.000) e Abril (+R$ 1.000)" />
            <AlertCard type="warning" message="Eventos + Treinamento a partir de Abril (R$ 5.000/mês)" />
            <AlertCard type="info" message={`Capacidade: ${summary.clientesCapacidade} clientes | Atuais: ${summary.totalClientes}`} />
          </div>
        </div>
      </div>

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top clients */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Clientes que Mais Faturam</h3>
          <div className="space-y-2">
            {topClientes.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                  <span className="text-sm text-foreground">{c.nome}</span>
                  {c.isFranqueado && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">Franqueado</span>}
                </div>
                <span className="text-sm font-semibold text-foreground">{formatBRL(c.mensalidade)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Próximas parcelas */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Próximas Parcelas a Encerrar</h3>
          <div className="space-y-2">
            {proximasParcelas.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <span className="text-sm text-foreground">{p.nome}</span>
                  <span className="text-xs text-muted-foreground ml-2">{p.parcelaAtual}/{p.totalParcelas}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-foreground">{formatBRL(p.valorMensal)}/mês</span>
                  <p className="text-xs text-muted-foreground">Restam {p.totalParcelas - p.parcelaAtual} parcelas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
