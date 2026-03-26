import React, { useState, useMemo, useRef } from "react";
import { Search, Clock, MessageCircle, Wifi, Bot, User, Users, Archive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatContactItem } from "@/components/cliente/ChatContactItem";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { WhatsAppContact } from "@/hooks/useWhatsApp";

interface Props {
  contacts: WhatsAppContact[];
  selectedId: string | null;
  onSelect: (contact: WhatsAppContact) => void;
  agents?: { id: string; name: string }[];
  isConnected?: boolean;
  lastMessages?: Map<string, string>;
  connectedPhone?: string;
  onPinContact?: (contactId: string, pinned: boolean) => void;
  onArchiveContact?: (contactId: string, archived: boolean) => void;
}

type ModeFilter = "all" | "ai" | "human" | "waiting" | "groups";

export const ChatContactList = React.forwardRef<HTMLDivElement, Props>(
  function ChatContactList({ contacts, selectedId, onSelect, agents = [], isConnected, lastMessages, connectedPhone, onPinContact, onArchiveContact }, ref) {
    const [search, setSearch] = useState("");
    const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
    const [agentFilter, setAgentFilter] = useState("");
    const [showArchived, setShowArchived] = useState(false);
    const parentRef = useRef<HTMLDivElement>(null);

    const filtered = contacts.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !q || (c.name?.toLowerCase().includes(q) || c.phone.includes(q));
      const contactAny = c as any;
      const mode = contactAny.attending_mode || "ai";
      const contactType = contactAny.contact_type || "individual";
      const isGroup = contactType === "group";
      const isArchived = !!(contactAny.is_archived);
      
      // Filter archived unless showing archived
      if (!showArchived && isArchived) return false;
      if (showArchived) return isArchived && matchSearch;
      
      let matchMode = true;
      if (modeFilter === "groups") matchMode = isGroup;
      else if (modeFilter === "ai") matchMode = mode === "ai" && !isGroup;
      else if (modeFilter === "human") matchMode = mode === "human" && !isGroup;
      else if (modeFilter === "waiting") matchMode = c.unread_count > 0;
      const matchAgent = !agentFilter || contactAny.agent_id === agentFilter;
      return matchSearch && matchMode && matchAgent;
    });

    const archivedCount = contacts.filter(c => !!(c as any).is_archived).length;

    const sortedContacts = useMemo(() => {
      return [...filtered].sort((a, b) => {
        // Pinned contacts first
        const aPinned = !!(a as any).is_pinned ? 1 : 0;
        const bPinned = !!(b as any).is_pinned ? 1 : 0;
        if (bPinned !== aPinned) return bPinned - aPinned;
        
        const da = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const db = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return db - da;
      });
    }, [filtered]);

    const virtualizer = useVirtualizer({
      count: sortedContacts.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 72,
      overscan: 5,
    });

    const totalUnread = contacts.reduce((s, c) => s + c.unread_count, 0);

    const now = useMemo(() => new Date(), []);
    const todayStart = useMemo(() => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.getTime(); }, [now]);
    const activeToday = useMemo(() => contacts.filter(c => c.last_message_at && new Date(c.last_message_at).getTime() >= todayStart).length, [contacts, todayStart]);

    const modeButtons: { key: ModeFilter; label: string; icon?: React.ReactNode }[] = [
      { key: "all", label: "Todos" },
      { key: "ai", label: "IA", icon: <Bot className="w-3 h-3" /> },
      { key: "human", label: "Humano", icon: <User className="w-3 h-3" /> },
      { key: "waiting", label: "Espera", icon: <Clock className="w-3 h-3" /> },
      { key: "groups", label: "Grupos", icon: <Users className="w-3 h-3" /> },
    ];

    return (
      <div ref={ref} className="flex flex-col h-full border-r border-border bg-card/50">
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
              {totalUnread > 0 && (
                <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground rounded-full">{totalUnread}</Badge>
              )}
              <div className={`flex items-center gap-1 text-[10px] font-medium ${isConnected ? "text-emerald-500" : "text-muted-foreground"}`}>
                <Wifi className="w-3 h-3" />
                {isConnected ? "Online" : "Offline"}
              </div>
            </div>
          </div>

          {connectedPhone && (
            <div className="mb-2">
              <Badge variant="outline" className="text-[10px] gap-1 font-normal">📱 {connectedPhone}</Badge>
            </div>
          )}

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

          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contato ou telefone..."
              className="pl-9 h-8 text-xs rounded-full bg-muted/50 border-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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

        {/* Archived link */}
        {!showArchived && archivedCount > 0 && (
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted/40 transition-colors border-b border-border"
            onClick={() => setShowArchived(true)}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Arquivadas ({archivedCount})</span>
          </button>
        )}
        {showArchived && (
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-primary font-medium hover:bg-muted/40 transition-colors border-b border-border"
            onClick={() => setShowArchived(false)}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>← Voltar às conversas</span>
          </button>
        )}

        {/* Virtualized contact list */}
        <div ref={parentRef} className="flex-1 overflow-auto">
          {sortedContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground">{showArchived ? "Nenhuma conversa arquivada" : "Nenhum contato encontrado"}</p>
            </div>
          ) : (
            <div style={{ height: `${virtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const contact = sortedContacts[virtualRow.index];
                return (
                  <div
                    key={contact.id}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <ChatContactItem
                      contact={contact}
                      isSelected={selectedId === contact.id}
                      onSelect={onSelect}
                      preview={lastMessages?.get(contact.id)}
                      onPin={onPinContact}
                      onArchive={onArchiveContact}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
);
