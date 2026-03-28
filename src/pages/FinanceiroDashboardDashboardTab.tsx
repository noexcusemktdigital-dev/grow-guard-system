import { useMemo } from "react";
import { formatBRL } from "@/lib/formatting";
import { KpiCard } from "@/components/KpiCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid, PieChart as RePieChart, Pie, Cell } from "recharts";
import {
  type NetworkContract, type RevenueRow, type ExpenseRow, type MonthOption,
  months, ASAAS_PAID_STATUSES, PIE_COLORS,
} from "./FinanceiroDashboardTypes";
import type { AsaasPayment } from "@/hooks/useClientPayments";

export interface DashboardTabProps {
  totalRevenue: number;
  totalExpenses: number;
  resultado: number;
  networkMRR: number;
  overdueCount: number;
  asaasPayments: AsaasPayment[] | undefined;
  revenues: RevenueRow[] | undefined;
  expenses: ExpenseRow[] | undefined;
  activeContracts: NetworkContract[];
  selectedMonth: string;
  monthOptions: MonthOption[];
  monthTotal: number;
  monthReceived: number;
  monthOverdue: number;
}

export function DashboardTab({ totalRevenue, totalExpenses, resultado, networkMRR, overdueCount, asaasPayments, revenues, expenses, activeContracts, selectedMonth, monthOptions, monthTotal, monthReceived, monthOverdue }: DashboardTabProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const asaasRec = (asaasPayments ?? [])
        .filter((p: AsaasPayment) => (p.paymentDate || p.dueDate || "").startsWith(prefix) && ASAAS_PAID_STATUSES.includes(p.status))
        .reduce((s: number, p: AsaasPayment) => s + p.value, 0);
      const manualRec = (revenues ?? [])
        .filter((r: RevenueRow) => (r.date || "").startsWith(prefix) && r.status === "paid")
        .reduce((s: number, r: RevenueRow) => s + Number(r.amount), 0);
      const desp = (expenses ?? []).filter((e: ExpenseRow) => (e.date || "").startsWith(prefix)).reduce((s: number, e: ExpenseRow) => s + Number(e.amount), 0);
      return { name: months[d.getMonth()], receitas: asaasRec + manualRec, despesas: desp };
    });
  }, [asaasPayments, revenues, expenses]);

  const pieData = useMemo(() => {
    const cats: Record<string, number> = { "Manual": 0 };
    (asaasPayments ?? []).filter((p: AsaasPayment) => ASAAS_PAID_STATUSES.includes(p.status)).forEach((p: AsaasPayment) => {
      const cat = p.billingType || "Outros";
      cats[cat] = (cats[cat] || 0) + p.value;
    });
    const manualTotal = (revenues ?? []).filter((r: RevenueRow) => r.status === "paid").reduce((s: number, r: RevenueRow) => s + Number(r.amount), 0);
    if (manualTotal > 0) cats["Manual"] = manualTotal;
    else delete cats["Manual"];
    return Object.entries(cats).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [asaasPayments, revenues]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="MRR da Rede" value={formatBRL(networkMRR)} accent />
        <KpiCard label="Cobranças do Mês" value={formatBRL(monthTotal)} sublabel="total no período" />
        <KpiCard label="Recebidas" value={formatBRL(monthReceived)} trend="up" sublabel="confirmadas" />
        <KpiCard label="Atrasadas" value={formatBRL(monthOverdue)} sublabel={overdueCount > 0 ? `${overdueCount} cobranças` : "nenhuma"} />
        <KpiCard label="Despesas" value={formatBRL(totalExpenses)} sublabel={selectedMonth !== "all" ? monthOptions.find((o: MonthOption) => o.value === selectedMonth)?.label : undefined} />
        <KpiCard label="Resultado" value={formatBRL(resultado)} trend={resultado >= 0 ? "up" : "down"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receitas vs Despesas (últimos 6 meses)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <ReTooltip formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receitas por Tipo</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <RePieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_: { name: string; value: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip formatter={(v: number) => formatBRL(v)} />
              </RePieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Block removed — contract revenue was displaying non-real data */}
    </>
  );
}
