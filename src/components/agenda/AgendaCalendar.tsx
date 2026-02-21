import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  getEventsForDate, getEventsForMonth, getMonthDays, getEventColor, getStatusColor,
  mockTimeBlocks, type AgendaEvent
} from "@/data/agendaData";
import {
  format, isSameDay, isSameMonth, parseISO, startOfWeek, endOfWeek,
  eachDayOfInterval, eachHourOfInterval, startOfDay, endOfDay, addHours
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  view: "month" | "week" | "day";
  currentDate: Date;
  activeCalendars: string[];
  onSelectEvent: (id: string) => void;
  onSelectDate: (date: Date) => void;
  onCreateEvent: (date: Date) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7h-21h

export function AgendaCalendar({ view, currentDate, activeCalendars, onSelectEvent, onSelectDate, onCreateEvent }: Props) {
  if (view === "month") return <MonthView currentDate={currentDate} activeCalendars={activeCalendars} onSelectEvent={onSelectEvent} onSelectDate={onSelectDate} onCreateEvent={onCreateEvent} />;
  if (view === "week") return <WeekView currentDate={currentDate} activeCalendars={activeCalendars} onSelectEvent={onSelectEvent} onCreateEvent={onCreateEvent} />;
  return <DayView currentDate={currentDate} activeCalendars={activeCalendars} onSelectEvent={onSelectEvent} onCreateEvent={onCreateEvent} />;
}

// ===== MONTH =====
function MonthView({ currentDate, activeCalendars, onSelectEvent, onSelectDate, onCreateEvent }: Omit<Props, "view">) {
  const days = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const events = useMemo(() => getEventsForMonth(currentDate, activeCalendars), [currentDate, activeCalendars]);
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 border-b border-border">
        {weekdays.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map((day, i) => {
          const dayEvents = events.filter(e => isSameDay(parseISO(e.inicio), day));
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);
          return (
            <div
              key={i}
              className={`border-b border-r border-border p-1 min-h-[90px] cursor-pointer hover:bg-secondary/30 transition-colors ${
                !isCurrentMonth ? "bg-muted/20" : ""
              }`}
              onClick={() => onCreateEvent(day)}
            >
              <div className={`text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                isToday ? "bg-primary text-primary-foreground font-bold" : isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"
              }`}>
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(ev => (
                  <Tooltip key={ev.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer text-white font-medium"
                        style={{ backgroundColor: getEventColor(ev.calendarId) }}
                        onClick={(e) => { e.stopPropagation(); onSelectEvent(ev.id); }}
                      >
                        {ev.allDay ? ev.titulo : `${format(parseISO(ev.inicio), "HH:mm")} ${ev.titulo}`}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      <div className="font-medium">{ev.titulo}</div>
                      <div>{format(parseISO(ev.inicio), "HH:mm")} - {format(parseISO(ev.fim), "HH:mm")}</div>
                      <div>{ev.tipo} • {ev.status}</div>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-primary font-medium px-1">+{dayEvents.length - 3} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== WEEK =====
function WeekView({ currentDate, activeCalendars, onSelectEvent, onCreateEvent }: Omit<Props, "view" | "onSelectDate">) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border sticky top-0 bg-card z-10">
        <div className="border-r border-border" />
        {days.map((d, i) => (
          <div key={i} className={`text-center py-2 border-r border-border ${isSameDay(d, new Date()) ? "bg-primary/5" : ""}`}>
            <div className="text-[10px] text-muted-foreground">{format(d, "EEE", { locale: ptBR })}</div>
            <div className={`text-sm font-medium ${isSameDay(d, new Date()) ? "text-primary" : ""}`}>{format(d, "d")}</div>
          </div>
        ))}
      </div>

      {/* All-day events row */}
      {(() => {
        const allDayEvents = days.map(d => getEventsForDate(d, activeCalendars).filter(e => e.allDay));
        const hasAny = allDayEvents.some(a => a.length > 0);
        if (!hasAny) return null;
        return (
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
            <div className="border-r border-border text-[10px] text-muted-foreground p-1">Dia todo</div>
            {allDayEvents.map((evs, i) => (
              <div key={i} className="border-r border-border p-0.5 space-y-0.5">
                {evs.map(ev => (
                  <div key={ev.id} className="text-[10px] px-1 py-0.5 rounded text-white truncate cursor-pointer"
                    style={{ backgroundColor: getEventColor(ev.calendarId) }}
                    onClick={() => onSelectEvent(ev.id)}
                  >{ev.titulo}</div>
                ))}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Time grid */}
      <div className="flex-1">
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50 h-14">
            <div className="border-r border-border text-[10px] text-muted-foreground p-1 text-right pr-2">
              {String(hour).padStart(2, "0")}:00
            </div>
            {days.map((d, di) => {
              const dayEvents = getEventsForDate(d, activeCalendars).filter(e => {
                if (e.allDay) return false;
                const h = parseISO(e.inicio).getHours();
                return h === hour;
              });
              const isBlock = mockTimeBlocks.some(b => {
                const bs = parseISO(b.inicio).getHours();
                const be = parseISO(b.fim).getHours();
                return isSameDay(parseISO(b.inicio), d) && hour >= bs && hour < be;
              });
              const block = isBlock ? mockTimeBlocks.find(b => {
                const bs = parseISO(b.inicio).getHours();
                const be = parseISO(b.fim).getHours();
                return isSameDay(parseISO(b.inicio), d) && hour >= bs && hour < be;
              }) : null;

              return (
                <div key={di} className={`border-r border-border/50 relative ${
                  block ? (block.tipo === "disponivel" ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-dashed" : "bg-red-50/50 dark:bg-red-950/20 border-dashed") : ""
                }`}>
                  {dayEvents.map(ev => (
                    <div key={ev.id}
                      className="absolute inset-x-0.5 top-0.5 text-[10px] px-1 py-0.5 rounded text-white truncate cursor-pointer z-10"
                      style={{ backgroundColor: getEventColor(ev.calendarId) }}
                      onClick={() => onSelectEvent(ev.id)}
                    >
                      {format(parseISO(ev.inicio), "HH:mm")} {ev.titulo}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== DAY =====
function DayView({ currentDate, activeCalendars, onSelectEvent, onCreateEvent }: Omit<Props, "view" | "onSelectDate">) {
  const dayEvents = useMemo(() => getEventsForDate(currentDate, activeCalendars), [currentDate, activeCalendars]);
  const allDayEvents = dayEvents.filter(e => e.allDay);
  const timedEvents = dayEvents.filter(e => !e.allDay);

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Day header */}
      <div className="border-b border-border p-3 sticky top-0 bg-card z-10">
        <div className="text-lg font-semibold">{format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</div>
        {allDayEvents.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {allDayEvents.map(ev => (
              <div key={ev.id} className="text-xs px-2 py-1 rounded text-white cursor-pointer"
                style={{ backgroundColor: getEventColor(ev.calendarId) }}
                onClick={() => onSelectEvent(ev.id)}
              >{ev.titulo}</div>
            ))}
          </div>
        )}
      </div>

      {/* Time grid */}
      <div className="flex-1">
        {HOURS.map(hour => {
          const hourEvents = timedEvents.filter(e => parseISO(e.inicio).getHours() === hour);
          const block = mockTimeBlocks.find(b => {
            const bs = parseISO(b.inicio).getHours();
            const be = parseISO(b.fim).getHours();
            return isSameDay(parseISO(b.inicio), currentDate) && hour >= bs && hour < be;
          });

          return (
            <div key={hour} className={`flex border-b border-border/50 min-h-[60px] ${
              block ? (block.tipo === "disponivel" ? "bg-emerald-50/50 dark:bg-emerald-950/20" : "bg-red-50/50 dark:bg-red-950/20") : ""
            }`}>
              <div className="w-16 text-xs text-muted-foreground p-2 text-right border-r border-border shrink-0">
                {String(hour).padStart(2, "0")}:00
              </div>
              <div className="flex-1 p-1 space-y-1 relative">
                {block && hourEvents.length === 0 && (
                  <div className="text-[10px] text-muted-foreground italic px-1">{block.titulo}</div>
                )}
                {hourEvents.map(ev => (
                  <div key={ev.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-white text-sm"
                    style={{ backgroundColor: getEventColor(ev.calendarId) }}
                    onClick={() => onSelectEvent(ev.id)}
                  >
                    <span className="font-medium">{format(parseISO(ev.inicio), "HH:mm")} - {format(parseISO(ev.fim), "HH:mm")}</span>
                    <span className="truncate">{ev.titulo}</span>
                    {ev.participantes.length > 0 && (
                      <span className="text-xs opacity-75 ml-auto shrink-0">{ev.participantes.length} participantes</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
