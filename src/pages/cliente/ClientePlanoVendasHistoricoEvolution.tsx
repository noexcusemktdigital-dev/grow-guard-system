// @ts-nocheck
// Lazy-loaded: evolution chart only shows when planHistory.length >= 2.
// PERF-WARN-01: recharts deferred until user has saved multiple diagnostics.
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface EvolutionChartProps {
  data: { data: string; score: number }[];
}

export default function ClientePlanoVendasHistoricoEvolution({ data }: EvolutionChartProps) {
  return (
    <Card className="glass-card">
      <CardContent className="py-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">EVOLUÇÃO DA MATURIDADE COMERCIAL</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradHistoryEvo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} unit="%" />
              <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}%`, "Score"]} />
              <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="url(#gradHistoryEvo)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
              <ReferenceLine y={75} stroke="hsl(var(--chart-3))" strokeDasharray="5 5" label={{ value: "Alta Perf.", position: "right", fontSize: 10, fill: "hsl(var(--chart-3))" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
