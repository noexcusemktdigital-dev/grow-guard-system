// @ts-nocheck
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface PipelineSummary {
  totalLeads: number;
  totalValue: number;
  wonLeads: number;
  wonValue: number;
  convRate: number;
  avgValue: number;
}

interface ClienteCRMSummaryProps {
  pipelineSummary: PipelineSummary;
}

export function ClienteCRMSummary({ pipelineSummary }: ClienteCRMSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card><CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Leads ativos</p>
        <p className="text-xl font-bold mt-1">{pipelineSummary.totalLeads}</p>
      </CardContent></Card>
      <Card><CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Valor no pipeline</p>
        <p className="text-xl font-bold text-primary mt-1">R$ {pipelineSummary.totalValue.toLocaleString("pt-BR")}</p>
      </CardContent></Card>
      <Card><CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Ticket médio</p>
        <p className="text-xl font-bold mt-1">R$ {pipelineSummary.avgValue.toLocaleString("pt-BR")}</p>
      </CardContent></Card>
      <Card><CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Conversão</p>
        <p className="text-xl font-bold mt-1">{pipelineSummary.convRate}%</p>
        <p className="text-[10px] text-muted-foreground">{pipelineSummary.wonLeads} vendidos</p>
      </CardContent></Card>
    </div>
  );
}
