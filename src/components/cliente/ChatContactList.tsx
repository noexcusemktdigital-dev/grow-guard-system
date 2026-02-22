import { useState } from "react";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { WhatsAppContact } from "@/hooks/useWhatsApp";

interface Props {
  contacts: WhatsAppContact[];
  selectedId: string | null;
  onSelect: (contact: WhatsAppContact) => void;
}

export function ChatContactList({ contacts, selectedId, onSelect }: Props) {
  const [search, setSearch] = useState("");

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (c.name?.toLowerCase().includes(q) || c.phone.includes(q));
  });

  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contato..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Nenhum contato encontrado
          </div>
        ) : (
          filtered.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onSelect(contact)}
              className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 ${
                selectedId === contact.id ? "bg-muted" : ""
              }`}
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={contact.photo_url || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
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
                  <p className="text-xs text-muted-foreground truncate">{contact.phone}</p>
                  {contact.unread_count > 0 && (
                    <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground shrink-0">
                      {contact.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
