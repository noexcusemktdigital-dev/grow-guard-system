import { useNavigate } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type AgendaEvent, getEventColor } from "@/data/agendaData";
import { format, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  eventos: AgendaEvent[];
}

export function HomeAgenda({ eventos }: Props) {
  const navigate = useNavigate();

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Próximos Compromissos
        </h3>
        <Calendar className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-2">
        {eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento próximo</p>
        ) : (
          eventos.map(e => {
            const dt = parseISO(e.inicio);
            const today = isToday(dt);
            return (
              <div
                key={e.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer hover:bg-muted/50 ${
                  today ? "bg-primary/5 border border-primary/20" : ""
                }`}
                onClick={() => navigate("/franqueadora/agenda")}
              >
                <div
                  className="w-1 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: getEventColor(e.calendarId) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{e.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {today ? "Hoje" : format(dt, "dd MMM", { locale: ptBR })} · {e.allDay ? "Dia todo" : format(dt, "HH:mm")}
                    </span>
                    <Badge variant="outline" className="text-[10px]">{e.tipo}</Badge>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <Button variant="ghost" size="sm" className="mt-3 text-xs w-full" onClick={() => navigate("/franqueadora/agenda")}>
        Ver agenda completa <ArrowRight className="w-3.5 h-3.5 ml-1" />
      </Button>
    </div>
  );
}
