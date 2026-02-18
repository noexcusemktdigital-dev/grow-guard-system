import { getProjection, getBreakEven, getMonthSummary, getInvestmentSignal } from "@/data/mockData";
import { KpiCard } from "@/components/KpiCard";
import { AlertCard } from "@/components/AlertCard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinanceiroProjecao() {
  const projection3 = getProjection(3);
  const projection6 = getProjection(6);
  const breakEven = getBreakEven();
  const summary = getMonthSummary("2026-02");
  const signal = getInvestmentSignal("2026-02");

  const capacidade = 30;
  const capacidadePercent = Math.min((breakEven.clientesAtuais / capacidade) * 100, 100);

  // Simulação: se fizer evento agora
  const custoEvento = 5000;
  const resultadoComEvento = summary.resultado - custoEvento;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro • Projeção</h1>
        <p className="text-sm text-muted-foreground mt-1">Previsibilidade e simulações — Camada 3</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receita Recorrente" value={formatBRL(projection3[0]?.receitaRecorrente || 0)} sublabel="Base atual" />
        <KpiCard label="Break-even" value={`${breakEven.clientesNecessarios} clientes`} sublabel={`Atuais: ${breakEven.clientesAtuais}`} />
        <KpiCard label="Ticket Médio" value={formatBRL(breakEven.ticketMedio)} sublabel="Recorrentes" />
        <KpiCard
          label="Sinal de Investimento"
          value={signal === "green" ? "🟢 Pode investir" : signal === "yellow" ? "🟡 Cuidado" : "🔴 Não recomendado"}
          accent
        />
      </div>

      {/* Capacidade Operacional */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Capacidade Operacional</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${capacidadePercent}%`,
                  backgroundColor: capacidadePercent > 80 ? "hsl(355,78%,56%)" : capacidadePercent > 60 ? "hsl(45,93%,47%)" : "hsl(142,71%,45%)",
                }}
              />
            </div>
          </div>
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
            {breakEven.clientesAtuais} / {capacidade} clientes
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {capacidade - breakEven.clientesAtuais} vagas disponíveis para novos clientes recorrentes
        </p>
      </div>

      {/* Projeção 3 meses */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Lucro Projetado — Próximos 3 Meses</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 text-muted-foreground font-medium">Mês</th>
                <th className="text-right py-3 px-3 text-muted-foreground font-medium">Receita</th>
                <th className="text-right py-3 px-3 text-muted-foreground font-medium">Folha</th>
                <th className="text-right py-3 px-3 text-muted-foreground font-medium">Parcelas</th>
                <th className="text-right py-3 px-3 text-muted-foreground font-medium">Eventos</th>
                <th className="text-right py-3 px-3 text-muted-foreground font-medium">Impostos</th>
                <th className="text-right py-3 px-3 text-muted-foreground font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {projection3.map(p => (
                <tr key={p.mes} className="border-b border-border/50">
                  <td className="py-3 px-3 font-medium text-foreground">{p.label}</td>
                  <td className="py-3 px-3 text-right text-foreground">{formatBRL(p.receitaRecorrente)}</td>
                  <td className="py-3 px-3 text-right text-foreground">{formatBRL(p.folha)}</td>
                  <td className="py-3 px-3 text-right text-foreground">{formatBRL(p.parcelas)}</td>
                  <td className="py-3 px-3 text-right text-foreground">{p.eventos > 0 ? formatBRL(p.eventos) : "—"}</td>
                  <td className="py-3 px-3 text-right text-foreground">{formatBRL(p.impostos)}</td>
                  <td className={`py-3 px-3 text-right font-bold ${p.resultado >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {formatBRL(p.resultado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico 6 meses */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Resultado Projetado — 6 Meses</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={projection6}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
              formatter={(v: number) => formatBRL(v)}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="receitaRecorrente" name="Receita" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="resultado" name="Resultado" radius={[4, 4, 0, 0]}>
              {projection6.map((entry, i) => (
                <Cell key={i} fill={entry.resultado >= 0 ? "hsl(217,91%,60%)" : "hsl(355,78%,56%)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Alertas de Simulação */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Simulações e Alertas</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <AlertCard
            type={resultadoComEvento >= 0 ? "info" : "warning"}
            message={`Se fizer evento este mês (R$ 5.000): resultado cai para ${formatBRL(resultadoComEvento)}`}
          />
          <AlertCard type="clock" message={`Folha sobe em Mar/26 (+R$ 3.500) e Abr/26 (+R$ 1.000)`} />
          <AlertCard type="info" message={`Break-even: ${breakEven.clientesNecessarios} clientes para empatar custos de ${formatBRL(breakEven.custoMensal)}/mês`} />
          <AlertCard
            type={breakEven.clientesAtuais >= breakEven.clientesNecessarios ? "info" : "warning"}
            message={
              breakEven.clientesAtuais >= breakEven.clientesNecessarios
                ? `Acima do break-even por ${breakEven.clientesAtuais - breakEven.clientesNecessarios} clientes`
                : `Faltam ${breakEven.clientesNecessarios - breakEven.clientesAtuais} clientes para atingir break-even`
            }
          />
        </div>
      </div>
    </div>
  );
}
