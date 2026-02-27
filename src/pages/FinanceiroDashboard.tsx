import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinanceRevenues, useFinanceExpenses } from "@/hooks/useFinance";
import { useNetworkContracts } from "@/hooks/useContracts";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function getMonthOptions() {
  const now = new Date();
  const opts: { value: string; label: string }[] = [{ value: "all", label: "Todos os meses" }];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: `${months[d.getMonth()]} ${d.getFullYear()}` });
  }
  return opts;
}

export default function FinanceiroDashboard() {
  const { data: revenues, isLoading: loadingRev } = useFinanceRevenues();
  const { data: expenses, isLoading: loadingExp } = useFinanceExpenses();
  const { data: contracts, isLoading: loadingContracts } = useNetworkContracts();
  const [selectedMonth, setSelectedMonth] = useState("all");

  const isLoading = loadingRev || loadingExp || loadingContracts;
  const monthOptions = useMemo(getMonthOptions, []);

  const filterByMonth = (date: string | null) => {
    if (selectedMonth === "all" || !date) return true;
    return date.startsWith(selectedMonth);
  };

  const filteredRevenues = useMemo(() => (revenues ?? []).filter(r => filterByMonth(r.date)), [revenues, selectedMonth]);
  const filteredExpenses = useMemo(() => (expenses ?? []).filter(e => filterByMonth(e.date)), [expenses, selectedMonth]);

  const totalRevenue = filteredRevenues.reduce((s, r) => s + Number(r.amount), 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const resultado = totalRevenue - totalExpenses;

  const activeContracts = (contracts ?? []).filter((c: any) => c.status === "active" || c.status === "signed");
  const networkMRR = activeContracts.reduce((s: number, c: any) => s + Number(c.monthly_value || 0), 0);

  // Chart data: last 6 months
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const rec = (revenues ?? []).filter(r => r.date?.startsWith(prefix)).reduce((s, r) => s + Number(r.amount), 0);
      const desp = (expenses ?? []).filter(e => e.date?.startsWith(prefix)).reduce((s, e) => s + Number(e.amount), 0);
      return { name: `${months[d.getMonth()]}`, receitas: rec, despesas: desp };
    });
  }, [revenues, expenses]);

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const hasData = (revenues ?? []).length > 0 || (expenses ?? []).length > 0 || activeContracts.length > 0;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-header-title">Gestão Financeira</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral: rede + matriz</p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar mês" /></SelectTrigger>
          <SelectContent>{monthOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Financeiro zerado</h3>
          <p className="text-sm text-muted-foreground mb-4">Adicione receitas, despesas ou contratos para visualizar o dashboard.</p>
          <Button variant="outline" onClick={() => window.location.href = "/franqueadora/financeiro/controle"}>Ir ao Controle Financeiro</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="MRR da Rede" value={formatBRL(networkMRR)} sublabel={`${activeContracts.length} contratos ativos`} accent />
            <KpiCard label="Receitas" value={formatBRL(totalRevenue)} trend="up" sublabel={selectedMonth !== "all" ? monthOptions.find(o => o.value === selectedMonth)?.label : undefined} />
            <KpiCard label="Despesas" value={formatBRL(totalExpenses)} sublabel={selectedMonth !== "all" ? monthOptions.find(o => o.value === selectedMonth)?.label : undefined} />
            <KpiCard label="Resultado" value={formatBRL(resultado)} trend={resultado >= 0 ? "up" : "down"} />
          </div>

          {/* Chart */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Receitas vs Despesas (últimos 6 meses)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatBRL(v)} />
                <Bar dataKey="receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Receitas" />
                <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/franqueadora/financeiro/controle" className="glass-card p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
              <div><p className="text-sm font-semibold">Controle Financeiro</p><p className="text-xs text-muted-foreground">Entradas, saídas e contratos</p></div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>
            <a href="/franqueadora/financeiro/repasse" className="glass-card p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
              <div><p className="text-sm font-semibold">Repasse</p><p className="text-xs text-muted-foreground">Cobranças e repasses às unidades</p></div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>
            <a href="/franqueadora/financeiro/fechamentos" className="glass-card p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
              <div><p className="text-sm font-semibold">Fechamentos</p><p className="text-xs text-muted-foreground">Consolidação mensal</p></div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>
          </div>

          {/* Active contracts preview */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Receita de Contratos Ativos</h3>
            {activeContracts.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum contrato ativo na rede.</p>
            ) : (
              <div className="space-y-2">
                {activeContracts.slice(0, 8).map((c: any) => (
                  <div key={c.id} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                    <div>
                      <span className="text-sm font-medium">{c.signer_name || c.title}</span>
                      <span className="text-xs text-muted-foreground ml-2">{c.org_name || "Matriz"}</span>
                    </div>
                    <span className="text-sm font-medium text-emerald-500">{c.monthly_value ? formatBRL(Number(c.monthly_value)) : "—"}/mês</span>
                  </div>
                ))}
                {activeContracts.length > 8 && <p className="text-xs text-muted-foreground text-center pt-2">+{activeContracts.length - 8} contratos</p>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
