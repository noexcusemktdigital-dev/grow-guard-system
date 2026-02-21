import { Ticket, isSlaBreached, getSlaRemaining } from "@/data/atendimentoData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  tickets: Ticket[];
  onSelectTicket: (id: string) => void;
}

const statusBadge: Record<string, string> = {
  "Aberto": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "Em analise": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  "Em atendimento": "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  "Aguardando franqueado": "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  "Resolvido": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "Encerrado": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  "Reaberto": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
};

const priorityBadge: Record<string, string> = {
  "Baixa": "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  "Normal": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "Alta": "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  "Urgente": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export function AtendimentoList({ tickets, onSelectTicket }: Props) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Nº</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Atualização</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map(ticket => {
            const breached = isSlaBreached(ticket);
            const sla = getSlaRemaining(ticket);
            return (
              <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelectTicket(ticket.id)}>
                <TableCell className="font-mono font-bold text-xs">{ticket.numero}</TableCell>
                <TableCell className="text-sm">{ticket.unidadeNome}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{ticket.categoria}</Badge></TableCell>
                <TableCell><Badge className={`text-xs ${priorityBadge[ticket.prioridade]}`}>{ticket.prioridade}</Badge></TableCell>
                <TableCell className="text-sm">{ticket.responsavelNome}</TableCell>
                <TableCell><Badge className={`text-xs ${statusBadge[ticket.status]}`}>{ticket.status}</Badge></TableCell>
                <TableCell>
                  {breached ? (
                    <span className="flex items-center gap-1 text-xs text-red-500 font-medium animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> Estourado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {sla}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(ticket.atualizadoEm), "dd/MM HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
