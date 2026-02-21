import { Ticket, TICKET_STATUSES, isSlaBreached, getSlaRemaining } from "@/data/atendimentoData";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, AlertTriangle, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  tickets: Ticket[];
  onSelectTicket: (id: string) => void;
}

const statusColors: Record<string, string> = {
  "Aberto": "bg-blue-500/10 border-blue-500/30",
  "Em analise": "bg-yellow-500/10 border-yellow-500/30",
  "Em atendimento": "bg-purple-500/10 border-purple-500/30",
  "Aguardando franqueado": "bg-orange-500/10 border-orange-500/30",
  "Resolvido": "bg-green-500/10 border-green-500/30",
  "Encerrado": "bg-muted border-border",
};

const statusDotColors: Record<string, string> = {
  "Aberto": "bg-blue-500",
  "Em analise": "bg-yellow-500",
  "Em atendimento": "bg-purple-500",
  "Aguardando franqueado": "bg-orange-500",
  "Resolvido": "bg-green-500",
  "Encerrado": "bg-muted-foreground/40",
};

const priorityColors: Record<string, string> = {
  "Baixa": "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  "Normal": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "Alta": "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  "Urgente": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export function AtendimentoKanban({ tickets, onSelectTicket }: Props) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {TICKET_STATUSES.map(status => {
        const col = tickets.filter(t => t.status === status);
        return (
          <div key={status} className="min-w-[280px] flex-shrink-0">
            <div className={`rounded-lg border p-3 mb-3 ${statusColors[status]}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${statusDotColors[status]}`} />
                <span className="text-sm font-medium">{status}</span>
                <Badge variant="secondary" className="ml-auto text-xs">{col.length}</Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {col.map(ticket => {
                const breached = isSlaBreached(ticket);
                const sla = getSlaRemaining(ticket);
                return (
                  <Card
                    key={ticket.id}
                    className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onSelectTicket(ticket.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-muted-foreground">{ticket.numero}</span>
                      <Badge className={`text-[10px] ${priorityColors[ticket.prioridade]}`}>
                        {ticket.prioridade}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-1 line-clamp-1">{ticket.unidadeNome}</p>
                    <Badge variant="outline" className="text-[10px] mb-2">{ticket.categoria}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <User className="w-3 h-3" />
                      <span>{ticket.responsavelNome}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(new Date(ticket.atualizadoEm), { addSuffix: true, locale: ptBR })}</span>
                      {breached ? (
                        <span className="flex items-center gap-1 text-red-500 font-medium animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> SLA Estourado
                        </span>
                      ) : sla !== "—" ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {sla}
                        </span>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
              {col.length === 0 && (
                <div className="text-xs text-muted-foreground/50 text-center py-8">Nenhum chamado</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
