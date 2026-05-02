// @ts-nocheck
import { useState, useRef, useCallback, useMemo } from "react";
import { Bell, Users, MessageCircle, Rocket, Target, CheckCheck, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useClienteNotifications, useClienteContentMutations } from "@/hooks/useClienteContent";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function getPortalPrefix(pathname: string) {
  if (pathname.startsWith("/franqueadora")) return "/franqueadora";
  if (pathname.startsWith("/franqueado")) return "/franqueado";
  return "/cliente";
}

const typeIcons: Record<string, React.ElementType> = { Leads: Users, Chat: MessageCircle, Campanhas: Rocket, Metas: Target, CRM: Users };
const typeColors: Record<string, string> = {
  Leads: "bg-blue-500/10 text-blue-500",
  Chat: "bg-emerald-500/10 text-emerald-500",
  Campanhas: "bg-purple-500/10 text-purple-500",
  Metas: "bg-yellow-500/10 text-yellow-500",
  CRM: "bg-indigo-500/10 text-indigo-500",
  info: "bg-blue-500/10 text-blue-500",
};

export default function NotificacoesPage() {
  const { data: notifPages, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useClienteNotifications();
  const { markNotificationRead, markAllNotificationsRead } = useClienteContentMutations();
  const [filter, setFilter] = useState<string>("Todos");
  const navigate = useNavigate();
  const location = useLocation();

  const allNotifs = useMemo(() => notifPages?.pages?.flatMap(p => p.data) ?? [], [notifPages]);
  const unreadCount = allNotifs.filter(n => !n.is_read).length;
  const filters = ["Todos", "Não lidas", "CRM", "Chat", "Campanhas", "Metas"];

  const filtered = allNotifs.filter(n => {
    if (filter === "Todos") return true;
    if (filter === "Não lidas") return !n.is_read;
    return n.type === filter;
  });

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const handleClick = (n: Record<string, unknown>) => {
    if (!n.is_read) {
      markNotificationRead.mutate(n.id);
    }
    if (n.action_url) {
      const prefix = getPortalPrefix(location.pathname);
      const url = n.action_url.startsWith('/cliente') || n.action_url.startsWith('/franqueado') || n.action_url.startsWith('/franqueadora')
        ? n.action_url
        : prefix + n.action_url;
      navigate(url);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Notificações" subtitle="Central de alertas e atualizações" icon={<Bell className="w-5 h-5 text-primary" />} />
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Notificações"
        subtitle="Central de alertas e atualizações"
        icon={<Bell className="w-5 h-5 text-primary" />}
        badge={unreadCount > 0 ? `${unreadCount} novas` : undefined}
      />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setFilter(f)}>
              {f}
            </Button>
          ))}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => markAllNotificationsRead.mutate()}
            disabled={markAllNotificationsRead.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8" />}
          title={filter === "Não lidas" ? "Nenhuma notificação não lida" : "Nenhuma notificação"}
          description="Quando houver novidades, elas aparecerão aqui."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((n, idx) => {
            const Icon = typeIcons[n.type || "info"] || Bell;
            const timeAgo = n.created_at
              ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })
              : "";
            const isLast = idx === filtered.length - 1;
            return (
              <Card
                key={n.id}
                ref={isLast ? lastItemRef : undefined}
                className={`transition-all duration-300 cursor-pointer hover:shadow-md ${
                  !n.is_read ? "border-primary/20 bg-primary/5" : "opacity-60"
                }`}
                onClick={() => handleClick(n)}
              >
                <CardContent className="py-3 flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[n.type || "info"]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${!n.is_read ? "font-medium" : ""}`}>{n.title}</span>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">{timeAgo}</span>
                </CardContent>
              </Card>
            );
          })}
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
