import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, Settings, Bell } from "lucide-react";
import { mockCalendars, getPendingInvites, type AgendaEvent } from "@/data/agendaData";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface AgendaSidebarProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  activeCalendars: string[];
  onToggleCalendar: (id: string) => void;
  onOpenConfig: () => void;
}

export function AgendaSidebar({ currentDate, onDateSelect, activeCalendars, onToggleCalendar, onOpenConfig }: AgendaSidebarProps) {
  const { toast } = useToast();
  const pendingInvites = getPendingInvites("u-davi");

  const userCalendars = mockCalendars.filter(c => c.nivel === "usuario" || c.nivel === "unidade");
  const redeCalendars = mockCalendars.filter(c => c.nivel === "rede");
  const colabCalendars = mockCalendars.filter(c => c.nivel === "colaborativa");

  const handleInviteAction = (event: AgendaEvent, action: "Aceito" | "Recusado") => {
    toast({
      title: action === "Aceito" ? "Convite aceito" : "Convite recusado",
      description: `Evento "${event.titulo}" ${action === "Aceito" ? "aceito" : "recusado"} com sucesso.`,
    });
  };

  return (
    <aside className="w-[240px] border-r border-border bg-card flex flex-col shrink-0">
      <ScrollArea className="flex-1">
        <div className="p-3">
          {/* Mini Calendar */}
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={(d) => d && onDateSelect(d)}
            className="p-0 pointer-events-auto [&_.rdp-month]:w-full [&_.rdp-table]:w-full"
            locale={ptBR}
          />

          {/* Meus Calendários */}
          <div className="mt-4">
            <div className="section-label mb-2 px-1">Meus Calendários</div>
            {userCalendars.map(cal => (
              <label key={cal.id} className="flex items-center gap-2 px-1 py-1.5 cursor-pointer hover:bg-secondary/50 rounded text-sm">
                <Checkbox
                  checked={activeCalendars.includes(cal.id)}
                  onCheckedChange={() => onToggleCalendar(cal.id)}
                />
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cal.cor }} />
                <span className="truncate">{cal.nome}</span>
              </label>
            ))}
          </div>

          {/* Rede */}
          <div className="mt-4">
            <div className="section-label mb-2 px-1">Rede</div>
            {redeCalendars.map(cal => (
              <label key={cal.id} className="flex items-center gap-2 px-1 py-1.5 cursor-pointer hover:bg-secondary/50 rounded text-sm">
                <Checkbox
                  checked={activeCalendars.includes(cal.id)}
                  onCheckedChange={() => onToggleCalendar(cal.id)}
                />
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cal.cor }} />
                <span className="truncate">{cal.nome}</span>
              </label>
            ))}
          </div>

          {/* Colaborativas */}
          <div className="mt-4">
            <div className="section-label mb-2 px-1">Colaborativas</div>
            {colabCalendars.map(cal => (
              <label key={cal.id} className="flex items-center gap-2 px-1 py-1.5 cursor-pointer hover:bg-secondary/50 rounded text-sm">
                <Checkbox
                  checked={activeCalendars.includes(cal.id)}
                  onCheckedChange={() => onToggleCalendar(cal.id)}
                />
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cal.cor }} />
                <span className="truncate">{cal.nome}</span>
              </label>
            ))}
          </div>

          {/* Convites Pendentes */}
          {pendingInvites.length > 0 && (
            <div className="mt-4">
              <div className="section-label mb-2 px-1 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                Convites Pendentes
                <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse text-[10px] px-1.5">
                  {pendingInvites.length}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {pendingInvites.slice(0, 3).map(ev => (
                  <div key={ev.id} className="px-1 py-2 bg-secondary/30 rounded-md">
                    <div className="text-xs font-medium truncate">{ev.titulo}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {format(parseISO(ev.inicio), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-emerald-600 hover:bg-emerald-50" onClick={() => handleInviteAction(ev, "Aceito")}>
                        <Check className="w-3 h-3 mr-0.5" /> Aceitar
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-red-600 hover:bg-red-50" onClick={() => handleInviteAction(ev, "Recusado")}>
                        <X className="w-3 h-3 mr-0.5" /> Recusar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={onOpenConfig}>
          <Settings className="w-3.5 h-3.5 mr-2" /> Gerenciar Calendários
        </Button>
      </div>
    </aside>
  );
}
