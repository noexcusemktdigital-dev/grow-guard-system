import { useState, useMemo } from "react";
import { Search, User, Bot, Clock, MessageCircle, Wifi, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatContactItem } from "@/components/cliente/ChatContactItem";
import type { WhatsAppContact } from "@/hooks/useWhatsApp";

interface Props {
  contacts: WhatsAppContact[];
  selectedId: string | null;
  onSelect: (contact: WhatsAppContact) => void;
  agents?: { id: string; name: string }[];
  isConnected?: boolean;
  lastMessages?: Map<string, string>;
  connectedPhone?: string;
  onSync?: () => void;
  isSyncing?: boolean;
}

type ModeFilter = "all" | "ai" | "human" | "waiting";

export function ChatContactList({ contacts, selectedId, onSelect, agents = [], isConnected, lastMessages, connectedPhone, onSync, isSyncing }: Props) {
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [agentFilter, setAgentFilter] = useState("");

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (c.name?.toLowerCase().includes(q) || c.phone.includes(q));
    const contactAny = c as any;
    const mode = contactAny.attending_mode || "ai";
    let matchMode = true;
    if (modeFilter === "ai") matchMode = mode === "ai";
    else if (modeFilter === "human") matchMode = mode === "human";
    else if (modeFilter === "waiting") matchMode = c.unread_count > 0;
    const matchAgent = !agentFilter || contactAny.agent_id === agentFilter;
    return matchSearch && matchMode && matchAgent;
  });

  const sortedContacts = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const da = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const db = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return db - da;
    });
  }, [filtered]);

  const modeButtons: { key: ModeFilter; label: string; icon?: React.ReactNode }[] = [
    { key: "all", label: "Todos" },
    { key: "ai", label: "IA", icon: <Bot className="w-3 h-3" /> },
    { key: "human", label: "Humano", icon: <User className="w-3 h-3" /> },
    { key: "waiting", label: "Espera", icon: <Clock className="w-3 h-3" /> },
  ];

  const totalUnread = contacts.reduce((s, c) => s + c.unread_count, 0);

  // Stats: messages today and active contacts (last 24h)
  const now = useMemo(() => new Date(), []);
  const todayStart = useMemo(() => {
    const d = new Date(now); d.setHours(0,0,0,0); return d.getTime();
  }, [now]);
  const activeToday = useMemo(() => contacts.filter(c => {
    if (!c.last_message_at) return false;
    return new Date(c.last_message_at).getTime() >= todayStart;
  }).length, [contacts, todayStart]);

  return (
    <div className="flex flex-col h-full border-r border-border bg-card/50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight">Conversas</h3>
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 rounded-full">{contacts.length}</Badge>
            {activeToday > 0 && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 rounded-full text-emerald-500 border-emerald-500/30">
                {activeToday} hoje
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {onSync && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={onSync}
                disabled={isSyncing}
                title="Sincronizar conversas do WhatsApp"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              </Button>
            )}
            {totalUnread > 0 && (
              <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground rounded-full">{totalUnread}</Badge>
            )}
            <div className={`flex items-center gap-1 text-[10px] font-medium ${isConnected ? "text-emerald-500" : "text-muted-foreground"}`}>
              <Wifi className="w-3 h-3" />
              {isConnected ? "Online" : "Offline"}
            </div>
          </div>
        </div>

        {/* Connected phone */}
        {connectedPhone && (
          <div className="mb-2">
            <Badge variant="outline" className="text-[10px] gap-1 font-normal">
              📱 {connectedPhone}
            </Badge>
          </div>
        )}

        {/* Mode pills */}
        <div className="flex gap-1 mb-2 flex-wrap">
          {modeButtons.map((btn) => (
            <Button
              key={btn.key}
              variant={modeFilter === btn.key ? "default" : "ghost"}
              size="sm"
              className={`h-6 text-[10px] px-2 gap-1 rounded-full ${modeFilter === btn.key ? "" : "text-muted-foreground"}`}
              onClick={() => setModeFilter(btn.key)}
            >
              {btn.icon}
              {btn.label}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contato ou telefone..."
            className="pl-9 h-8 text-xs rounded-full bg-muted/50 border-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Secondary filters */}
        {agents.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            <Select value={agentFilter} onValueChange={(v) => setAgentFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-6 text-[10px] flex-1 rounded-full">
                <SelectValue placeholder="Agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todos agentes</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {sortedContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground">Nenhum contato encontrado</p>
          </div>
        ) : (
          <div>
            {sortedContacts.map((contact) => (
              <ChatContactItem
                key={contact.id}
                contact={contact}
                isSelected={selectedId === contact.id}
                onSelect={onSelect}
                preview={lastMessages?.get(contact.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
