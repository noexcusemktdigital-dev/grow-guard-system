// @ts-nocheck
// Lazy-loaded to keep recharts (charts chunk) out of the ClienteInicio critical path.
// PERF-WARN-01: recharts deferred until revenue data is non-zero.
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RevenueChartProps {
  data: { week: string; receita: number }[];
  formatCurrency: (v: number) => string;
}

export default function ClienteInicioRevenueChart({ data, formatCurrency }: RevenueChartProps) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(v: number) => [formatCurrency(v), "Receita"]}
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
          />
          <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="url(#revenueGrad)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--card))" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
