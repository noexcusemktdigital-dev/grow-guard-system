import { Skeleton } from "@/components/ui/skeleton";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { useFinanceRevenues, useFinanceExpenses } from "@/hooks/useFinance";
import { useNetworkContracts } from "@/hooks/useContracts";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinanceiroDashboard() {
  const { data: revenues, isLoading: loadingRev } = useFinanceRevenues();
  const { data: expenses, isLoading: loadingExp } = useFinanceExpenses();
  const { data: contracts, isLoading: loadingContracts } = useNetworkContracts();

  const isLoading = loadingRev || loadingExp || loadingContracts;

  const totalRevenue = (revenues ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const totalExpenses = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const resultado = totalRevenue - totalExpenses;

  const activeContracts = (contracts ?? []).filter((c: any) => c.status === "active" || c.status === "signed");
  const networkMRR = activeContracts.reduce((s: number, c: any) => s + Number(c.monthly_value || 0), 0);

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const hasData = (revenues ?? []).length > 0 || (expenses ?? []).length > 0 || activeContracts.length > 0;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="page-header-title">Gestão Financeira</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral: rede + matriz</p>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Financeiro zerado</h3>
          <p className="text-sm text-muted-foreground mb-4">Adicione receitas, despesas ou contratos para visualizar o dashboard.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = "/franqueadora/financeiro/receitas"}>Receitas</Button>
            <Button variant="outline" onClick={() => window.location.href = "/franqueadora/financeiro/despesas"}>Despesas</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="MRR da Rede" value={formatBRL(networkMRR)} sublabel={`${activeContracts.length} contratos ativos`} accent />
            <KpiCard label="Receitas Matriz" value={formatBRL(totalRevenue)} trend="up" />
            <KpiCard label="Despesas Matriz" value={formatBRL(totalExpenses)} />
            <KpiCard label="Resultado Matriz" value={formatBRL(resultado)} trend={resultado >= 0 ? "up" : "down"} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Últimas Receitas</h3>
              <div className="space-y-2">
                {(revenues ?? []).slice(0, 8).map(r => (
                  <div key={r.id} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="text-sm">{r.description}</span>
                    <span className="text-sm font-medium text-emerald-500">{formatBRL(Number(r.amount))}</span>
                  </div>
                ))}
                {(revenues ?? []).length === 0 && <p className="text-xs text-muted-foreground">Nenhuma receita registrada.</p>}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Últimas Despesas</h3>
              <div className="space-y-2">
                {(expenses ?? []).slice(0, 8).map(e => (
                  <div key={e.id} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="text-sm">{e.description}</span>
                    <span className="text-sm font-medium text-red-500">-{formatBRL(Number(e.amount))}</span>
                  </div>
                ))}
                {(expenses ?? []).length === 0 && <p className="text-xs text-muted-foreground">Nenhuma despesa registrada.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
