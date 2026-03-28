import React, { useState, useMemo } from "react";
import { Search, Send, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WhatsAppContact, WhatsAppMessage } from "@/hooks/useWhatsApp";
import { useSendWhatsAppMessage } from "@/hooks/useWhatsApp";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: WhatsAppMessage | null;
  contacts: WhatsAppContact[];
}

export function ChatForwardDialog({ open, onOpenChange, message, contacts }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const sendMutation = useSendWhatsAppMessage();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contacts.filter(c => {
      if (!q) return true;
      return c.name?.toLowerCase().includes(q) || c.phone.includes(q);
    }).slice(0, 50);
  }, [contacts, search]);

  const toggleContact = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleForward = async () => {
    if (!message || selected.size === 0) return;
    setSending(true);
    try {
      const targets = contacts.filter(c => selected.has(c.id));
      await Promise.all(targets.map(c =>
        sendMutation.mutateAsync({
          contactId: c.id,
          contactPhone: c.phone,
          message: message.content || "",
          type: message.type !== "text" ? message.type : undefined,
          mediaUrl: message.media_url || undefined,
        })
      ));
      toast({ title: `Encaminhada para ${targets.length} contato(s)` });
      onOpenChange(false);
      setSelected(new Set());
      setSearch("");
    } catch (err: any) {
      toast({ title: "Erro ao encaminhar", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Encaminhar mensagem</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Selecione os contatos para encaminhar
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contato..."
            className="pl-9 h-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)} aria-label="Buscar contato"
          />
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap gap-1">
            {Array.from(selected).map(id => {
              const c = contacts.find(x => x.id === id);
              return c ? (
                <Badge key={id} variant="secondary" className="text-[10px] gap-1 cursor-pointer" onClick={() => toggleContact(id)}>
                  {c.name || c.phone} ✕
                </Badge>
              ) : null;
            })}
          </div>
        )}

        <ScrollArea className="h-[300px]">
          <div className="space-y-0.5">
            {filtered.map(c => (
              <button
                key={c.id}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${selected.has(c.id) ? "bg-primary/10" : "hover:bg-muted/50"}`}
                onClick={() => toggleContact(c.id)}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={c.photo_url || undefined} />
                  <AvatarFallback className="text-xs bg-muted">{(c.name || c.phone).substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{c.name || c.phone}</p>
                  <p className="text-[10px] text-muted-foreground">{c.phone}</p>
                </div>
                {selected.has(c.id) && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[10px] text-primary-foreground">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        <Button
          className="w-full gap-2"
          disabled={selected.size === 0 || sending}
          onClick={handleForward}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Encaminhar ({selected.size})
        </Button>
      </DialogContent>
    </Dialog>
  );
}
