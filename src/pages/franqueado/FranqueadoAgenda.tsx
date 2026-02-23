import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { useCalendarEvents } from "@/hooks/useCalendar";
import { addMonths, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FranqueadoAgenda() {
  const { data: events, isLoading } = useCalendarEvents();
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigate = (dir: -1 | 0 | 1) => {
    if (dir === 0) { setCurrentDate(new Date()); return; }
    setCurrentDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const sortedEvents = (events ?? [])
    .filter(e => new Date(e.start_at) >= new Date())
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="page-header-title">Agenda</h1>
          <Badge variant="outline" className="text-[10px]">Unidade</Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => navigate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
        <Button size="sm" variant="outline" onClick={() => navigate(0)}>Hoje</Button>
        <Button size="sm" variant="outline" onClick={() => navigate(1)}><ChevronRight className="w-4 h-4" /></Button>
        <span className="text-sm font-medium ml-2 capitalize">{format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}</span>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Sua agenda está vazia</p>
          <p className="text-xs text-muted-foreground mt-1">Nenhum evento futuro encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map(e => (
            <div key={e.id} className="glass-card p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-sm text-primary font-bold">{format(new Date(e.start_at), "dd")}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{format(new Date(e.start_at), "MMM", { locale: ptBR })}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {e.all_day ? "Dia todo" : `${format(new Date(e.start_at), "HH:mm")} — ${format(new Date(e.end_at), "HH:mm")}`}
                  {e.location && ` · ${e.location}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
