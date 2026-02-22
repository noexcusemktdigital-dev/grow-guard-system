import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Plus, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useCalendarEvents, useCalendarEventMutations } from "@/hooks/useCalendar";
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Agenda() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("09:00");

  const startStr = startOfMonth(currentDate).toISOString();
  const endStr = endOfMonth(currentDate).toISOString();
  const { data: events, isLoading } = useCalendarEvents(startStr, endStr);
  const { createEvent } = useCalendarEventMutations();

  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  const startDay = getDay(startOfMonth(currentDate));

  const handleCreate = () => {
    if (!newTitle.trim() || !newDate) { toast({ title: "Preencha título e data", variant: "destructive" }); return; }
    const startAt = `${newDate}T${newTime}:00`;
    const endAt = `${newDate}T${String(Number(newTime.split(":")[0]) + 1).padStart(2, "0")}:${newTime.split(":")[1]}:00`;
    createEvent.mutate({ title: newTitle, start_at: startAt, end_at: endAt });
    setShowForm(false);
    setNewTitle(""); setNewDate("");
    toast({ title: "Evento criado" });
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="page-header-title">Agenda</h1>
          <Badge variant="outline" className="text-[10px]">Franqueadora</Badge>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Novo Evento</Button>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setCurrentDate(d => subMonths(d, 1))}><ChevronLeft className="w-4 h-4" /></Button>
        <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
        <Button size="sm" variant="outline" onClick={() => setCurrentDate(d => addMonths(d, 1))}><ChevronRight className="w-4 h-4" /></Button>
        <span className="text-sm font-medium ml-2 capitalize">{format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}</span>
      </div>

      {/* Calendar grid */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/50">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} className="min-h-[80px] border-t border-r border-border/30" />)}
          {days.map(day => {
            const dayEvents = (events ?? []).filter(e => isSameDay(new Date(e.start_at), day));
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={`min-h-[80px] border-t border-r border-border/30 p-1 ${isToday ? "bg-primary/5" : ""}`}>
                <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>{format(day, "d")}</span>
                {dayEvents.slice(0, 2).map(e => (
                  <div key={e.id} className="mt-0.5 px-1 py-0.5 rounded text-[10px] bg-primary/15 text-primary truncate">{e.title}</div>
                ))}
                {dayEvents.length > 2 && <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 2}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {(events ?? []).length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Inbox className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Sua agenda está vazia. Crie seu primeiro evento.</p>
        </div>
      )}

      {/* New Event Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Evento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} /></div>
            <div><Label>Data *</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
            <div><Label>Horário</Label><Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar Evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
