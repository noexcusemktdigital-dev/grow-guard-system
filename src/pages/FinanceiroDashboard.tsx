import { useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { AlertCard } from "@/components/AlertCard";
import { getMonthSummary, getHistoricalData, parcelas, getActiveClientsForMonth, getReceitasForMonth, getBreakEven, getInvestmentSignal, getProjection } from "@/data/mockData";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PIE_COLORS = [
  "hsl(355, 78%, 56%)", "hsl(217, 91%, 60%)", "hsl(25, 95%, 53%)",
  "hsl(262, 83%, 58%)", "hsl(45, 93%, 47%)", "hsl(142, 71%, 45%)",
  "hsl(0, 0%, 45%)", "hsl(180, 60%, 45%)",
];

export default function FinanceiroDashboard() {
  const [mesSelecionado] = useState("2026-02");
  const summary = getMonthSummary(mesSelecionado);
  const historicalData = getHistoricalData();
  const receitas = getReceitasForMonth(mesSelecionado);
  const breakEven = getBreakEven();
  const signal = getInvestmentSignal(mesSelecionado);
  const projection = getProjection(1);

  const pieDataDespesas = Object.entries(summary.despesasPorCategoria).map(([name, value]) => ({ name, value }));
  const pieDataReceitas = Object.entries(summary.receitaPorTipo).map(([name, value]) => ({ name, value }));

  const topClientes = getActiveClientsForMonth(mesSelecionado)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  const proximasParcelas = parcelas
    .filter(p => p.status === "Ativo")
    .sort((a, b) => (a.totalParcelas - a.parcelaAtual) - (b.totalParcelas - b.parcelaAtual));

  const signalConfig = {
    green: { label: "🟢 Pode Investir", bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-500" },
    yellow: { label: "🟡 Cuidado", bg: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-500" },
    red: { label: "🔴 Não Recomendado", bg: "bg-red-500/10 border-red-500/30", text: "text-red-500" },
  };
  const sc = signalConfig[signal];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro • Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral — Fevereiro 2026</p>
        </div>
      </div>

      {/* Semáforo de Investimento */}
      <div className={`glass-card p-5 border ${sc.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Decisão de Investimento</h3>
          <p className={`text-lg font-bold ${sc.text}`}>{sc.label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Margem: {summary.receitaLiquida > 0 ? ((summary.resultado / summary.receitaLiquida) * 100).toFixed(1) : 0}% • Runway: {summary.runway} meses
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground text-xs">Break-even</p>
            <p className="font-bold text-foreground">{breakEven.clientesNecessarios} clientes</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-xs">Próximo mês</p>
            <p className="font-bold text-foreground">{projection[0] ? formatBRL(projection[0].resultado) : "—"}</p>
          </div>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Receita Bruta" value={formatBRL(summary.receitaBruta)} trend="up" />
        <KpiCard label="(-) Repasse" value={formatBRL(summary.totalRepasse)} sublabel="Franqueados + Parceiros" />
        <KpiCard label="Receita Líquida" value={formatBRL(summary.receitaLiquida)} trend="up" accent />
        <KpiCard label="Custos Operacionais" value={formatBRL(summary.custosDespesas)} />
        <KpiCard label="Investimentos" value={formatBRL(summary.investimentos)} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Impostos" value={formatBRL(summary.impostos)} sublabel="10% s/ NF + folha op." />
        <KpiCard label="Resultado do Mês" value={formatBRL(summary.resultado)} trend={summary.resultado >= 0 ? "up" : "down"} accent />
        <KpiCard label="Caixa Atual" value={formatBRL(summary.caixaAtual)} />
        <KpiCard label="Runway" value={`${summary.runway} meses`} trend={summary.runway > 3 ? "up" : "down"} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receita Líquida × Custos Totais</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => formatBRL(v)} />
              <Line type="monotone" dataKey="receitaLiquida" stroke="hsl(142,71%,45%)" strokeWidth={2} name="Receita Líquida" dot={{ fill: "hsl(142,71%,45%)", r: 3 }} />
              <Line type="monotone" dataKey="custos" stroke="hsl(355,78%,56%)" strokeWidth={2} name="Custos" dot={{ fill: "hsl(355,78%,56%)", r: 3 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Despesas por Categoria</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieDataDespesas} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                {pieDataDespesas.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => formatBRL(v)} />
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
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="resultado" name="Resultado" radius={[4, 4, 0, 0]}>
                {historicalData.map((entry, i) => (
                  <Cell key={i} fill={entry.resultado >= 0 ? "hsl(142,71%,45%)" : "hsl(355,78%,56%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receita por Tipo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieDataReceitas} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                {pieDataReceitas.map((_, i) => <Cell key={i} fill={PIE_COLORS[(i + 3) % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => formatBRL(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Alertas do Mês</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {proximasParcelas.filter(p => (p.totalParcelas - p.parcelaAtual) <= 3).map(p => (
            <AlertCard key={p.id} type="clock" message={`${p.nome}: acaba em ${p.totalParcelas - p.parcelaAtual} parcelas`} />
          ))}
          {summary.inadimplentes > 0 && (
            <AlertCard type="warning" message={`${summary.inadimplentes} cliente(s) inadimplente(s)`} />
          )}
          {summary.nfNaoEmitidas > 0 && (
            <AlertCard type="warning" message={`${summary.nfNaoEmitidas} nota(s) fiscal(is) não emitida(s)`} />
          )}
          {summary.repassePendente > 0 && (
            <AlertCard type="info" message={`${summary.repassePendente} cliente(s) vinculado(s) a repasse`} />
          )}
          <AlertCard type="info" message={`Capacidade: ${summary.clientesCapacidade} clientes | Atuais: ${summary.totalClientes}`} />
          <AlertCard type="warning" message="Folha sobe em Março (+R$ 3.500) e Abril (+R$ 1.000)" />
          <AlertCard type="warning" message="Eventos + Treinamento a partir de Abril (R$ 5.000/mês)" />
        </div>
      </div>

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Top 5 Clientes por Faturamento</h3>
          <div className="space-y-2">
            {topClientes.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                  <span className="text-sm text-foreground">{c.nome}</span>
                  {c.geraRepasse && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                      {c.origem}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-foreground">{formatBRL(c.valor)}</span>
              </div>
            ))}
          </div>
        </div>

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
