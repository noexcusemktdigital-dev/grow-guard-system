import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useClienteNotifications, useClienteContentMutations } from "@/hooks/useClienteContent";
import { useAuth } from "@/contexts/AuthContext";
import { playSound } from "@/lib/sounds";
import { useNavigate, useLocation } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

function getPortalPrefix(pathname: string) {
  if (pathname.startsWith("/franqueadora")) return "/franqueadora";
  if (pathname.startsWith("/franqueado")) return "/franqueado";
  return "/cliente";
}

function getNotificacoesPath(pathname: string) {
  return getPortalPrefix(pathname) + "/notificacoes";
}

export function NotificationBell() {
  const { user } = useAuth();
  const { data: notifPages } = useClienteNotifications();
  const { markNotificationRead, markAllNotificationsRead } = useClienteContentMutations();
  const navigate = useNavigate();
  const location = useLocation();
  const prevCountRef = useRef(0);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const allNotifs = notifPages?.pages?.flatMap(p => p.data) ?? [];
  const unread = allNotifs.filter(n => !n.is_read);
  const read = allNotifs.filter(n => n.is_read).slice(0, 5);

  // Subscribe to realtime notifications (INSERT + UPDATE)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["client-notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Play sound when new unread notifications arrive
  useEffect(() => {
    if (unread.length > prevCountRef.current && prevCountRef.current > 0) {
      playSound("notification");
    }
    prevCountRef.current = unread.length;
  }, [unread.length]);

  const handleClick = (n: { id: string; is_read: boolean; action_url?: string | null }) => {
    if (!n.is_read) {
      markNotificationRead.mutate(n.id);
    }
    if (n.action_url) {
      setOpen(false);
      // Resolve portal prefix based on current path
      const prefix = getPortalPrefix(location.pathname);
      const url = n.action_url.startsWith('/cliente') || n.action_url.startsWith('/franqueado') || n.action_url.startsWith('/franqueadora')
        ? n.action_url
        : prefix + n.action_url;
      navigate(url);
    }
  };

  const handleMarkAll = () => {
    markAllNotificationsRead.mutate();
  };

  const notificacoesPath = getNotificacoesPath(location.pathname);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h4 className="text-sm font-semibold">Notificações</h4>
          {unread.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] gap-1 text-muted-foreground hover:text-primary"
              onClick={handleMarkAll}
              disabled={markAllNotificationsRead.isPending}
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {unread.length === 0 && read.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            <>
              {unread.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 bg-muted/50">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Não lidas ({unread.length})
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {unread.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-secondary/50 bg-primary/5"
                      >
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {read.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 bg-muted/50">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Recentes
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {read.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-secondary/50 opacity-60"
                      >
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-transparent" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{n.title}</p>
                          {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="px-4 py-2 border-t border-border">
          <button
            onClick={() => { setOpen(false); navigate(notificacoesPath); }}
            className="text-xs text-primary hover:underline w-full text-center"
          >
            Ver todas as notificações
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
