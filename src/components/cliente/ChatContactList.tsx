import { useState } from "react";
import { Search, User, Bot, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WhatsAppContact } from "@/hooks/useWhatsApp";

interface Props {
  contacts: WhatsAppContact[];
  selectedId: string | null;
  onSelect: (contact: WhatsAppContact) => void;
  agents?: { id: string; name: string }[];
  leadStages?: Map<string, string>; // contactId -> stage label
}

type ModeFilter = "all" | "ai" | "human" | "waiting";

export function ChatContactList({ contacts, selectedId, onSelect, agents = [], leadStages }: Props) {
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [agentFilter, setAgentFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");

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
    
    const contactStage = leadStages?.get(c.id) || "";
    const matchStage = !stageFilter || contactStage === stageFilter;

    return matchSearch && matchMode && matchAgent && matchStage;
  });

  // Collect unique stages from leadStages
  const uniqueStages = leadStages ? Array.from(new Set(leadStages.values())).filter(Boolean).sort() : [];

  const modeButtons: { key: ModeFilter; label: string; icon?: React.ReactNode }[] = [
    { key: "all", label: "Todos" },
    { key: "ai", label: "IA", icon: <Bot className="w-3 h-3" /> },
    { key: "human", label: "Humano", icon: <User className="w-3 h-3" /> },
    { key: "waiting", label: "Espera", icon: <Clock className="w-3 h-3" /> },
  ];

  return (
    <div className="flex flex-col h-full border-r border-border">
      {/* Mode filter pills */}
      <div className="p-2 border-b border-border flex flex-wrap gap-1">
        {modeButtons.map((btn) => (
          <Button
            key={btn.key}
            variant={modeFilter === btn.key ? "default" : "outline"}
            size="sm"
            className="h-6 text-[10px] px-2 gap-1"
            onClick={() => setModeFilter(btn.key)}
          >
            {btn.icon}
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Search + secondary filters */}
      <div className="p-2 space-y-1.5 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contato..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {agents.length > 0 && (
            <Select value={agentFilter} onValueChange={(v) => setAgentFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-7 text-[10px] flex-1">
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
              <SelectTrigger className="h-7 text-[10px] flex-1">
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
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Nenhum contato encontrado
          </div>
        ) : (
          filtered.map((contact) => {
            const contactAny = contact as any;
            const mode = contactAny.attending_mode || "ai";
            const stageLabel = leadStages?.get(contact.id);
            const agentName = agents.find((a) => a.id === contactAny.agent_id)?.name;

            return (
              <button
                key={contact.id}
                onClick={() => onSelect(contact)}
                className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 ${
                  selectedId === contact.id ? "bg-muted" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contact.photo_url || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  {/* Mode indicator dot */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center ${
                    mode === "ai" ? "bg-purple-500" : "bg-emerald-500"
                  }`}>
                    {mode === "ai" ? (
                      <Bot className="w-2.5 h-2.5 text-white" />
                    ) : (
                      <User className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {contact.name || contact.phone}
                    </p>
                    {contact.last_message_at && (
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {new Date(contact.last_message_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{contact.phone}</p>
                    </div>
                    {contact.unread_count > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground shrink-0">
                        {contact.unread_count}
                      </Badge>
                    )}
                  </div>
                  {/* Badges row */}
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {stageLabel && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 font-normal">{stageLabel}</Badge>
                    )}
                    {agentName && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 font-normal text-purple-500 border-purple-500/30">
                        <Bot className="w-2 h-2 mr-0.5" />{agentName}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}
