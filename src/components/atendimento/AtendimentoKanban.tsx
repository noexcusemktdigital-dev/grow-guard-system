import { Ticket, TicketStatus, TICKET_STATUSES, isSlaBreached, getSlaRemaining } from "@/types/atendimento";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, AlertTriangle, User, GripVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { snapCenterToCursor } from "@dnd-kit/modifiers";

interface Props {
  tickets: Ticket[];
  onSelectTicket: (id: string) => void;
  onMoveTicket: (ticketId: string, newStatus: TicketStatus) => void;
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

function TicketCard({ ticket, onSelectTicket }: { ticket: Ticket; onSelectTicket: (id: string) => void }) {
  const breached = isSlaBreached(ticket);
  const sla = getSlaRemaining(ticket);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ticket.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <Card
        className="p-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onSelectTicket(ticket.id)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground -ml-1 p-0.5">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-mono font-bold text-muted-foreground">{ticket.numero}</span>
          </div>
          <Badge className={`text-[10px] ${priorityColors[ticket.prioridade]}`}>{ticket.prioridade}</Badge>
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
    </div>
  );
}

function OverlayCard({ ticket }: { ticket: Ticket }) {
  const breached = isSlaBreached(ticket);
  const sla = getSlaRemaining(ticket);
  return (
    <Card className="p-3 shadow-xl border-primary/30 w-[280px] rotate-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-bold text-muted-foreground">{ticket.numero}</span>
        <Badge className={`text-[10px] ${priorityColors[ticket.prioridade]}`}>{ticket.prioridade}</Badge>
      </div>
      <p className="text-sm font-medium mb-1 line-clamp-1">{ticket.unidadeNome}</p>
      <Badge variant="outline" className="text-[10px] mb-2">{ticket.categoria}</Badge>
    </Card>
  );
}

function DroppableColumn({ status, tickets, onSelectTicket }: { status: TicketStatus; tickets: Ticket[]; onSelectTicket: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div key={status} className="min-w-[280px] flex-shrink-0">
      <div className={`rounded-lg border p-3 mb-3 ${statusColors[status]}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusDotColors[status]}`} />
          <span className="text-sm font-medium">{status}</span>
          <Badge variant="secondary" className="ml-auto text-xs">{tickets.length}</Badge>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[60px] rounded-lg transition-colors p-1 ${isOver ? "bg-primary/5 ring-2 ring-primary/20" : ""}`}
      >
        {tickets.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} onSelectTicket={onSelectTicket} />
        ))}
        {tickets.length === 0 && (
          <div className="text-xs text-muted-foreground/50 text-center py-8">Nenhum chamado</div>
        )}
      </div>
    </div>
  );
}

export function AtendimentoKanban({ tickets, onSelectTicket, onMoveTicket }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const activeTicket = activeId ? tickets.find(t => t.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const ticketId = active.id as string;
    const newStatus = over.id as TicketStatus;
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket && TICKET_STATUSES.includes(newStatus) && ticket.status !== newStatus) {
      onMoveTicket(ticketId, newStatus);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TICKET_STATUSES.map(status => (
          <DroppableColumn
            key={status}
            status={status}
            tickets={tickets.filter(t => t.status === status)}
            onSelectTicket={onSelectTicket}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null} zIndex={100} modifiers={[snapCenterToCursor]}>
        {activeTicket ? <OverlayCard ticket={activeTicket} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
