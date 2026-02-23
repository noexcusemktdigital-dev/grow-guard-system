import { useState, useMemo } from "react";
import { Search, User, Bot, Clock, MessageCircle, Wifi } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WhatsAppContact } from "@/hooks/useWhatsApp";
import { isToday, isYesterday, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  contacts: WhatsAppContact[];
  selectedId: string | null;
  onSelect: (contact: WhatsAppContact) => void;
  agents?: { id: string; name: string }[];
  leadStages?: Map<string, string>;
  isConnected?: boolean;
  lastMessages?: Map<string, string>;
}

type ModeFilter = "all" | "ai" | "human" | "waiting";

function formatContactTime(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd/MM", { locale: ptBR });
}

function getDateGroup(dateStr: string | null): string {
  if (!dateStr) return "older";
  const d = new Date(dateStr);
  if (isToday(d)) return "today";
  if (isYesterday(d)) return "yesterday";
  return "older";
}

export function ChatContactList({ contacts, selectedId, onSelect, agents = [], leadStages, isConnected, lastMessages }: Props) {
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [agentFilter, setAgentFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (c.name?.toLowerCase().includes(q) || c.phone.includes(q));
    const contactAny = c as any;
    const mode = contactAny.attending_mode || null;
    let matchMode = true;
    if (modeFilter === "ai") matchMode = mode === "ai";
    else if (modeFilter === "human") matchMode = mode === "human";
    else if (modeFilter === "waiting") matchMode = c.unread_count > 0;
    const matchAgent = !agentFilter || contactAny.agent_id === agentFilter;
    const contactStage = leadStages?.get(c.id) || "";
    const matchStage = !stageFilter || contactStage === stageFilter;
    return matchSearch && matchMode && matchAgent && matchStage;
  });

  // Sort: unread first, then by last_message_at
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.unread_count > 0 && b.unread_count === 0) return -1;
      if (a.unread_count === 0 && b.unread_count > 0) return 1;
      const da = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const db = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return db - da;
    });
  }, [filtered]);

  const uniqueStages = leadStages ? Array.from(new Set(leadStages.values())).filter(Boolean).sort() : [];

  const modeButtons: { key: ModeFilter; label: string; icon?: React.ReactNode }[] = [
    { key: "all", label: "Todos" },
    { key: "ai", label: "IA", icon: <Bot className="w-3 h-3" /> },
    { key: "human", label: "Humano", icon: <User className="w-3 h-3" /> },
    { key: "waiting", label: "Espera", icon: <Clock className="w-3 h-3" /> },
  ];

  const totalUnread = contacts.reduce((s, c) => s + c.unread_count, 0);

  // Group by date
  let lastGroup = "";

  return (
    <div className="flex flex-col h-full border-r border-border bg-card/50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight">Conversas</h3>
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 rounded-full">{contacts.length}</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            {totalUnread > 0 && (
              <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground rounded-full">{totalUnread}</Badge>
            )}
            <div className={`flex items-center gap-1 text-[10px] font-medium ${isConnected ? "text-emerald-500" : "text-muted-foreground"}`}>
              <Wifi className="w-3 h-3" />
              {isConnected ? "Online" : "Offline"}
            </div>
          </div>
        </div>

        {/* Mode pills */}
        <div className="flex gap-1 mb-2">
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
        {(agents.length > 0 || uniqueStages.length > 0) && (
          <div className="flex gap-1.5 mt-2">
            {agents.length > 0 && (
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
            )}
            {uniqueStages.length > 0 && (
              <Select value={stageFilter} onValueChange={(v) => setStageFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="h-6 text-[10px] flex-1 rounded-full">
                  <SelectValue placeholder="Etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todas etapas</SelectItem>
                  {uniqueStages.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground">Nenhum contato encontrado</p>
          </div>
        ) : (
          sorted.map((contact) => {
            const contactAny = contact as any;
            const mode = contactAny.attending_mode || null;
            const stageLabel = leadStages?.get(contact.id);
            const preview = lastMessages?.get(contact.id);
            const group = getDateGroup(contact.last_message_at);
            let showSeparator = false;
            if (group !== lastGroup) {
              showSeparator = true;
              lastGroup = group;
            }

            return (
              <div key={contact.id}>
                {showSeparator && (
                  <div className="px-4 py-1.5">
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {group === "today" ? "Hoje" : group === "yesterday" ? "Ontem" : "Anteriores"}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => onSelect(contact)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 ${
                    selectedId === contact.id
                      ? "bg-primary/10"
                      : "hover:bg-muted/40"
                  } ${contact.unread_count > 0 ? "bg-primary/[0.03]" : ""}`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={contact.photo_url || undefined} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                        {(contact.name || contact.phone).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {mode && (
                      <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center ${
                        mode === "ai" ? "bg-purple-500" : "bg-emerald-500"
                      }`}>
                        {mode === "ai" ? <Bot className="w-2.5 h-2.5 text-white" /> : <User className="w-2.5 h-2.5 text-white" />}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${contact.unread_count > 0 ? "font-bold" : "font-medium"}`}>
                        {contact.name || contact.phone}
                      </p>
                      <span className={`text-[10px] shrink-0 ml-2 ${contact.unread_count > 0 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                        {formatContactTime(contact.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground truncate pr-2">
                        {preview || contact.phone}
                      </p>
                      {contact.unread_count > 0 && (
                        <Badge className="h-[18px] min-w-[18px] px-1 text-[9px] bg-primary text-primary-foreground shrink-0 rounded-full">
                          {contact.unread_count}
                        </Badge>
                      )}
                    </div>
                    {stageLabel && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 font-normal mt-1">{stageLabel}</Badge>
                    )}
                  </div>
                </button>
              </div>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}
