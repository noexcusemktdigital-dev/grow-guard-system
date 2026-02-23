import { Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceRevenues, useFinanceExpenses } from "@/hooks/useFinance";

export default function FinanceiroFechamentos() {
  const { data: revenues, isLoading: lr } = useFinanceRevenues();
  const { data: expenses, isLoading: le } = useFinanceExpenses();

  if (lr || le) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  const hasData = (revenues ?? []).length > 0 || (expenses ?? []).length > 0;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="page-header-title">Fechamentos (DRE)</h1>
        <p className="text-sm text-muted-foreground mt-1">Demonstrativo de Resultado por franqueado</p>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhum fechamento disponível</h3>
          <p className="text-sm text-muted-foreground">Os fechamentos serão gerados quando houver receitas e despesas registradas.</p>
        </div>
      ) : (
        <div className="glass-card p-6 text-center text-muted-foreground">
          <p>Fechamentos com dados reais serão calculados automaticamente a partir das receitas e despesas registradas.</p>
        </div>
      )}
    </div>
  );
}
