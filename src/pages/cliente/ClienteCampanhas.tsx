import { useState, useMemo } from "react";
import { Rocket, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/KpiCard";
import { getClienteCampanhas } from "@/data/clienteData";

const statusColors: Record<string, string> = {
  Ativa: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Pausada: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  Finalizada: "bg-muted text-muted-foreground",
};

export default function ClienteCampanhas() {
  const campanhas = useMemo(() => getClienteCampanhas(), []);
  const [filter, setFilter] = useState("Todas");
  const filters = ["Todas", "Ativa", "Pausada", "Finalizada"];
  const filtered = filter === "Todas" ? campanhas : campanhas.filter(c => c.status === filter);

  const totalBudget = campanhas.reduce((s, c) => s + c.budget, 0);
  const totalSpent = campanhas.reduce((s, c) => s + c.spent, 0);
  const totalLeads = campanhas.reduce((s, c) => s + c.leads, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Campanhas"
        subtitle="Gerenciamento de campanhas de marketing"
        icon={<Rocket className="w-5 h-5 text-primary" />}
        actions={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Campanha</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Orçamento Total" value={`R$ ${totalBudget.toLocaleString()}`} variant="accent" />
        <KpiCard label="Gasto" value={`R$ ${totalSpent.toLocaleString()}`} sublabel={`${Math.round((totalSpent / totalBudget) * 100)}%`} />
        <KpiCard label="Leads Totais" value={totalLeads.toString()} trend="up" />
      </div>

      <div className="flex gap-2">
        {filters.map(f => <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setFilter(f)}>{f}</Button>)}
      </div>

      <div className="space-y-3">
        {filtered.map(c => (
          <Card key={c.id} className="hover:shadow-md transition-all">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{c.name}</span>
                  <Badge variant="outline" className={`text-[9px] ${statusColors[c.status]}`}>{c.status}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{c.startDate} → {c.endDate}</span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div><p className="text-lg font-bold">R$ {c.budget.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Orçamento</p></div>
                <div><p className="text-lg font-bold">R$ {c.spent.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Gasto</p></div>
                <div><p className="text-lg font-bold text-primary">{c.leads}</p><p className="text-[10px] text-muted-foreground">Leads</p></div>
                <div><p className="text-lg font-bold">{c.conversions}</p><p className="text-[10px] text-muted-foreground">Conversões</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
