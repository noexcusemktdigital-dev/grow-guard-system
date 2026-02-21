import { useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { AlertCard } from "@/components/AlertCard";
import {
  getMonthSummary, getHistoricalData, parcelas, getActiveClientsForMonth, getReceitasForMonth,
  getBreakEven, getInvestmentSignal, getProjection, getDespesasForMonth, getFolhaForMonth,
  colaboradores, clientes,
} from "@/data/mockData";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { Slider } from "@/components/ui/slider";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PIE_COLORS = [
  "hsl(355, 78%, 56%)", "hsl(217, 91%, 60%)", "hsl(25, 95%, 53%)",
  "hsl(262, 83%, 58%)", "hsl(45, 93%, 47%)", "hsl(142, 71%, 45%)",
  "hsl(0, 0%, 45%)", "hsl(180, 60%, 45%)",
];

const mesesDisponiveis = [
  { value: "2026-01", label: "Jan/2026" },
  { value: "2026-02", label: "Fev/2026" },
  { value: "2026-03", label: "Mar/2026" },
  { value: "2026-04", label: "Abr/2026" },
];

export default function FinanceiroDashboard() {
  const [mesSelecionado, setMesSelecionado] = useState("2026-02");
  const summary = getMonthSummary(mesSelecionado);
  const historicalData = getHistoricalData();
  const receitas = getReceitasForMonth(mesSelecionado);
  const breakEven = getBreakEven();
  const signal = getInvestmentSignal(mesSelecionado);
  const projection = getProjection(1);

  const pieDataDespesas = Object.entries(summary.despesasPorCategoria).map(([name, value]) => ({ name, value }));

  const topClientes = getActiveClientsForMonth(mesSelecionado)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  const proximasParcelas = parcelas
    .filter(p => p.status === "Ativo")
    .sort((a, b) => (a.totalParcelas - a.parcelaAtual) - (b.totalParcelas - b.parcelaAtual));

  // Alertas inteligentes
  const receitasAtrasadas = receitas.filter(r => !r.pago);
  const repassesPendentes = receitas.filter(r => r.aplicaRepasse);
  const semNF = receitas.filter(r => r.pago && !r.notaFiscalEmitida);
  const parcelasProximasFim = proximasParcelas.filter(p => (p.totalParcelas - p.parcelaAtual) <= 3);
  const folhaAumentos = colaboradores.filter(c => c.reajustes.some(r => r.mes > mesSelecionado && r.mes <= "2026-04"));

  // Clientes ativos por tipo
  const clientesAtivos = getActiveClientsForMonth(mesSelecionado);
  const clientesPorProduto: Record<string, number> = {};
  clientesAtivos.forEach(c => { clientesPorProduto[c.produto] = (clientesPorProduto[c.produto] || 0) + 1; });

  const signalConfig = {
    green: { label: "🟢 Pode Investir", bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-500" },
    yellow: { label: "🟡 Cuidado", bg: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-500" },
    red: { label: "🔴 Não Recomendado", bg: "bg-red-500/10 border-red-500/30", text: "text-red-500" },
  };
  const sc = signalConfig[signal];

  const repassePago = receitas.filter(r => r.aplicaRepasse && r.pago);
  const repassePendente = receitas.filter(r => r.aplicaRepasse && !r.pago);
  const totalRepassePago = repassePago.reduce((s, r) => s + r.valorRepasse, 0);
  const totalRepassePendente = repassePendente.reduce((s, r) => s + r.valorRepasse, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro • Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Resumo geral + Projeção Inteligente</p>
        </div>
        <select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} className="bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm">
          {mesesDisponiveis.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {/* ══════════ BLOCO A — RESUMO ══════════ */}

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

      {/* KPIs Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Receita Bruta" value={formatBRL(summary.receitaBruta)} trend="up" />
        <KpiCard label="(-) Repasse Pendente" value={formatBRL(totalRepassePendente)} sublabel={`${repassePendente.length} itens`} />
        <KpiCard label="(-) Repasse Pago" value={formatBRL(totalRepassePago)} sublabel={`${repassePago.length} itens`} />
        <KpiCard label="Receita Líquida" value={formatBRL(summary.receitaLiquida)} trend="up" accent />
        <KpiCard label="Despesas Totais" value={formatBRL(summary.custosDespesas)} sublabel="Fixas + Variáveis" />
      </div>

      {/* KPIs Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Resultado do Mês" value={formatBRL(summary.resultado)} trend={summary.resultado >= 0 ? "up" : "down"} accent />
        <KpiCard label="Caixa Atual" value={formatBRL(summary.caixaAtual)} />
        <KpiCard label="Runway" value={`${summary.runway} meses`} trend={summary.runway > 3 ? "up" : "down"} />
        <KpiCard label="Clientes Ativos" value={String(clientesAtivos.length)} sublabel={Object.entries(clientesPorProduto).map(([k, v]) => `${k}: ${v}`).join(" | ")} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receita Líquida × Despesas (6 meses)</h3>
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

      {/* Resultado Mensal */}
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

      {/* Alertas Inteligentes */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Alertas Inteligentes</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {receitasAtrasadas.length > 0 && (
            <AlertCard type="warning" message={`${receitasAtrasadas.length} receita(s) em atraso — ${formatBRL(receitasAtrasadas.reduce((s, r) => s + r.valorBruto, 0))}`} />
          )}
          {repassesPendentes.length > 0 && (
            <AlertCard type="info" message={`${repassesPendentes.length} repasse(s) pendente(s) — ${formatBRL(repassesPendentes.reduce((s, r) => s + r.valorRepasse, 0))}`} />
          )}
          {semNF.length > 0 && (
            <AlertCard type="warning" message={`${semNF.length} receita(s) recebida(s) sem NF emitida`} />
          )}
          {parcelasProximasFim.map(p => (
            <AlertCard key={p.id} type="clock" message={`${p.nome}: encerra em ${p.totalParcelas - p.parcelaAtual} parcelas`} />
          ))}
          {folhaAumentos.length > 0 && (
            <AlertCard type="warning" message="Folha com aumento programado: Mar (+R$ 3.500) e Abr (+R$ 1.000)" />
          )}
          <AlertCard type="info" message={`Capacidade operacional: ${summary.totalClientes} / ${summary.clientesCapacidade} clientes (${Math.round((summary.totalClientes / summary.clientesCapacidade) * 100)}%)`} />
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
                  <p className="text-xs text-muted-foreground">Restam {p.totalParcelas - p.parcelaAtual}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ BLOCO B — PROJEÇÃO INTELIGENTE ══════════ */}
      <div className="border-t border-border pt-6">
        <h2 className="text-xl font-bold text-foreground mb-1">Projeção Inteligente</h2>
        <p className="text-sm text-muted-foreground mb-6">Projeção automática 6 meses à frente com simulação de cenários</p>

        <ProjecaoInteligente />
      </div>
    </div>
  );
}

/* ── Projeção Inteligente (painel único) ── */
function ProjecaoInteligente() {
  const [novosClientes, setNovosClientes] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(2500);
  const [franquiasMes, setFranquiasMes] = useState(0);
  const [eventosMes, setEventosMes] = useState(false);
  const [contratacao, setContratacao] = useState(false);
  const [custoContratacao, setCustoContratacao] = useState(2500);

  const projection6 = getProjection(6);
  const breakEven = getBreakEven();

  // Simulate
  const simulated = projection6.map((p, i) => {
    const receitaNovos = novosClientes * (i + 1) * ticketMedio;
    const receitaFranquias = franquiasMes * 15000 * (i === 0 ? 1 : 0);
    const custoEventoMes = eventosMes ? 3000 : 0;
    const custoContratacaoMes = contratacao ? custoContratacao : 0;

    const receitaTotal = p.receitaRecorrente + receitaNovos + receitaFranquias;
    const custoTotal = p.folha + p.parcelas + p.eventos + p.impostos + custoEventoMes + custoContratacaoMes;
    const resultado = receitaTotal - custoTotal;

    return { ...p, receitaTotal, custoTotal, resultado, label: p.label };
  });

  const signalSim = simulated[0]?.resultado > 0 ? (simulated[0].resultado / simulated[0].receitaTotal > 0.15 ? "green" : "yellow") : "red";
  const signalColors = { green: "text-emerald-500", yellow: "text-yellow-500", red: "text-red-500" };
  const signalLabels = { green: "🟢 Pode investir", yellow: "🟡 Cuidado", red: "🔴 Não recomendado" };

  const capacidadeAtual = breakEven.clientesAtuais;
  const mesesAteContratar = novosClientes > 0 ? Math.ceil((30 * 0.8 - capacidadeAtual) / novosClientes) : null;

  return (
    <div className="space-y-6">
      {/* Projeção automática 6 meses */}
      <div className="glass-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Mês</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Receita</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Folha</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Parcelas</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Eventos</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Impostos</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {simulated.map(p => (
              <tr key={p.mes} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="py-3 px-4 font-medium text-foreground">{p.label}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(p.receitaTotal)}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(p.folha)}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(p.parcelas)}</td>
                <td className="py-3 px-4 text-right text-foreground">{p.eventos > 0 ? formatBRL(p.eventos) : "—"}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(p.impostos)}</td>
                <td className={`py-3 px-4 text-right font-bold ${p.resultado >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatBRL(p.resultado)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-secondary/20">
              <td className="py-3 px-4 font-semibold text-foreground">Total</td>
              <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(simulated.reduce((s, p) => s + p.receitaTotal, 0))}</td>
              <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(simulated.reduce((s, p) => s + p.folha, 0))}</td>
              <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(simulated.reduce((s, p) => s + p.parcelas, 0))}</td>
              <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(simulated.reduce((s, p) => s + p.eventos, 0))}</td>
              <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(simulated.reduce((s, p) => s + p.impostos, 0))}</td>
              <td className={`py-3 px-4 text-right font-bold ${simulated.reduce((s, p) => s + p.resultado, 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {formatBRL(simulated.reduce((s, p) => s + p.resultado, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h4 className="text-sm font-semibold text-foreground mb-4">Caixa Projetado</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={simulated}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => formatBRL(v)} />
              <Line type="monotone" dataKey="receitaTotal" stroke="hsl(142,71%,45%)" strokeWidth={2} name="Receita" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="custoTotal" stroke="hsl(355,78%,56%)" strokeWidth={2} name="Custos" dot={{ r: 3 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h4 className="text-sm font-semibold text-foreground mb-4">Lucro Projetado</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={simulated}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="resultado" name="Resultado" radius={[4, 4, 0, 0]}>
                {simulated.map((e, i) => <Cell key={i} fill={e.resultado >= 0 ? "hsl(217,91%,60%)" : "hsl(355,78%,56%)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Controles de Simulação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 space-y-5">
          <h4 className="text-sm font-semibold text-foreground">Simulação — Receita</h4>
          <div>
            <label className="text-xs text-muted-foreground">Crescimento clientes/mês: {novosClientes}</label>
            <Slider value={[novosClientes]} onValueChange={v => setNovosClientes(v[0])} min={0} max={10} step={1} className="mt-2" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Ticket médio (R$)</label>
            <input type="number" value={ticketMedio} onChange={e => setTicketMedio(Number(e.target.value))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Franquias vendidas/mês</label>
            <input type="number" value={franquiasMes} onChange={e => setFranquiasMes(Number(e.target.value))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground mt-1" />
          </div>
        </div>

        <div className="glass-card p-5 space-y-5">
          <h4 className="text-sm font-semibold text-foreground">Simulação — Custos</h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={eventosMes} onChange={() => setEventosMes(!eventosMes)} className="rounded border-border accent-primary" />
            <span className="text-sm text-foreground">Ativar evento mensal (R$ 3.000)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={contratacao} onChange={() => setContratacao(!contratacao)} className="rounded border-border accent-primary" />
            <span className="text-sm text-foreground">Ativar contratação</span>
          </label>
          {contratacao && (
            <div>
              <label className="text-xs text-muted-foreground">Custo contratação (R$)</label>
              <input type="number" value={custoContratacao} onChange={e => setCustoContratacao(Number(e.target.value))}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground mt-1" />
            </div>
          )}
          <div className="border-t border-border pt-4 space-y-2">
            <p className={`text-sm font-bold ${signalColors[signalSim as keyof typeof signalColors]}`}>
              {signalLabels[signalSim as keyof typeof signalLabels]}
            </p>
            {mesesAteContratar !== null && mesesAteContratar > 0 && (
              <p className="text-xs text-muted-foreground">🕐 Quando contratar? Em ~{mesesAteContratar} meses (capacidade 80%)</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
