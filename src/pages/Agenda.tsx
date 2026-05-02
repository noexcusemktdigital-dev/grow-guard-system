// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Trash2, Edit2,
  RefreshCw, Unlink, CheckCircle2, Building2,
} from "lucide-react";
import GoogleConnectButton from "@/components/agenda/GoogleConnectButton";
import { useCalendarEvents, useCalendars, useCalendarEventMutations } from "@/hooks/useCalendar";
import {
  useGoogleCalendarConnection,
  useGoogleCalendarConnect,
  useGoogleCalendarDisconnect,
  useGoogleCalendarSync,
} from "@/hooks/useGoogleCalendar";
import { useUnits } from "@/hooks/useUnits";
import {
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay,
  eachDayOfInterval, isSameMonth, isToday, parseISO, getHours, getMinutes, differenceInMinutes,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import { useSearchParams } from "react-router-dom";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7h-22h

type ViewMode = "month" | "week" | "day";
type AgendaEvent = { id: string; title: string; start_at: string; end_at: string; description?: string; location?: string; all_day?: boolean; color?: string; calendar_id?: string; visibility?: string; [key: string]: unknown };

/* ───────── Week View ───────── */
function WeekView({ currentDate, events, onEventClick, onNewEvent }: {
  currentDate: Date; events: AgendaEvent[]; onEventClick: (ev: AgendaEvent) => void; onNewEvent: (day: Date) => void;
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
      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[50px]">
            <div className="text-[10px] text-muted-foreground text-right pr-2 pt-1 border-r border-border">{`${hour}:00`}</div>
            {weekDays.map(day => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvs = (eventsByDay[key] || []).filter(ev => getHours(parseISO(ev.start_at)) === hour);
              return (
                <div key={`${key}-${hour}`} className="border-r border-b border-border/40 relative cursor-pointer hover:bg-muted/10" onClick={() => {
                  const d = new Date(day); d.setHours(hour, 0, 0, 0); onNewEvent(d);
                }}>
                  {dayEvs.map(ev => (
                    <div key={ev.id} className="absolute inset-x-0.5 rounded px-1 py-0.5 text-[10px] truncate cursor-pointer z-10"
                      style={{ background: (ev.color || "#3b82f6") + "22", color: ev.color || "#3b82f6", top: `${(getMinutes(parseISO(ev.start_at)) / 60) * 100}%` }}
                      onClick={e => { e.stopPropagation(); onEventClick(ev); }}>
                      {format(parseISO(ev.start_at), "HH:mm")} {ev.title}
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

/* ───────── Day View ───────── */
function DayView({ currentDate, events, onEventClick, onNewEvent }: {
  currentDate: Date; events: AgendaEvent[]; onEventClick: (ev: AgendaEvent) => void; onNewEvent: (day: Date) => void;
}) {
  const dayEvents = useMemo(() => {
    const key = format(currentDate, "yyyy-MM-dd");
    return (events ?? []).filter(ev => format(parseISO(ev.start_at), "yyyy-MM-dd") === key);
  }, [events, currentDate]);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="bg-muted/30 border-b border-border py-2 px-4 text-sm font-semibold capitalize">
        {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map(hour => {
          const hourEvs = dayEvents.filter(ev => getHours(parseISO(ev.start_at)) === hour);
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
export default function Agenda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Compute date range based on view
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
  const { data: calendars } = useCalendars();
  const { createEvent, updateEvent, deleteEvent } = useCalendarEventMutations();
  const { data: units } = useUnits();

  // Google Calendar
  const { data: googleConnection, isLoading: loadingConnection } = useGoogleCalendarConnection();
  const connectGoogle = useGoogleCalendarConnect("franchise");
  const disconnectGoogle = useGoogleCalendarDisconnect();
  const syncGoogle = useGoogleCalendarSync("franchise");
  const [syncing, setSyncing] = useState(false);
  const isGoogleConnected = googleConnection && !!((googleConnection as Record<string, unknown>).access_token);

  useEffect(() => {
    if (searchParams.get("google_connected") === "true") {
      toast.success("Google Agenda conectado com sucesso!");
      setSearchParams({});
      handleGooglePull();
    }
    if (searchParams.get("google_error")) {
      reportError(new Error(searchParams.get("google_error") || "Erro desconhecido"), { title: "Erro ao conectar Google Agenda", category: "agenda.google_connect" });
      setSearchParams({});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGooglePull() {
    setSyncing(true);
    try {
      const result = await syncGoogle.mutateAsync("pull" as Parameters<typeof syncGoogle.mutateAsync>[0]);
      toast.success(`Sincronizado! ${(result as Record<string, unknown>)?.imported || 0} novos eventos importados.`);
    } catch (e: unknown) { reportError(e, { title: "Erro ao sincronizar", category: "agenda.google_sync" }); }
    setSyncing(false);
  }

  const [formOpen, setFormOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<Tables<'calendar_events'> | null>(null);
  const [editingEvent, setEditingEvent] = useState<Tables<'calendar_events'> | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState(COLORS[4]);
  const [calendarId, setCalendarId] = useState("");
  const [visibility, setVisibility] = useState("rede");
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

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
      const key = format(parseISO(ev.start_at as string), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  function openNewEvent(day?: Date) {
    setEditingEvent(null);
    setTitle(""); setDescription(""); setLocation(""); setAllDay(false); setColor(COLORS[4]); setCalendarId("");
    setVisibility("rede"); setSelectedUnitIds([]);
    if (day) {
      setStartAt(format(day, "yyyy-MM-dd'T'HH:mm"));
      setEndAt(format(new Date(day.getTime() + 3600000), "yyyy-MM-dd'T'HH:mm"));
    } else {
      const now = new Date();
      setStartAt(format(now, "yyyy-MM-dd'T'HH:mm"));
      setEndAt(format(new Date(now.getTime() + 3600000), "yyyy-MM-dd'T'HH:mm"));
    }
    setFormOpen(true);
  }

  function openEditEvent(ev: AgendaEvent) {
    setEditingEvent(ev);
    setTitle(ev.title); setDescription(ev.description || "");
    setStartAt(format(parseISO(ev.start_at), "yyyy-MM-dd'T'HH:mm"));
    setEndAt(format(parseISO(ev.end_at), "yyyy-MM-dd'T'HH:mm"));
    setLocation(ev.location || ""); setAllDay(ev.all_day || false);
    setColor(ev.color || COLORS[4]); setCalendarId(ev.calendar_id || "");
    setVisibility(ev.visibility || "rede"); setSelectedUnitIds([]);
    setDetailEvent(null); setFormOpen(true);
  }

  function handleSave() {
    if (!title.trim()) { reportError(new Error("Informe o título"), { title: "Informe o título", category: "agenda.validation" }); return; }
    if (!startAt || !endAt) { reportError(new Error("Informe data/hora"), { title: "Informe data/hora", category: "agenda.validation" }); return; }
    const payload: Record<string, unknown> = {
      title, description: description || undefined,
      start_at: new Date(startAt).toISOString(), end_at: new Date(endAt).toISOString(),
      location: location || undefined, all_day: allDay, color,
      calendar_id: calendarId || undefined,
      visibility,
    };
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, ...payload }, {
        onSuccess: () => { setFormOpen(false); toast.success("Evento atualizado!"); },
      });
    } else {
      createEvent.mutate(payload as TablesInsert<'calendar_events'>, {
        onSuccess: () => { setFormOpen(false); toast.success("Evento criado!"); },
      });
    }
  }

  function handleDelete(id: string) {
    deleteEvent.mutate(id, {
      onSuccess: () => { setDetailEvent(null); toast.success("Evento excluído!"); },
    });
  }

  function toggleUnit(unitId: string) {
    setSelectedUnitIds(prev => prev.includes(unitId) ? prev.filter(u => u !== unitId) : [...prev, unitId]);
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
    return <div className="w-full space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-[600px]" /></div>;
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Agenda</h1>
          <Badge variant="outline" className="text-[10px]">Franqueadora</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isGoogleConnected ? (
            <>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Google conectado
              </Badge>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={handleGooglePull} disabled={syncing}>
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} /> Sincronizar
              </Button>
              <Button size="sm" variant="ghost" className="gap-1 text-xs text-destructive" onClick={() => disconnectGoogle.mutate()}>
                <Unlink className="w-3.5 h-3.5" /> Desconectar
              </Button>
            </>
          ) : (
            <GoogleConnectButton disabled={loadingConnection} portal="franchise" />
          )}
          <Button size="sm" onClick={() => openNewEvent()}>
            <Plus className="w-4 h-4 mr-1" /> Novo Evento
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0 space-y-4 hidden lg:block">
          <Card className="p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Calendários</p>
            {(calendars ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum calendário</p>
            ) : (
              (calendars ?? []).map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: c.color || "#3b82f6" }} />
                  <span className="text-xs">{c.name}</span>
                </div>
              ))
            )}
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Legenda</p>
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary/60" /> Eventos da rede</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Apenas matriz</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pessoal</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Clientes</div>
            </div>
          </Card>
        </div>

        {/* Calendar Area */}
        <div className="flex-1 min-w-0">
          {/* Navigation + View Toggle */}
          <div className="flex items-center justify-between gap-2 mb-4">
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
                    onClick={() => openNewEvent(day)}
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
            <WeekView currentDate={currentDate} events={(events ?? []) as Tables<'calendar_events'>[]} onEventClick={setDetailEvent} onNewEvent={openNewEvent} />
          )}

          {/* Day View */}
          {viewMode === "day" && (
            <DayView currentDate={currentDate} events={(events ?? []) as Tables<'calendar_events'>[]} onEventClick={setDetailEvent} onNewEvent={openNewEvent} />
          )}
        </div>
      </div>


      {/* Event Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do evento" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Início</Label><Input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} /></div>
              <div><Label>Fim</Label><Input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={allDay} onCheckedChange={setAllDay} id="allday" />
              <Label htmlFor="allday">Dia todo</Label>
            </div>
            <div><Label>Local</Label><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Endereço ou link" /></div>
            <div><Label>Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} /></div>

            {/* Visibility */}
            <div>
              <Label>Visibilidade</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoal">Pessoal (só eu)</SelectItem>
                  <SelectItem value="private">Interna (Matriz)</SelectItem>
                  <SelectItem value="rede">Toda a rede (Franqueados)</SelectItem>
                  <SelectItem value="clientes">Clientes finais</SelectItem>
                  <SelectItem value="unidades">Unidades selecionadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Unit selector */}
            {visibility === "unidades" && (units ?? []).length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Selecione as unidades</Label>
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-3">
                  {(units ?? []).map(u => (
                    <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={selectedUnitIds.includes(u.id)} onCheckedChange={() => toggleUnit(u.id)} />
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm">{u.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(calendars ?? []).length > 0 && (
              <div>
                <Label>Calendário</Label>
                <Select value={calendarId} onValueChange={setCalendarId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(calendars ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
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
                {detailEvent.visibility && (
                  <Badge variant="secondary" className="text-[10px]">
                    {detailEvent.visibility === "rede" ? "Toda a rede" : detailEvent.visibility === "private" ? "Apenas matriz" : detailEvent.visibility === "pessoal" ? "Pessoal" : detailEvent.visibility === "clientes" ? "Clientes" : "Unidades selecionadas"}
                  </Badge>
                )}
                {detailEvent.description && (
                  <p className="text-foreground/80 whitespace-pre-wrap">{detailEvent.description}</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEditEvent(detailEvent)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(detailEvent.id)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
