import { useState } from "react";
import { MessageCircle, Send, Info } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getChatConversas } from "@/data/clienteData";

export default function ClienteChat() {
  const conversas = getChatConversas();
  const [activeChat, setActiveChat] = useState(conversas[0].id);
  const [message, setMessage] = useState("");

  const active = conversas.find(c => c.id === activeChat)!;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Chat"
        subtitle="Comunicação interna da equipe"
        icon={<MessageCircle className="w-5 h-5 text-primary" />}
        badge="Equipe"
      />

      <div className="flex items-center gap-2 mb-2">
        <Info className="w-4 h-4 text-muted-foreground" />
        <Badge variant="outline" className="text-[10px]">Em breve: Chat com leads via CRM</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-280px)]">
        {/* Conversations */}
        <Card className="overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {conversas.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveChat(c.id)}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${c.id === activeChat ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/30"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMessage}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Messages */}
        <Card className="flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold">{active.name}</span>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {active.messages.map(m => (
                <div key={m.id} className={`flex gap-3 ${m.sender === "Você" ? "flex-row-reverse" : ""}`}>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {m.avatar}
                  </div>
                  <div className={`max-w-[70%] ${m.sender === "Você" ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold">{m.sender}</span>
                      <span className="text-[10px] text-muted-foreground">{m.time}</span>
                    </div>
                    <div className={`inline-block p-3 rounded-xl text-sm ${m.sender === "Você" ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-3 border-t border-border flex gap-2">
            <Input placeholder="Digite sua mensagem..." value={message} onChange={e => setMessage(e.target.value)} />
            <Button size="icon"><Send className="w-4 h-4" /></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
