import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useClienteNotifications, useClienteContentMutations } from "@/hooks/useClienteContent";
import { useAuth } from "@/contexts/AuthContext";
import { playSound } from "@/lib/sounds";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotificationBell() {
  const { role } = useAuth();
  const isCliente = role === "cliente_admin" || role === "cliente_user";
  const { data: notifications } = useClienteNotifications();
  const { markNotificationRead } = useClienteContentMutations();
  const navigate = useNavigate();
  const prevCountRef = useRef(0);

  const unread = notifications?.filter(n => !n.is_read) || [];
  const displayList = notifications?.slice(0, 10) || [];

  // Play sound when new unread notifications arrive
  useEffect(() => {
    if (unread.length > prevCountRef.current && prevCountRef.current > 0) {
      playSound("notification");
    }
    prevCountRef.current = unread.length;
  }, [unread.length]);

  const handleClick = (n: any) => {
    if (!n.is_read) {
      markNotificationRead.mutate(n.id);
    }
    if (n.action_url) {
      navigate(n.action_url);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h4 className="text-sm font-semibold">Notificações</h4>
          {unread.length > 0 && (
            <span className="text-[10px] text-muted-foreground">{unread.length} não lida{unread.length > 1 ? "s" : ""}</span>
          )}
        </div>
        <div className="divide-y divide-border max-h-72 overflow-y-auto">
          {displayList.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            displayList.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-secondary/50 ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? "bg-primary" : "bg-transparent"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        {isCliente && (
          <div className="px-4 py-2 border-t border-border">
            <button onClick={() => navigate("/cliente/notificacoes")} className="text-xs text-primary hover:underline w-full text-center">
              Ver todas as notificações
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
