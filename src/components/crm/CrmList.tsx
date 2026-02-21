import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, ArrowRight } from "lucide-react";
import type { Lead, FunnelType, Task } from "@/data/crmData";
import { getStagesForFunnel } from "@/data/crmData";
import { useState } from "react";

const tempBadge: Record<string, string> = {
  Frio: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Morno: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Quente: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusBadge: Record<string, string> = {
  Ativo: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Perdido: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Vendido: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

interface CrmListProps {
  leads: Lead[];
  tasks: Task[];
  onOpenLead: (id: string) => void;
  onMoveLead: (leadId: string, newStage: string) => void;
}

export function CrmList({ leads, tasks, onOpenLead, onMoveLead }: CrmListProps) {
  const [movingLead, setMovingLead] = useState<string | null>(null);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead</TableHead>
            <TableHead>Funil</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Cidade/UF</TableHead>
            <TableHead>Temp.</TableHead>
            <TableHead>Próx. Tarefa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const nextTask = tasks.find((t) => t.leadId === lead.id && t.status === "Aberta");
            return (
              <TableRow key={lead.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onOpenLead(lead.id)}>
                <TableCell className="font-medium">{lead.nome}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {lead.funnel === "franchise" ? "Franquia" : "Clientes"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{lead.stage}</Badge>
                </TableCell>
                <TableCell className="text-sm">{lead.responsavel}</TableCell>
                <TableCell className="text-sm">{lead.origin}</TableCell>
                <TableCell className="text-sm">{lead.cidade}/{lead.uf}</TableCell>
                <TableCell>
                  <Badge className={`text-xs ${tempBadge[lead.temperature]}`}>{lead.temperature}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {nextTask ? new Date(nextTask.dataHora).toLocaleDateString("pt-BR") : "—"}
                </TableCell>
                <TableCell>
                  <Badge className={`text-xs ${statusBadge[lead.leadStatus]}`}>{lead.leadStatus}</Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onOpenLead(lead.id)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setMovingLead(movingLead === lead.id ? null : lead.id)}>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {movingLead === lead.id && (
                    <Select onValueChange={(v) => { onMoveLead(lead.id, v); setMovingLead(null); }}>
                      <SelectTrigger className="h-7 text-xs mt-1 w-40">
                        <SelectValue placeholder="Mover para..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getStagesForFunnel(lead.funnel).filter((s) => s !== lead.stage).map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
