import { Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceRevenues } from "@/hooks/useFinance";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinanceiroRepasse() {
  const { data: revenues, isLoading } = useFinanceRevenues();

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="page-header-title">Repasse</h1>
        <p className="text-sm text-muted-foreground mt-1">Logbook CRUD — Franqueados e Parceiros</p>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">Nenhum repasse pendente</h3>
        <p className="text-sm text-muted-foreground">Os repasses serão calculados automaticamente quando houver receitas com origem de franqueados.</p>
      </div>
    </div>
  );
}
