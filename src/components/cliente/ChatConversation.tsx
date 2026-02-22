import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { useSendWhatsAppMessage } from "@/hooks/useWhatsApp";
import type { WhatsAppContact, WhatsAppMessage } from "@/hooks/useWhatsApp";
import { toast } from "@/hooks/use-toast";

interface Props {
  contact: WhatsAppContact | null;
  messages: WhatsAppMessage[];
  isLoading: boolean;
}

export function ChatConversation({ contact, messages, isLoading }: Props) {
  const [text, setText] = useState("");
  const sendMutation = useSendWhatsAppMessage();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !contact) return;
    sendMutation.mutate(
      { contactId: contact.id, contactPhone: contact.phone, message: text.trim() },
      {
        onSuccess: () => setText(""),
        onError: (err: any) =>
          toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" }),
      }
    );
  };

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <MessageCircle className="w-7 h-7 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Selecione uma conversa</p>
        <p className="text-xs text-muted-foreground mt-1">
          Escolha um contato à esquerda para visualizar as mensagens
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
          {(contact.name || contact.phone).charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold">{contact.name || contact.phone}</p>
          <p className="text-[10px] text-muted-foreground">{contact.phone}</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            Nenhuma mensagem ainda. Envie a primeira!
          </div>
        ) : (
          messages.map((msg) => <ChatMessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="Digite uma mensagem..."
            className="flex-1 rounded-full h-10"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sendMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full h-10 w-10 shrink-0"
            disabled={!text.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
