import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Trash2, Edit2, ExternalLink,
  RefreshCw, Unlink, CheckCircle2,
} from "lucide-react";
import { useCalendarEvents, useCalendars, useCalendarEventMutations } from "@/hooks/useCalendar";
import {
  useGoogleCalendarConnection,
  useGoogleCalendarConnect,
  useGoogleCalendarExchangeCode,
  useGoogleCalendarDisconnect,
  useGoogleCalendarSync,
} from "@/hooks/useGoogleCalendar";
import {
  addMonths, subMonths, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function FranqueadoAgenda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = format(startOfWeek(monthStart, { locale: ptBR }), "yyyy-MM-dd'T'00:00:00");
  const endDate = format(endOfWeek(monthEnd, { locale: ptBR }), "yyyy-MM-dd'T'23:59:59");

  const { data: events, isLoading } = useCalendarEvents(startDate, endDate);
  const { data: calendars } = useCalendars();
  const { createEvent, updateEvent, deleteEvent } = useCalendarEventMutations();

  // Google Calendar
  const { data: googleConnection, isLoading: loadingConnection } = useGoogleCalendarConnection();
  const connectGoogle = useGoogleCalendarConnect();
  const exchangeCode = useGoogleCalendarExchangeCode();
  const disconnectGoogle = useGoogleCalendarDisconnect();
  const syncGoogle = useGoogleCalendarSync();
  const [syncing, setSyncing] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      const redirectUri = `${window.location.origin}/franqueado/agenda`;
      exchangeCode.mutate({ code, redirectUri }, {
        onSuccess: () => {
          setSearchParams({});
          handleGooglePull();
        },
        onError: (e: any) => toast.error(e.message || "Erro ao conectar Google"),
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGoogleConnect() {
    try {
      const redirectUri = `${window.location.origin}/franqueado/agenda`;
      const url = await connectGoogle.mutateAsync(redirectUri);
      window.location.href = url;
    } catch (e: any) {
      toast.error(e.message || "Erro ao iniciar conexão");
    }
  }

  async function handleGooglePull() {
    setSyncing(true);
    try {
      const result = await syncGoogle.mutateAsync("pull" as any);
      toast.success(`Sincronizado! ${(result as any)?.imported || 0} novos eventos importados.`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao sincronizar");
    }
    setSyncing(false);
  }

  const [formOpen, setFormOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState(COLORS[4]);
  const [calendarId, setCalendarId] = useState<string>("");

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

  function openNewEvent(day?: Date) {
    setEditingEvent(null);
    setTitle("");
    setDescription("");
    setLocation("");
    setAllDay(false);
    setColor(COLORS[4]);
    setCalendarId("");
    if (day) {
      setStartAt(format(day, "yyyy-MM-dd'T'09:00"));
      setEndAt(format(day, "yyyy-MM-dd'T'10:00"));
    } else {
      const now = new Date();
      setStartAt(format(now, "yyyy-MM-dd'T'HH:mm"));
      setEndAt(format(new Date(now.getTime() + 3600000), "yyyy-MM-dd'T'HH:mm"));
    }
    setFormOpen(true);
  }

  function openEditEvent(ev: any) {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDescription(ev.description || "");
    setStartAt(format(parseISO(ev.start_at), "yyyy-MM-dd'T'HH:mm"));
    setEndAt(format(parseISO(ev.end_at), "yyyy-MM-dd'T'HH:mm"));
    setLocation(ev.location || "");
    setAllDay(ev.all_day || false);
    setColor(ev.color || COLORS[4]);
    setCalendarId(ev.calendar_id || "");
    setDetailEvent(null);
    setFormOpen(true);
  }

  function handleSave() {
    if (!title.trim()) { toast.error("Informe o título"); return; }
    if (!startAt || !endAt) { toast.error("Informe data/hora"); return; }
    const payload = {
      title,
      description: description || undefined,
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      location: location || undefined,
      all_day: allDay,
      color,
      calendar_id: calendarId || undefined,
    };
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, ...payload }, {
        onSuccess: () => { setFormOpen(false); toast.success("Evento atualizado!"); },
      });
    } else {
      createEvent.mutate(payload, {
        onSuccess: () => { setFormOpen(false); toast.success("Evento criado!"); },
      });
    }
  }

  function handleDelete(id: string) {
    deleteEvent.mutate(id, {
      onSuccess: () => { setDetailEvent(null); toast.success("Evento excluído!"); },
    });
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Agenda</h1>
          <Badge variant="outline" className="text-[10px]">Unidade</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {googleConnection ? (
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
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={handleGoogleConnect} disabled={connectGoogle.isPending || loadingConnection}>
              <ExternalLink className="w-3.5 h-3.5" /> Conectar Google Agenda
            </Button>
          )}
          <Button size="sm" onClick={() => openNewEvent()}>
            <Plus className="w-4 h-4 mr-1" /> Novo Evento
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar calendários */}
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
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary/60" /> Meus eventos</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Franqueadora</div>
            </div>
          </Card>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentDate(d => subMonths(d, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentDate(d => addMonths(d, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold capitalize ml-1">
              {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>

          <div className="grid grid-cols-7 border border-border rounded-xl overflow-hidden">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-2 bg-muted/30 border-b border-border">
                {d}
              </div>
            ))}
            {days.map(day => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDay[key] || [];
              const inMonth = isSameMonth(day, currentDate);
              return (
                <div
                  key={key}
                  className={`min-h-[90px] border-b border-r border-border p-1 cursor-pointer transition-colors hover:bg-muted/20
                    ${!inMonth ? "bg-muted/10 opacity-40" : ""}
                    ${isToday(day) ? "bg-primary/5" : ""}
                  `}
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
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3}</span>
                  )}
                </div>
              );
            })}
          </div>
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
                {detailEvent.description && (
                  <p className="text-foreground/80 whitespace-pre-wrap">{detailEvent.description}</p>
                )}
                {(detailEvent as any).readonly && (
                  <Badge variant="secondary" className="text-[10px]">Somente leitura (Franqueadora)</Badge>
                )}
              </div>
              {!(detailEvent as any).readonly && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEditEvent(detailEvent)}>
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(detailEvent.id)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
