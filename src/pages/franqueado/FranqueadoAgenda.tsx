import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, List, Plus } from "lucide-react";
import { AgendaSidebar } from "@/components/agenda/AgendaSidebar";
import { AgendaCalendar } from "@/components/agenda/AgendaCalendar";
import { AgendaListView } from "@/components/agenda/AgendaListView";
import { AgendaEventForm } from "@/components/agenda/AgendaEventForm";
import { AgendaEventDetail } from "@/components/agenda/AgendaEventDetail";
import { getFranqueadoAgendaEvents, getFranqueadoCalendars } from "@/data/franqueadoData";
import { type AgendaEvent, mockEvents, mockCalendars } from "@/data/agendaData";
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

type View = "month" | "week" | "day" | "list";
type Page = "calendar" | "detail";

const viewLabels: Record<View, string> = { month: "Mês", week: "Semana", day: "Dia", list: "Lista" };

export default function FranqueadoAgenda() {
  const [view, setView] = useState<View>("month");
  const [page, setPage] = useState<Page>("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const franqueadoCalendars = useMemo(() => getFranqueadoCalendars(), []);
  const [activeCalendars, setActiveCalendars] = useState<string[]>(franqueadoCalendars.map(c => c.id));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [formDefaultDate, setFormDefaultDate] = useState<Date | undefined>();

  // Inject franqueado events into mockEvents/mockCalendars temporarily
  // We use a memo to build the combined data
  const franqueadoEvents = useMemo(() => getFranqueadoAgendaEvents(), []);

  // Temporarily patch mock data for agenda components to pick up
  useMemo(() => {
    // Add franqueado calendars if not already present
    franqueadoCalendars.forEach(fc => {
      if (!mockCalendars.find(c => c.id === fc.id)) {
        mockCalendars.push(fc);
      }
    });
    // Add franqueado events if not already present
    franqueadoEvents.forEach(fe => {
      if (!mockEvents.find(e => e.id === fe.id)) {
        mockEvents.push(fe);
      }
    });
  }, [franqueadoCalendars, franqueadoEvents]);

  const toggleCalendar = (id: string) => {
    setActiveCalendars(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const navigate = (dir: -1 | 0 | 1) => {
    if (dir === 0) { setCurrentDate(new Date()); return; }
    if (view === "month") setCurrentDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
    else if (view === "week") setCurrentDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate(d => dir === 1 ? addDays(d, 1) : subDays(d, 1));
  };

  const periodLabel = () => {
    if (view === "month") return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    if (view === "day") return format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    return `Semana de ${format(currentDate, "d 'de' MMM", { locale: ptBR })}`;
  };

  const handleSelectEvent = (id: string) => { setSelectedEventId(id); setPage("detail"); };
  const handleSelectDate = (date: Date) => { setCurrentDate(date); setView("day"); };
  const handleNewEvent = () => { setEditingEvent(null); setFormDefaultDate(currentDate); setShowEventForm(true); };
  const handleEditEvent = (ev: AgendaEvent) => { setEditingEvent(ev); setShowEventForm(true); };

  return (
    <div className="flex flex-col h-[calc(100vh-49px)] -m-6 lg:-m-8">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h1 className="page-header-title">Agenda</h1>
            <Badge variant="outline" className="text-[10px]">Unidade</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleNewEvent}><Plus className="w-4 h-4 mr-1" /> Novo Evento</Button>
          </div>
        </div>

        {page === "calendar" && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
              <Button size="sm" variant="outline" onClick={() => navigate(0)}>Hoje</Button>
              <Button size="sm" variant="outline" onClick={() => navigate(1)}><ChevronRight className="w-4 h-4" /></Button>
              <span className="text-sm font-medium ml-2 capitalize">{periodLabel()}</span>
            </div>
            <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
              {(["month", "week", "day", "list"] as View[]).map(v => (
                <Button key={v} size="sm" variant={view === v ? "default" : "ghost"} className="text-xs h-7 px-3" onClick={() => setView(v)}>
                  {viewLabels[v]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <AgendaSidebar
          currentDate={currentDate}
          onDateSelect={(d) => { setCurrentDate(d); setView("day"); setPage("calendar"); }}
          activeCalendars={activeCalendars}
          onToggleCalendar={toggleCalendar}
          onOpenConfig={() => {}}
        />
        <div className="flex-1 overflow-hidden">
          {page === "detail" && selectedEventId && (
            <AgendaEventDetail eventId={selectedEventId} onBack={() => setPage("calendar")} onEdit={handleEditEvent} />
          )}
          {page === "calendar" && view !== "list" && (
            <AgendaCalendar view={view} currentDate={currentDate} activeCalendars={activeCalendars} onSelectEvent={handleSelectEvent} onSelectDate={handleSelectDate} onCreateEvent={(date) => { setFormDefaultDate(date); setEditingEvent(null); setShowEventForm(true); }} />
          )}
          {page === "calendar" && view === "list" && (
            <AgendaListView currentDate={currentDate} activeCalendars={activeCalendars} onSelectEvent={handleSelectEvent} />
          )}
        </div>
      </div>

      <AgendaEventForm open={showEventForm} onClose={() => setShowEventForm(false)} editingEvent={editingEvent} defaultDate={formDefaultDate} />
    </div>
  );
}
