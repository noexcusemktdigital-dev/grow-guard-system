import { useState, useMemo } from "react";
import { Bell, Users, MessageCircle, Rocket, Target } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getClienteNotificacoes, type ClienteNotificacao } from "@/data/clienteData";

const typeIcons: Record<string, React.ElementType> = { Leads: Users, Chat: MessageCircle, Campanhas: Rocket, Metas: Target };
const typeColors: Record<string, string> = {
  Leads: "bg-blue-500/10 text-blue-500",
  Chat: "bg-emerald-500/10 text-emerald-500",
  Campanhas: "bg-purple-500/10 text-purple-500",
  Metas: "bg-yellow-500/10 text-yellow-500",
};

export default function ClienteNotificacoes() {
  const [notifs, setNotifs] = useState<ClienteNotificacao[]>(() => getClienteNotificacoes());
  const [filter, setFilter] = useState<string>("Todos");

  const unreadCount = notifs.filter(n => !n.read).length;
  const filters = ["Todos", "Leads", "Chat", "Campanhas", "Metas"];
  const filtered = filter === "Todos" ? notifs : notifs.filter(n => n.type === filter);

  const markAsRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Notificações"
        subtitle="Central de alertas e atualizações"
        icon={<Bell className="w-5 h-5 text-primary" />}
        badge={unreadCount > 0 ? `${unreadCount} novas` : undefined}
      />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setFilter(f)}>
            {f}
          </Button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map(n => {
          const Icon = typeIcons[n.type] || Bell;
          return (
            <Card key={n.id} className={`transition-all duration-200 cursor-pointer hover:shadow-md ${!n.read ? "border-primary/20" : "opacity-70"}`} onClick={() => markAsRead(n.id)}>
              <CardContent className="py-3 flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[n.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{n.title}</span>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{n.time}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
