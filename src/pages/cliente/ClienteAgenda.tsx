import { useState, useMemo, useEffect } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Trash2, Edit2,
  RefreshCw, Unlink, CheckCircle2, CalendarPlus,
} from "lucide-react";
import GoogleConnectButton from "@/components/agenda/GoogleConnectButton";
import { useCalendarEvents, useCalendarEventMutations } from "@/hooks/useCalendar";
import type { AgendaEvent } from "@/types/agenda";
import {
  useGoogleCalendarConnection,
  useGoogleCalendarDisconnect,
  useGoogleCalendarSync,
} from "@/hooks/useGoogleCalendar";
import {
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay,
  eachDayOfInterval, isSameMonth, isToday, parseISO, getHours, getMinutes, differenceInMinutes,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

type ViewMode = "month" | "week" | "day";

/* ───────── Week View ───────── */
function WeekView({ currentDate, events, onEventClick, onDayClick }: {
  currentDate: Date; events: AgendaEvent[]; onEventClick: (ev: AgendaEvent) => void; onDayClick: (day: Date, hour: number) => void;
}) {
  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate, { locale: ptBR }) });

  const eventsByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    (events ?? []).forEach(ev => {
      const key = format(parseISO(ev.start_at), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  // All-day events
  const allDayByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    (events ?? []).forEach(ev => {
      if (!ev.all_day) return;
      const key = format(parseISO(ev.start_at), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const hasAllDay = Object.values(allDayByDay).some(arr => arr.length > 0);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        <div className="bg-muted/30 border-b border-r border-border py-2" />
        {weekDays.map(day => (
          <div key={day.toISOString()} className={`text-center py-2 border-b border-r border-border text-[11px] font-semibold ${isToday(day) ? "bg-primary/5 text-primary" : "bg-muted/30 text-muted-foreground"}`}>
            {format(day, "EEE", { locale: ptBR })} <span className="font-bold">{format(day, "d")}</span>
          </div>
        ))}
      </div>
      {/* All-day row */}
      {hasAllDay && (
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
          <div className="text-[10px] text-muted-foreground text-right pr-2 pt-1 border-r border-border">Dia todo</div>
          {weekDays.map(day => {
            const key = format(day, "yyyy-MM-dd");
            const dayAllDay = allDayByDay[key] || [];
            return (
              <div key={key} className="border-r border-border/40 p-0.5 min-h-[28px]">
                {dayAllDay.map(ev => (
                  <div key={ev.id} className="rounded px-1 py-0.5 text-[10px] truncate cursor-pointer mb-0.5"
                    style={{ background: (ev.color || "#3b82f6") + "22", color: ev.color || "#3b82f6" }}
                    onClick={() => onEventClick(ev)}>
                    {ev.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[50px]">
            <div className="text-[10px] text-muted-foreground text-right pr-2 pt-1 border-r border-border">{`${hour}:00`}</div>
            {weekDays.map(day => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvs = (eventsByDay[key] || []).filter(ev => !ev.all_day && getHours(parseISO(ev.start_at)) === hour);
              return (
                <div key={`${key}-${hour}`} className="border-r border-b border-border/40 relative cursor-pointer hover:bg-muted/10" onClick={() => onDayClick(day, hour)}>
                  {dayEvs.map(ev => {
                    const start = parseISO(ev.start_at);
                    const end = parseISO(ev.end_at);
                    const durationMin = Math.max(differenceInMinutes(end, start), 30);
                    const heightPx = Math.max((durationMin / 60) * 50, 20);
                    return (
                      <div key={ev.id} className="absolute inset-x-0.5 rounded px-1 py-0.5 text-[10px] truncate cursor-pointer z-10"
                        style={{
                          background: (ev.color || "#3b82f6") + "22",
                          color: ev.color || "#3b82f6",
                          top: `${(getMinutes(start) / 60) * 100}%`,
                          height: `${heightPx}px`,
                        }}
                        onClick={e => { e.stopPropagation(); onEventClick(ev); }}>
                        {format(start, "HH:mm")} {ev.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Day View ───────── */
function DayView({ currentDate, events, onEventClick, onNewEvent }: {
  currentDate: Date; events: AgendaEvent[]; onEventClick: (ev: AgendaEvent) => void; onNewEvent: (day: Date) => void;
}) {
  const dayKey = format(currentDate, "yyyy-MM-dd");
  const dayEvents = useMemo(() => {
    return (events ?? []).filter(ev => format(parseISO(ev.start_at), "yyyy-MM-dd") === dayKey);
  }, [events, dayKey]);

  const allDayEvents = dayEvents.filter(ev => ev.all_day);
  const timedEvents = dayEvents.filter(ev => !ev.all_day);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="bg-muted/30 border-b border-border py-2 px-4 text-sm font-semibold capitalize flex items-center justify-between">
        <span>{format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
        <Badge variant="secondary" className="text-[10px]">{dayEvents.length} evento{dayEvents.length !== 1 ? "s" : ""}</Badge>
      </div>
      {allDayEvents.length > 0 && (
        <div className="border-b border-border p-2 space-y-1 bg-muted/10">
          <span className="text-[10px] text-muted-foreground font-medium">Dia todo</span>
          {allDayEvents.map(ev => (
            <div key={ev.id} className="rounded px-2 py-1 text-xs cursor-pointer"
              style={{ background: (ev.color || "#3b82f6") + "22", color: ev.color || "#3b82f6" }}
              onClick={() => onEventClick(ev)}>
              <span className="font-medium">{ev.title}</span>
            </div>
          ))}
        </div>
      )}
      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map(hour => {
          const hourEvs = timedEvents.filter(ev => getHours(parseISO(ev.start_at)) === hour);
          return (
            <div key={hour} className="grid grid-cols-[60px_1fr] min-h-[60px]">
              <div className="text-[11px] text-muted-foreground text-right pr-3 pt-1 border-r border-border">{`${hour}:00`}</div>
              <div className="border-b border-border/40 relative cursor-pointer hover:bg-muted/10 px-2" onClick={() => {
                const d = new Date(currentDate); d.setHours(hour, 0, 0, 0); onNewEvent(d);
              }}>
                {hourEvs.map(ev => {
                  const start = parseISO(ev.start_at);
                  const end = parseISO(ev.end_at);
                  const duration = Math.max(differenceInMinutes(end, start), 30);
                  return (
                    <div key={ev.id} className="rounded px-2 py-1 text-xs mb-1 cursor-pointer"
                      style={{ background: (ev.color || "#3b82f6") + "22", color: ev.color || "#3b82f6", minHeight: `${Math.max(duration / 60 * 50, 24)}px` }}
                      onClick={e => { e.stopPropagation(); onEventClick(ev); }}>
                      <span className="font-medium">{ev.title}</span>
                      <span className="ml-2 opacity-70">{format(start, "HH:mm")} — {format(end, "HH:mm")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Main Component ───────── */
export default function ClienteAgenda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const { computedStartDate, computedEndDate } = useMemo(() => {
    if (viewMode === "month") {
      const ms = startOfMonth(currentDate);
      const me = endOfMonth(currentDate);
      return {
        computedStartDate: format(startOfWeek(ms, { locale: ptBR }), "yyyy-MM-dd'T'00:00:00"),
        computedEndDate: format(endOfWeek(me, { locale: ptBR }), "yyyy-MM-dd'T'23:59:59"),
      };
    } else if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { locale: ptBR });
      const we = endOfWeek(currentDate, { locale: ptBR });
      return {
        computedStartDate: format(ws, "yyyy-MM-dd'T'00:00:00"),
        computedEndDate: format(we, "yyyy-MM-dd'T'23:59:59"),
      };
    } else {
      return {
        computedStartDate: format(startOfDay(currentDate), "yyyy-MM-dd'T'00:00:00"),
        computedEndDate: format(endOfDay(currentDate), "yyyy-MM-dd'T'23:59:59"),
      };
    }
  }, [currentDate, viewMode]);

  const { data: events, isLoading } = useCalendarEvents(computedStartDate, computedEndDate);
  const { createEvent, updateEvent, deleteEvent } = useCalendarEventMutations();

  // Google Calendar
  const { data: googleConnection, isLoading: loadingConnection } = useGoogleCalendarConnection();
  const disconnectGoogle = useGoogleCalendarDisconnect();
  const syncGoogle = useGoogleCalendarSync();
  const [syncing, setSyncing] = useState(false);
  const isGoogleConnected = googleConnection && !!((googleConnection as Record<string, unknown>).access_token);

  useEffect(() => {
    if (searchParams.get("google_connected") === "true") {
      toast.success("Google Agenda conectado com sucesso!");
      setSearchParams({});
      handleGooglePull();
    }
    if (searchParams.get("google_error")) {
      toast.error("Erro ao conectar Google Agenda: " + searchParams.get("google_error"));
      setSearchParams({});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGooglePull() {
    setSyncing(true);
    try {
      const result = await syncGoogle.mutateAsync({ action: "pull" });
      const imported = (result as Record<string, unknown>)?.imported || 0;
      toast.success(`Sincronização concluída — ${imported} novo(s) evento(s) importado(s) do Google Agenda`);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro ao sincronizar"); }
    setSyncing(false);
  }

  const [formOpen, setFormOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<Tables<'calendar_events'> | null>(null);
  const [editingEvent, setEditingEvent] = useState<Tables<'calendar_events'> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState(COLORS[4]);

  // Month view data
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = useMemo(() => {
    const s = startOfWeek(monthStart, { locale: ptBR });
    const e = endOfWeek(monthEnd, { locale: ptBR });
    return eachDayOfInterval({ start: s, end: e });
  }, [currentDate]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    (events ?? []).forEach(ev => {
      const key = format(parseISO(ev.start_at), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const eventCount = (events ?? []).length;

  function resetForm() {
    setEditingEvent(null);
    setTitle(""); setDescription(""); setLocation(""); setAllDay(false); setColor(COLORS[4]);
    const now = new Date();
    setStartAt(format(now, "yyyy-MM-dd'T'HH:mm"));
    setEndAt(format(new Date(now.getTime() + 3600000), "yyyy-MM-dd'T'HH:mm"));
  }

  function openNewEvent(day?: Date) {
    resetForm();
    if (day) {
      setStartAt(format(day, "yyyy-MM-dd'T'HH:mm"));
      setEndAt(format(new Date(day.getTime() + 3600000), "yyyy-MM-dd'T'HH:mm"));
    }
    setFormOpen(true);
  }

  function openEditEvent(ev: AgendaEvent) {
    setEditingEvent(ev);
    setTitle(ev.title); setDescription(ev.description || "");
    setStartAt(format(parseISO(ev.start_at), "yyyy-MM-dd'T'HH:mm"));
    setEndAt(format(parseISO(ev.end_at), "yyyy-MM-dd'T'HH:mm"));
    setLocation(ev.location || ""); setAllDay(ev.all_day || false);
    setColor(ev.color || COLORS[4]);
    setDetailEvent(null); setFormOpen(true);
  }

  function handleSave() {
    if (!title.trim()) { toast.error("Informe o título"); return; }
    if (!startAt || !endAt) { toast.error("Informe data/hora"); return; }
    if (new Date(endAt) <= new Date(startAt)) {
      toast.error("A data/hora de fim deve ser posterior à de início");
      return;
    }
    const payload: Record<string, unknown> = {
      title, description: description || undefined,
      start_at: new Date(startAt).toISOString(), end_at: new Date(endAt).toISOString(),
      location: location || undefined, all_day: allDay, color,
    };
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, ...payload }, {
        onSuccess: async (updatedEvent) => {
          setFormOpen(false);
          toast.success("Evento atualizado!");
          if (isGoogleConnected && updatedEvent) {
            try {
              await syncGoogle.mutateAsync({ action: "push", event: updatedEvent as unknown as Record<string, unknown> });
            } catch {
              toast.warning("Evento atualizado no sistema, mas não foi possível sincronizar com o Google Agenda.");
            }
          }
        },
      });
    } else {
      createEvent.mutate(payload, {
        onSuccess: async (newEvent) => {
          setFormOpen(false);
          toast.success("Evento criado!");
          if (isGoogleConnected && newEvent) {
            try {
              await syncGoogle.mutateAsync({ action: "push", event: newEvent as unknown as Record<string, unknown> });
            } catch {
              toast.warning("Evento criado no sistema, mas não foi possível sincronizar com o Google Agenda.");
            }
          }
        },
      });
    }
  }

  function confirmDelete(id: string) {
    setDeleteConfirmId(id);
  }

  function executeDelete() {
    if (!deleteConfirmId) return;
    const eventToDelete = deleteConfirmId ? (events as AgendaEvent[] | undefined)?.find(e => (e as Record<string, unknown>).id === deleteConfirmId) : null;
    deleteEvent.mutate(deleteConfirmId, {
      onSuccess: async () => {
        setDetailEvent(null);
        setDeleteConfirmId(null);
        toast.success("Evento excluído!");
        if (isGoogleConnected && (eventToDelete as Record<string, unknown> | null | undefined)?.google_event_id) {
          try {
            await syncGoogle.mutateAsync({ action: "delete", event: eventToDelete as unknown as Record<string, unknown> });
          } catch {
            // silencioso - evento já foi deletado localmente
          }
        }
      },
    });
  }

  function handleDayClick(day: Date) {
    const key = format(day, "yyyy-MM-dd");
    const dayEvs = eventsByDay[key] || [];
    if (dayEvs.length > 0) {
      // If there are events, show the first one's detail
      setDetailEvent(dayEvs[0]);
    } else {
      // If no events, open creation form for that day
      const d = new Date(day);
      d.setHours(9, 0, 0, 0);
      openNewEvent(d);
    }
  }

  function navigatePrev() {
    if (viewMode === "month") setCurrentDate(d => subMonths(d, 1));
    else if (viewMode === "week") setCurrentDate(d => subWeeks(d, 1));
    else setCurrentDate(d => subDays(d, 1));
  }

  function navigateNext() {
    if (viewMode === "month") setCurrentDate(d => addMonths(d, 1));
    else if (viewMode === "week") setCurrentDate(d => addWeeks(d, 1));
    else setCurrentDate(d => addDays(d, 1));
  }

  function getDateLabel() {
    if (viewMode === "month") return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { locale: ptBR });
      const we = endOfWeek(currentDate, { locale: ptBR });
      return `${format(ws, "d MMM", { locale: ptBR })} — ${format(we, "d MMM yyyy", { locale: ptBR })}`;
    }
    return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  }

  if (isLoading) {
    return <div className="w-full space-y-6 p-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-[600px]" /></div>;
  }

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Agenda</h1>
          {eventCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {eventCount} evento{eventCount !== 1 ? "s" : ""} {viewMode === "month" ? "no mês" : viewMode === "week" ? "na semana" : "no dia"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isGoogleConnected ? (
            <>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Google conectado
              </Badge>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={handleGooglePull} disabled={syncing}>
                {syncing
                  ? <><RefreshCw className="w-3 h-3 animate-spin" /> Sincronizando...</>
                  : <><RefreshCw className="w-3 h-3" /> Importar do Google</>
                }
              </Button>
              <Button size="sm" variant="ghost" className="gap-1 text-xs text-destructive" onClick={() => disconnectGoogle.mutate()}>
                <Unlink className="w-3.5 h-3.5" /> Desconectar
              </Button>
            </>
          ) : (
            <GoogleConnectButton disabled={loadingConnection} />
          )}
          <Button size="sm" onClick={() => openNewEvent()}>
            <Plus className="w-4 h-4 mr-1" /> Novo Evento
          </Button>
        </div>
      </div>

      {/* Navigation + View Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={navigatePrev} aria-label="Voltar">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={navigateNext} aria-label="Avançar">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold capitalize ml-1">{getDateLabel()}</span>
        </div>
        <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/50 border">
          {([
            { key: "month" as ViewMode, label: "Mês" },
            { key: "week" as ViewMode, label: "Semana" },
            { key: "day" as ViewMode, label: "Dia" },
          ]).map(v => (
            <Button key={v.key} variant={viewMode === v.key ? "default" : "ghost"} size="sm" className="h-7 px-3 text-xs" onClick={() => setViewMode(v.key)}>
              {v.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {eventCount === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <CalendarPlus className="w-10 h-10 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nenhum evento neste período</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Crie seu primeiro evento para começar a organizar sua agenda</p>
          </div>
          <Button size="sm" onClick={() => openNewEvent()}>
            <Plus className="w-4 h-4 mr-1" /> Criar Evento
          </Button>
        </div>
      )}

      {/* Month View */}
      {viewMode === "month" && (
        <div className="grid grid-cols-7 border border-border rounded-xl overflow-hidden">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-2 bg-muted/30 border-b border-border">{d}</div>
          ))}
          {days.map(day => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay[key] || [];
            const inMonth = isSameMonth(day, currentDate);
            return (
              <div
                key={key}
                className={`min-h-[90px] border-b border-r border-border p-1 cursor-pointer transition-colors hover:bg-muted/20 ${!inMonth ? "bg-muted/10 opacity-40" : ""} ${isToday(day) ? "bg-primary/5" : ""}`}
                onClick={() => handleDayClick(day)}
              >
                <span className={`text-[11px] font-medium block mb-0.5 ${isToday(day) ? "text-primary font-bold" : "text-foreground"}`}>
                  {format(day, "d")}
                </span>
                {dayEvents.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    className="text-[10px] truncate rounded px-1 py-0.5 mb-0.5 cursor-pointer"
                    style={{ background: (ev.color || "#3b82f6") + "22", color: ev.color || "#3b82f6" }}
                    onClick={e => { e.stopPropagation(); setDetailEvent(ev); }}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <WeekView
          currentDate={currentDate}
          events={events ?? []}
          onEventClick={setDetailEvent}
          onDayClick={(day, hour) => {
            const d = new Date(day); d.setHours(hour, 0, 0, 0);
            openNewEvent(d);
          }}
        />
      )}

      {/* Day View */}
      {viewMode === "day" && (
        <DayView currentDate={currentDate} events={events ?? []} onEventClick={setDetailEvent} onNewEvent={openNewEvent} />
      )}


      {/* Event Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) resetForm(); setFormOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do evento" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={allDay} onCheckedChange={setAllDay} id="allday" />
              <Label htmlFor="allday">Dia todo</Label>
            </div>
            {allDay ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Data início</Label><Input type="date" value={startAt.slice(0, 10)} onChange={e => { setStartAt(e.target.value + "T00:00"); setEndAt(e.target.value + "T23:59"); }} /></div>
                <div><Label>Data fim</Label><Input type="date" value={endAt.slice(0, 10)} onChange={e => setEndAt(e.target.value + "T23:59")} /></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Início</Label><Input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} /></div>
                <div><Label>Fim</Label><Input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} /></div>
              </div>
            )}
            <div><Label>Local</Label><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Endereço ou link" /></div>
            <div><Label>Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} /></div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createEvent.isPending || updateEvent.isPending}>
              {editingEvent ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Sheet */}
      <Sheet open={!!detailEvent} onOpenChange={open => !open && setDetailEvent(null)}>
        <SheetContent>
          {detailEvent && (
            <div className="space-y-5 pt-2">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: detailEvent.color || "#3b82f6" }} />
                  {detailEvent.title}
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {detailEvent.all_day
                    ? format(parseISO(detailEvent.start_at), "dd/MM/yyyy")
                    : `${format(parseISO(detailEvent.start_at), "dd/MM/yyyy HH:mm")} — ${format(parseISO(detailEvent.end_at), "HH:mm")}`}
                </div>
                {detailEvent.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" /> {detailEvent.location}
                  </div>
                )}
                {detailEvent.description && (
                  <p className="text-foreground/80 whitespace-pre-wrap">{detailEvent.description}</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEditEvent(detailEvent)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => confirmDelete(detailEvent.id)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={open => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O evento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
