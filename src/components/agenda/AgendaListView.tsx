import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AgendaEvent, CalendarConfig } from "@/types/agenda";
import { getEventColor, getStatusColor, getLevelLabel } from "@/types/agenda";
import { format, parseISO, addDays, isSameDay, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, MapPin, Video, Clock } from "lucide-react";

interface Props {
  currentDate: Date;
  activeCalendars: string[];
  events: AgendaEvent[];
  calendars: CalendarConfig[];
  onSelectEvent: (id: string) => void;
}

export function AgendaListView({ currentDate, activeCalendars, events, calendars, onSelectEvent }: Props) {
  const grouped = useMemo(() => {
    const start = startOfDay(currentDate);
    const end = addDays(start, 14);
    const filtered = events
      .filter(e => activeCalendars.includes(e.calendarId))
      .filter(e => {
        const d = parseISO(e.inicio);
        return !isBefore(d, start) && isBefore(d, end);
      })
      .sort((a, b) => parseISO(a.inicio).getTime() - parseISO(b.inicio).getTime());

    const groups: { date: Date; events: AgendaEvent[] }[] = [];
    filtered.forEach(ev => {
      const d = parseISO(ev.inicio);
      const existing = groups.find(g => isSameDay(g.date, d));
      if (existing) existing.events.push(ev);
      else groups.push({ date: d, events: [ev] });
    });
    return groups;
  }, [currentDate, activeCalendars, events]);

  if (grouped.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Nenhum evento nos próximos 14 dias para os calendários selecionados.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 overflow-auto h-full">
      {grouped.map(({ date, events: dayEvents }) => (
        <div key={date.toISOString()}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`text-sm font-semibold ${isSameDay(date, new Date()) ? "text-primary" : ""}`}>
              {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </div>
            {isSameDay(date, new Date()) && <Badge variant="outline" className="text-[10px]">Hoje</Badge>}
          </div>
          <div className="space-y-2">
            {dayEvents.map(ev => (
              <Card
                key={ev.id}
                className="p-3 cursor-pointer hover:shadow-md transition-shadow border-l-4"
                style={{ borderLeftColor: getEventColor(ev.calendarId, calendars) }}
                onClick={() => onSelectEvent(ev.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{ev.titulo}</span>
                      {ev.status === "Cancelado" && <span className="text-[10px] line-through text-muted-foreground">cancelado</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ev.allDay ? "Dia inteiro" : `${format(parseISO(ev.inicio), "HH:mm")} - ${format(parseISO(ev.fim), "HH:mm")}`}
                      </span>
                      {ev.local && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.local}</span>}
                      {ev.linkMeet && <span className="flex items-center gap-1"><Video className="w-3 h-3" />Online</span>}
                      {ev.participantes.length > 0 && (
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ev.participantes.length}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">{ev.tipo}</Badge>
                    <Badge className={`text-[10px] ${getStatusColor(ev.status)}`}>{ev.status}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
