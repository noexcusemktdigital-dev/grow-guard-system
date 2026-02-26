import { useState, useMemo } from "react";
import { Search, User, Bot, Clock, MessageCircle, Wifi, Users, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatContactItem } from "@/components/cliente/ChatContactItem";
import type { WhatsAppContact } from "@/hooks/useWhatsApp";
import { isToday, isYesterday } from "date-fns";

interface Props {
  contacts: WhatsAppContact[];
  selectedId: string | null;
  onSelect: (contact: WhatsAppContact) => void;
  agents?: { id: string; name: string }[];
  leadStages?: Map<string, string>;
  isConnected?: boolean;
  lastMessages?: Map<string, string>;
}

type ModeFilter = "all" | "ai" | "human" | "waiting" | "groups" | "website";

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
    const contactType = contactAny.contact_type || "individual";
    let matchMode = true;
    if (modeFilter === "ai") matchMode = mode === "ai";
    else if (modeFilter === "human") matchMode = mode === "human";
    else if (modeFilter === "waiting") matchMode = c.unread_count > 0;
    else if (modeFilter === "groups") matchMode = contactType === "group";
    else if (modeFilter === "website") matchMode = contactType === "website";
    const matchAgent = !agentFilter || contactAny.agent_id === agentFilter;
    const contactStage = leadStages?.get(c.id) || "";
    const matchStage = !stageFilter || contactStage === stageFilter;
    return matchSearch && matchMode && matchAgent && matchStage;
  });

  // Split into unread and read
  const { unread, read } = useMemo(() => {
    const unread: WhatsAppContact[] = [];
    const read: WhatsAppContact[] = [];
    const sorted = [...filtered].sort((a, b) => {
      const da = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const db = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return db - da;
    });
    sorted.forEach((c) => {
      if (c.unread_count > 0) unread.push(c);
      else read.push(c);
    });
    return { unread, read };
  }, [filtered]);

  // Group read contacts by date
  const readGroups = useMemo(() => {
    const groups: { key: string; label: string; contacts: WhatsAppContact[] }[] = [];
    const map = new Map<string, WhatsAppContact[]>();
    read.forEach((c) => {
      const g = getDateGroup(c.last_message_at);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(c);
    });
    const order = ["today", "yesterday", "older"];
    const labels: Record<string, string> = { today: "Hoje", yesterday: "Ontem", older: "Anteriores" };
    order.forEach((k) => {
      const items = map.get(k);
      if (items && items.length > 0) groups.push({ key: k, label: labels[k], contacts: items });
    });
    return groups;
  }, [read]);

  const uniqueStages = leadStages ? Array.from(new Set(leadStages.values())).filter(Boolean).sort() : [];

  const modeButtons: { key: ModeFilter; label: string; icon?: React.ReactNode }[] = [
    { key: "all", label: "Todos" },
    { key: "ai", label: "IA", icon: <Bot className="w-3 h-3" /> },
    { key: "human", label: "Humano", icon: <User className="w-3 h-3" /> },
    { key: "waiting", label: "Espera", icon: <Clock className="w-3 h-3" /> },
    { key: "groups", label: "Grupos", icon: <Users className="w-3 h-3" /> },
    { key: "website", label: "Site", icon: <Globe className="w-3 h-3" /> },
  ];

  const totalUnread = contacts.reduce((s, c) => s + c.unread_count, 0);

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
        {unread.length === 0 && read.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground">Nenhum contato encontrado</p>
          </div>
        ) : (
          <>
            {/* Unread section */}
            {unread.length > 0 && (
              <div className="bg-primary/[0.04]">
                <div className="px-4 py-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Novas</span>
                  <Badge className="h-4 min-w-4 px-1 text-[9px] bg-primary text-primary-foreground rounded-full">{unread.length}</Badge>
                </div>
                {unread.map((contact) => (
                  <ChatContactItem
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedId === contact.id}
                    onSelect={onSelect}
                    stageLabel={leadStages?.get(contact.id)}
                    preview={lastMessages?.get(contact.id)}
                  />
                ))}
                <div className="h-px bg-border mx-4" />
              </div>
            )}

            {/* Read section grouped by date */}
            {readGroups.map((group) => (
              <div key={group.key}>
                <div className="px-4 py-1.5">
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {group.label}
                  </span>
                </div>
                {group.contacts.map((contact) => (
                  <ChatContactItem
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedId === contact.id}
                    onSelect={onSelect}
                    stageLabel={leadStages?.get(contact.id)}
                    preview={lastMessages?.get(contact.id)}
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </ScrollArea>
    </div>
  );
}
