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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

  const signalConfig = {
    green: { label: "🟢 Pode Investir", bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-500" },
    yellow: { label: "🟡 Cuidado", bg: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-500" },
    red: { label: "🔴 Não Recomendado", bg: "bg-red-500/10 border-red-500/30", text: "text-red-500" },
  };
  const sc = signalConfig[signal];

  // Repasse breakdown
  const repassePago = receitas.filter(r => r.aplicaRepasse && r.pago);
  const repassePendente = receitas.filter(r => r.aplicaRepasse && !r.pago);
  const totalRepassePago = repassePago.reduce((s, r) => s + r.valorRepasse, 0);
  const totalRepassePendente = repassePendente.reduce((s, r) => s + r.valorRepasse, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro • Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Resumo geral + Projeção</p>
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
        <KpiCard label="Imposto Devido" value={formatBRL(summary.impostos)} sublabel="10% s/ NF + folha op." />
        <KpiCard label="Resultado do Mês" value={formatBRL(summary.resultado)} trend={summary.resultado >= 0 ? "up" : "down"} accent />
        <KpiCard label="Caixa Atual" value={formatBRL(summary.caixaAtual)} />
        <KpiCard label="Runway" value={`${summary.runway} meses`} trend={summary.runway > 3 ? "up" : "down"} />
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
                  <p className="text-xs text-muted-foreground">Restam {p.totalParcelas - p.parcelaAtual}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ BLOCO B — PROJEÇÃO ══════════ */}
      <div className="border-t border-border pt-6">
        <h2 className="text-xl font-bold text-foreground mb-1">Projeção</h2>
        <p className="text-sm text-muted-foreground mb-4">Mês a Mês realizado, Simulação de cenários, Trimestral e Semestral</p>

        <Tabs defaultValue="mes-a-mes" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="mes-a-mes">Mês a Mês</TabsTrigger>
            <TabsTrigger value="simulacao">Simulação</TabsTrigger>
            <TabsTrigger value="trimestral">Trimestral</TabsTrigger>
            <TabsTrigger value="semestral">Semestral</TabsTrigger>
          </TabsList>

          <TabsContent value="mes-a-mes">
            <MesAMesTab />
          </TabsContent>

          <TabsContent value="simulacao">
            <SimulacaoTab />
          </TabsContent>

          <TabsContent value="trimestral">
            <TrimestralTab />
          </TabsContent>

          <TabsContent value="semestral">
            <SemestralTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ── Mês a Mês (Realizado) ── */
function MesAMesTab() {
  const meses = ["2026-01", "2026-02", "2026-03", "2026-04"];
  const labels: Record<string, string> = { "2026-01": "Jan/26", "2026-02": "Fev/26", "2026-03": "Mar/26", "2026-04": "Abr/26" };
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = meses.map(m => {
    const s = getMonthSummary(m);
    return { mes: m, label: labels[m], ...s };
  });

  return (
    <div className="space-y-4">
      <div className="glass-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Mês</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Receita</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Repasse</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Rec. Líquida</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Despesas</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Imposto</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Resultado</th>
              <th className="text-right py-3 px-4 text-muted-foreground font-medium">Caixa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.mes} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setExpanded(expanded === r.mes ? null : r.mes)}>
                <td className="py-3 px-4 font-medium text-foreground">{r.label}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(r.receitaBruta)}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{formatBRL(r.totalRepasse)}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(r.receitaLiquida)}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(r.custosDespesas)}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">{formatBRL(r.impostos)}</td>
                <td className={`py-3 px-4 text-right font-bold ${r.resultado >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatBRL(r.resultado)}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(r.caixaAtual)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {expanded && (
        <div className="glass-card p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Detalhamento — {labels[expanded]}</h4>
          <MesDetail mes={expanded} />
        </div>
      )}
    </div>
  );
}

function MesDetail({ mes }: { mes: string }) {
  const receitas = getReceitasForMonth(mes);
  const despesas = getDespesasForMonth(mes);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <h5 className="text-xs font-semibold text-muted-foreground mb-2">Receitas ({receitas.length})</h5>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {receitas.map(r => (
            <div key={r.id} className="flex justify-between text-xs py-1 border-b border-border/30">
              <span className="text-foreground">{r.clienteNome}</span>
              <span className="text-foreground font-medium">{formatBRL(r.valorBruto)}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h5 className="text-xs font-semibold text-muted-foreground mb-2">Despesas ({despesas.length})</h5>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {despesas.map(d => (
            <div key={d.id} className="flex justify-between text-xs py-1 border-b border-border/30">
              <span className="text-foreground">{d.subcategoria}</span>
              <span className="text-foreground font-medium">{formatBRL(d.valor)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Simulação ── */
function SimulacaoTab() {
  const [novosClientes, setNovosClientes] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(2500);
  const [percCartFranq, setPercCartFranq] = useState(0);
  const [percRepasse, setPercRepasse] = useState(20);
  const [franquiasMes, setFranquiasMes] = useState(0);
  const [ticketFranquia, setTicketFranquia] = useState(15000);
  const [eventosMes, setEventosMes] = useState(false);
  const [custoEvento, setCustoEvento] = useState(3000);
  const [contratacao, setContratacao] = useState(false);
  const [custoContratacao, setCustoContratacao] = useState(2500);

  const projection6 = getProjection(6);
  const signal = getInvestmentSignal("2026-02");

  // Simulate
  const simulated = projection6.map((p, i) => {
    const receitaNovos = novosClientes * (i + 1) * ticketMedio;
    const repasseNovos = receitaNovos * (percCartFranq / 100) * (percRepasse / 100);
    const receitaFranquias = franquiasMes * ticketFranquia * (i === 0 ? 1 : 0); // one-time
    const custoEventoMes = eventosMes ? custoEvento : 0;
    const custoContratacaoMes = contratacao ? custoContratacao : 0;

    const receitaTotal = p.receitaRecorrente + receitaNovos + receitaFranquias;
    const custoTotal = p.folha + p.parcelas + p.eventos + p.impostos + custoEventoMes + custoContratacaoMes;
    const resultado = receitaTotal - repasseNovos - custoTotal;

    return { ...p, receitaTotal, resultado, label: p.label };
  });

  const signalSim = simulated[0]?.resultado > 0 ? (simulated[0].resultado / simulated[0].receitaTotal > 0.15 ? "green" : "yellow") : "red";
  const signalColors = { green: "text-emerald-500", yellow: "text-yellow-500", red: "text-red-500" };
  const signalLabels = { green: "🟢 Pode investir", yellow: "🟡 Cuidado", red: "🔴 Não recomendado" };

  // "Quando contratar?" - find month where capacity > 80%
  const breakEven = getBreakEven();
  const capacidadeAtual = breakEven.clientesAtuais;
  const mesesAteContratar = novosClientes > 0 ? Math.ceil((30 * 0.8 - capacidadeAtual) / novosClientes) : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 space-y-5">
          <h4 className="text-sm font-semibold text-foreground">Receita</h4>
          <div>
            <label className="text-xs text-muted-foreground">Novos clientes/mês: {novosClientes}</label>
            <Slider value={[novosClientes]} onValueChange={v => setNovosClientes(v[0])} min={0} max={10} step={1} className="mt-2" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Ticket médio (R$)</label>
            <input type="number" value={ticketMedio} onChange={e => setTicketMedio(Number(e.target.value))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">% carteira franqueada: {percCartFranq}%</label>
            <Slider value={[percCartFranq]} onValueChange={v => setPercCartFranq(v[0])} min={0} max={100} step={5} className="mt-2" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">% repasse padrão: {percRepasse}%</label>
            <Slider value={[percRepasse]} onValueChange={v => setPercRepasse(v[0])} min={0} max={50} step={1} className="mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Franquias vendidas/mês</label>
              <input type="number" value={franquiasMes} onChange={e => setFranquiasMes(Number(e.target.value))}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ticket franquia (R$)</label>
              <input type="number" value={ticketFranquia} onChange={e => setTicketFranquia(Number(e.target.value))}
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground mt-1" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 space-y-5">
          <h4 className="text-sm font-semibold text-foreground">Custos</h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={eventosMes} onChange={() => setEventosMes(!eventosMes)} className="rounded border-border accent-primary" />
            <span className="text-sm text-foreground">Eventos mensais</span>
          </label>
          {eventosMes && (
            <input type="number" value={custoEvento} onChange={e => setCustoEvento(Number(e.target.value))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={contratacao} onChange={() => setContratacao(!contratacao)} className="rounded border-border accent-primary" />
            <span className="text-sm text-foreground">Nova contratação</span>
          </label>
          {contratacao && (
            <input type="number" value={custoContratacao} onChange={e => setCustoContratacao(Number(e.target.value))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full text-foreground" />
          )}
          <div className="border-t border-border pt-4 space-y-2">
            <p className={`text-sm font-bold ${signalColors[signalSim as keyof typeof signalColors]}`}>{signalLabels[signalSim as keyof typeof signalLabels]}</p>
            {mesesAteContratar !== null && mesesAteContratar > 0 && (
              <p className="text-xs text-muted-foreground">Quando contratar? Em ~{mesesAteContratar} meses (capacidade 80%)</p>
            )}
          </div>
        </div>
      </div>

      {/* Simulated chart */}
      <div className="glass-card p-5">
        <h4 className="text-sm font-semibold text-foreground mb-4">Projeção Simulada — 6 Meses</h4>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={simulated}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => formatBRL(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="receitaTotal" name="Receita" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="resultado" name="Resultado" radius={[4, 4, 0, 0]}>
              {simulated.map((e, i) => <Cell key={i} fill={e.resultado >= 0 ? "hsl(217,91%,60%)" : "hsl(355,78%,56%)"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Trimestral ── */
function TrimestralTab() {
  const projection = getProjection(6);
  const q1 = projection.slice(0, 3);
  const q2 = projection.slice(3, 6);

  const aggregate = (items: typeof projection) => ({
    receita: items.reduce((s, p) => s + p.receitaRecorrente, 0),
    folha: items.reduce((s, p) => s + p.folha, 0),
    parcelas: items.reduce((s, p) => s + p.parcelas, 0),
    eventos: items.reduce((s, p) => s + p.eventos, 0),
    impostos: items.reduce((s, p) => s + p.impostos, 0),
    resultado: items.reduce((s, p) => s + p.resultado, 0),
  });

  const quarters = [
    { label: "Q1 (Mar–Mai)", ...aggregate(q1) },
    { label: "Q2 (Jun–Ago)", ...aggregate(q2) },
  ];

  return (
    <div className="glass-card overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Trimestre</th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">Receita</th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">Folha</th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">Parcelas</th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">Eventos</th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">Impostos</th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {quarters.map(q => (
            <tr key={q.label} className="border-b border-border/50 hover:bg-secondary/30">
              <td className="py-3 px-4 font-medium text-foreground">{q.label}</td>
              <td className="py-3 px-4 text-right text-foreground">{formatBRL(q.receita)}</td>
              <td className="py-3 px-4 text-right text-foreground">{formatBRL(q.folha)}</td>
              <td className="py-3 px-4 text-right text-foreground">{formatBRL(q.parcelas)}</td>
              <td className="py-3 px-4 text-right text-foreground">{formatBRL(q.eventos)}</td>
              <td className="py-3 px-4 text-right text-foreground">{formatBRL(q.impostos)}</td>
              <td className={`py-3 px-4 text-right font-bold ${q.resultado >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatBRL(q.resultado)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Semestral ── */
function SemestralTab() {
  const projection = getProjection(6);
  const total = {
    receita: projection.reduce((s, p) => s + p.receitaRecorrente, 0),
    folha: projection.reduce((s, p) => s + p.folha, 0),
    parcelas: projection.reduce((s, p) => s + p.parcelas, 0),
    eventos: projection.reduce((s, p) => s + p.eventos, 0),
    impostos: projection.reduce((s, p) => s + p.impostos, 0),
    resultado: projection.reduce((s, p) => s + p.resultado, 0),
  };

  return (
    <div className="space-y-4">
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
            {projection.map(p => (
              <tr key={p.mes} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="py-3 px-4 font-medium text-foreground">{p.label}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatBRL(p.receitaRecorrente)}</td>
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
              <td className="py-3 px-4 font-semibold text-foreground">Total Semestre</td>
              <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(total.receita)}</td>
              <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(total.folha)}</td>
              <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(total.parcelas)}</td>
              <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(total.eventos)}</td>
              <td className="py-3 px-4 text-right font-bold text-foreground">{formatBRL(total.impostos)}</td>
              <td className={`py-3 px-4 text-right font-bold ${total.resultado >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatBRL(total.resultado)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="glass-card p-5">
        <h4 className="text-sm font-semibold text-foreground mb-4">Resultado Semestral</h4>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={projection}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => formatBRL(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="receitaRecorrente" name="Receita" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="resultado" name="Resultado" radius={[4, 4, 0, 0]}>
              {projection.map((e, i) => <Cell key={i} fill={e.resultado >= 0 ? "hsl(217,91%,60%)" : "hsl(355,78%,56%)"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
