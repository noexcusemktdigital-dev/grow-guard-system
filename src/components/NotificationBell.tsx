import { Bell, FileText, GraduationCap, DollarSign } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const notifications = [
  {
    id: 1,
    icon: DollarSign,
    text: "Novo fechamento disponível - Fev 2026",
    time: "Há 2 horas",
  },
  {
    id: 2,
    icon: FileText,
    text: "Contrato CT-001 vencendo em 15 dias",
    time: "Há 5 horas",
  },
  {
    id: 3,
    icon: GraduationCap,
    text: "Nova aula disponível: Módulo Comercial",
    time: "Há 1 dia",
  },
];

export function NotificationBell() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {notifications.length}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold">Notificações</h4>
        </div>
        <div className="divide-y divide-border">
          {notifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 cursor-pointer transition-colors">
              <n.icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{n.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-border">
          <button className="text-xs text-primary hover:underline w-full text-center">
            Ver todas as notificações
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
