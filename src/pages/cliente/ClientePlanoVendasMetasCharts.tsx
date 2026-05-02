// @ts-nocheck
// Lazy-loaded: recharts chunk only loads when user has active goals with progress data.
// PERF-WARN-01: charts deferred behind {hasGoals && goalProgress} condition.
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, BarChart, Bar, Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface GoalChartData {
  name: string;
  atual: number;
  alvo: number;
  percent: number;
}

interface ScopeChartData {
  name: string;
  media: number;
}

interface MetasChartsProps {
  progressChartData: GoalChartData[];
  scopeChartData: ScopeChartData[];
  evolutionChartData: Record<string, unknown>[];
  activeGoals: { id: string; title?: string; target_value?: number }[];
  getBarColor: (pct: number) => string;
}

export default function ClientePlanoVendasMetasCharts({
  progressChartData,
  scopeChartData,
  evolutionChartData,
  activeGoals,
  getBarColor,
}: MetasChartsProps) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">GRÁFICOS DE ACOMPANHAMENTO</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {progressChartData.length > 0 && (
          <Card>
            <CardContent className="py-5">
              <p className="text-xs font-semibold mb-4">Progresso das Metas</p>
              <div style={{ height: Math.max(progressChartData.length * 50, 150) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip
                      formatter={(value: number, name: string) => [
                        typeof value === "number" ? value.toLocaleString("pt-BR") : value,
                        name === "atual" ? "Atual" : "Alvo",
                      ]}
                    />
                    <Bar dataKey="alvo" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={16} name="Alvo" />
                    <Bar dataKey="atual" radius={[0, 4, 4, 0]} barSize={16} name="Atual">
                      {progressChartData.map((entry, i) => (
                        <Cell key={i} fill={getBarColor(entry.percent)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {scopeChartData.length > 0 && (
          <Card>
            <CardContent className="py-5">
              <p className="text-xs font-semibold mb-4">Comparativo por Escopo</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scopeChartData} margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} unit="%" />
                    <RechartsTooltip formatter={(v: number) => [`${v}%`, "Progresso Médio"]} />
                    <Bar dataKey="media" radius={[4, 4, 0, 0]} barSize={40} name="Progresso Médio">
                      {scopeChartData.map((entry, i) => (
                        <Cell key={i} fill={getBarColor(entry.media)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {evolutionChartData.length > 0 && activeGoals.length <= 5 && (
        <Card>
          <CardContent className="py-5">
            <p className="text-xs font-semibold mb-4">Evolução Diária do Mês</p>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionChartData} margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip />
                  {activeGoals.slice(0, 3).map((g, i) => {
                    const colors = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];
                    return (
                      <Area
                        key={`real_${g.id}`}
                        type="monotone"
                        dataKey={`real_${g.id}`}
                        stroke={colors[i]}
                        fill={`${colors[i].replace(")", " / 0.1)")}`}
                        strokeWidth={2}
                        name={g.title?.slice(0, 20)}
                        connectNulls={false}
                        dot={false}
                      />
                    );
                  })}
                  {activeGoals.slice(0, 3).map((g, i) => {
                    const colors = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];
                    return (
                      <Area
                        key={`ideal_${g.id}`}
                        type="monotone"
                        dataKey={`ideal_${g.id}`}
                        stroke={colors[i]}
                        fill="none"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        name={`Ideal: ${g.title?.slice(0, 15)}`}
                        dot={false}
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Linha sólida = progresso real · Linha pontilhada = ritmo ideal</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
