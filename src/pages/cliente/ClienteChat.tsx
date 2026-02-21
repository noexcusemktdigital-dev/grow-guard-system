import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, Send, Search, Bot, User, Phone, Mail, ArrowLeft,
  Plus, Wifi, WifiOff, Filter, UserPlus, Link2, XCircle, ArrowRightLeft,
  Smile, Paperclip, Info, ChevronRight, Clock, CheckCheck, Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { KpiCard } from "@/components/KpiCard";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getChatAccounts,
  getChatConversations,
  type ChatConversation,
} from "@/data/clienteData";

const statusBadge = (s: ChatConversation["attendanceStatus"]) => {
  const map = {
    ia: { label: "IA", cls: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
    humano: { label: "Humano", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    encerrado: { label: "Encerrado", cls: "bg-muted text-muted-foreground border-border" },
    espera: { label: "Espera", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  };
  const m = map[s];
  return <Badge variant="outline" className={`text-[10px] ${m.cls}`}>{m.label}</Badge>;
};

const tagBadge = (t: ChatConversation["tag"]) => {
  const map = {
    Lead: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Cliente: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    "Pós-venda": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  };
  return <Badge variant="outline" className={`text-[10px] ${map[t]}`}>{t}</Badge>;
};

export default function ClienteChat() {
  const isMobile = useIsMobile();
  const accounts = getChatAccounts();
  const [conversations, setConversations] = useState<ChatConversation[]>(getChatConversations());
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [mobileView, setMobileView] = useState<"conversations" | "chat">("conversations");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredConversations = conversations.filter(c => {
    if (selectedAccount !== "all" && c.accountId !== selectedAccount) return false;
    if (filterStatus !== "all" && c.attendanceStatus !== filterStatus) return false;
    if (searchQuery && !c.contactName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const active = selectedConversation ? conversations.find(c => c.id === selectedConversation) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, selectedConversation]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    setConversations(prev => prev.map(c =>
      c.id === selectedConversation
        ? {
            ...c,
            lastMessage: messageInput,
            lastMessageTime: "Agora",
            messages: [...c.messages, {
              id: `m${Date.now()}`, sender: "user" as const, senderName: "Você",
              text: messageInput, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            }],
          }
        : c
    ));
    setMessageInput("");
  };

  const handleStatusChange = (convId: string, newStatus: ChatConversation["attendanceStatus"]) => {
    const systemMessages: Record<string, string> = {
      humano: "Conversa assumida por Você",
      ia: "Conversa devolvida para IA",
      encerrado: "Conversa encerrada por Você",
    };
    setConversations(prev => prev.map(c =>
      c.id === convId
        ? {
            ...c,
            attendanceStatus: newStatus,
            attendant: newStatus === "humano" ? "Você" : c.attendant,
            messages: systemMessages[newStatus]
              ? [...c.messages, { id: `s${Date.now()}`, sender: "system" as const, senderName: "Sistema", text: systemMessages[newStatus], time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }]
              : c.messages,
          }
        : c
    ));
  };

  const activeCount = conversations.filter(c => c.attendanceStatus !== "encerrado").length;
  const closedCount = conversations.filter(c => c.attendanceStatus === "encerrado").length;

  // === Conversations List ===
  const ConversationsList = () => (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Account selector as dropdown */}
      <div className="p-3 space-y-2 border-b border-border">
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="h-8 text-xs">
            <Wifi className="w-3 h-3 mr-1" />
            <SelectValue placeholder="Conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas</SelectItem>
            {accounts.map(a => (
              <SelectItem key={a.id} value={a.id}>
                {a.status === "connected" ? "🟢" : "🔴"} {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-8 text-xs" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-7 text-[11px]">
            <Filter className="w-3 h-3 mr-1" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ia">IA</SelectItem>
            <SelectItem value="humano">Humano</SelectItem>
            <SelectItem value="espera">Espera</SelectItem>
            <SelectItem value="encerrado">Encerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-0.5">
          {filteredConversations.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">Nenhuma conversa</div>
          )}
          {filteredConversations.map(c => (
            <button
              key={c.id}
              onClick={() => { setSelectedConversation(c.id); if (isMobile) setMobileView("chat"); }}
              className={`w-full text-left p-2.5 rounded-lg transition-colors ${c.id === selectedConversation ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/30"}`}
            >
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium truncate">{c.contactName}</span>
                    <span className="text-[9px] text-muted-foreground flex-shrink-0">{c.lastMessageTime}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{c.lastMessage}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {statusBadge(c.attendanceStatus)}
                    {tagBadge(c.tag)}
                  </div>
                </div>
                {c.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                    {c.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
      <div className="p-2 border-t border-border">
        <Button variant="outline" size="sm" className="w-full text-[11px] h-7 gap-1" onClick={() => setShowConnectDialog(true)}>
          <Plus className="w-3 h-3" /> Conectar WhatsApp
        </Button>
      </div>
    </div>
  );

  // === Active Chat ===
  const ActiveChat = () => {
    if (!active) {
      return (
        <div className="flex-1 flex items-center justify-center bg-card text-muted-foreground">
          <div className="text-center space-y-2">
            <MessageCircle className="w-10 h-10 mx-auto opacity-20" />
            <p className="text-sm">Selecione uma conversa</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-card overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileView("conversations")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {active.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{active.contactName}</span>
              {statusBadge(active.attendanceStatus)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{active.contactPhone}</span>
              {active.attendanceStatus === "ia" && (
                <span className="text-[10px] text-purple-400 flex items-center gap-0.5"><Bot className="w-3 h-3" /> IA</span>
              )}
            </div>
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-1">
              {active.attendanceStatus === "ia" && (
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStatusChange(active.id, "humano")}><User className="w-4 h-4" /></Button>
                </TooltipTrigger><TooltipContent>Assumir</TooltipContent></Tooltip>
              )}
              {active.attendanceStatus === "humano" && (
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStatusChange(active.id, "ia")}><Bot className="w-4 h-4" /></Button>
                </TooltipTrigger><TooltipContent>Devolver p/ IA</TooltipContent></Tooltip>
              )}
              {active.attendanceStatus !== "encerrado" && (
                <>
                  <Tooltip><TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowTransferDialog(true)}><ArrowRightLeft className="w-4 h-4" /></Button>
                  </TooltipTrigger><TooltipContent>Transferir</TooltipContent></Tooltip>
                  <Tooltip><TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleStatusChange(active.id, "encerrado")}><XCircle className="w-4 h-4" /></Button>
                  </TooltipTrigger><TooltipContent>Encerrar</TooltipContent></Tooltip>
                </>
              )}
              {active.crmLinked ? (
                <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/30 text-primary ml-1">
                  <Link2 className="w-3 h-3 mr-0.5" /> {active.crmStage}
                </Badge>
              ) : (
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 ml-1">
                  <UserPlus className="w-3 h-3" /> Lead
                </Button>
              )}
              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowContactSheet(true)}>
                  <Info className="w-4 h-4" />
                </Button>
              </TooltipTrigger><TooltipContent>Info</TooltipContent></Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2.5 max-w-2xl mx-auto">
            {active.messages.map(m => {
              if (m.sender === "system") {
                return (
                  <div key={m.id} className="flex justify-center">
                    <span className="text-[10px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">{m.text}</span>
                  </div>
                );
              }
              const isUser = m.sender === "user";
              const isIA = m.sender === "ia";
              return (
                <div key={m.id} className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${isIA ? "bg-purple-500/20 text-purple-400" : "bg-muted"}`}>
                    {isIA ? <Bot className="w-3 h-3" /> : (m.avatar || (isUser ? "V" : "?"))}
                  </div>
                  <div className={`max-w-[75%] ${isUser ? "text-right" : ""}`}>
                    <div className={`flex items-center gap-1 mb-0.5 ${isUser ? "justify-end" : ""}`}>
                      <span className={`text-[10px] font-semibold ${isIA ? "text-purple-400" : ""}`}>{m.senderName}</span>
                      <span className="text-[9px] text-muted-foreground">{m.time}</span>
                    </div>
                    <div className={`inline-block p-2.5 rounded-2xl text-sm leading-relaxed ${
                      isUser ? "bg-primary text-primary-foreground rounded-tr-sm" :
                      isIA ? "bg-purple-500/10 border border-purple-500/20 rounded-tl-sm" :
                      "bg-muted/50 rounded-tl-sm"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick replies */}
        {active.attendanceStatus !== "encerrado" && (
          <>
            <div className="px-4 pt-2 flex gap-1.5 flex-wrap">
              {["Olá! Como posso ajudar?", "Vou verificar para você", "Obrigado pelo contato!"].map(reply => (
                <Button key={reply} variant="outline" size="sm" className="text-[10px] h-6 px-2" onClick={() => setMessageInput(reply)}>
                  {reply}
                </Button>
              ))}
            </div>
            <div className="p-3 border-t border-border flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground"><Smile className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground"><Paperclip className="w-4 h-4" /></Button>
              <Input
                placeholder="Digite sua mensagem..."
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                className="h-8 text-sm"
              />
              <Button size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleSendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  // === Contact Sheet (instead of fixed panel) ===
  const ContactSheet = () => (
    <Sheet open={showContactSheet} onOpenChange={setShowContactSheet}>
      <SheetContent side="right" className="w-80 p-5">
        <SheetHeader className="pb-4">
          <SheetTitle>Contato</SheetTitle>
        </SheetHeader>
        {active && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                {active.avatar}
              </div>
              <p className="text-sm font-semibold">{active.contactName}</p>
              {tagBadge(active.tag)}
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3 h-3" /> {active.contactPhone}</div>
              {active.contactEmail && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3 h-3" /> {active.contactEmail}</div>}
            </div>
            {active.crmLinked && (
              <div className="space-y-2 pt-3 border-t border-border">
                <h5 className="text-[10px] font-bold uppercase text-muted-foreground">CRM</h5>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Etapa</span><span className="font-medium">{active.crmStage}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Responsável</span><span className="font-medium">{active.crmResponsible}</span></div>
                </div>
              </div>
            )}
            {!active.crmLinked && (
              <Button variant="outline" size="sm" className="w-full text-xs gap-1 mt-2">
                <UserPlus className="w-3 h-3" /> Criar Lead no CRM
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );

  // === MOBILE ===
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col">
        <div className="grid grid-cols-2 gap-2 p-3">
          <KpiCard label="Ativas" value={String(activeCount)} icon={MessageCircle} />
          <KpiCard label="Fechadas" value={String(closedCount)} icon={CheckCheck} />
        </div>
        {mobileView === "conversations" && <ConversationsList />}
        {mobileView === "chat" && <ActiveChat />}
        <ContactSheet />
        <Dialogs />
      </div>
    );
  }

  // === DESKTOP — 2 columns ===
  return (
    <div className="space-y-3 h-[calc(100vh-120px)] flex flex-col">
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <KpiCard label="Conversas Ativas" value={String(activeCount)} icon={MessageCircle} />
        <KpiCard label="Tempo Médio" value="2m 45s" icon={Clock} />
        <KpiCard label="Fechadas Hoje" value={String(closedCount)} icon={CheckCheck} />
        <KpiCard label="Taxa Resposta" value="94%" icon={Zap} trend="up" />
      </div>

      <div className="flex-1 flex rounded-xl border border-border overflow-hidden bg-card">
        <div className="w-[300px] flex-shrink-0"><ConversationsList /></div>
        <ActiveChat />
      </div>

      <ContactSheet />
      <Dialogs />
    </div>
  );

  function Dialogs() {
    return (
      <>
        <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conectar WhatsApp</DialogTitle>
              <DialogDescription>Integre um novo número de WhatsApp à plataforma.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/50 border border-border">
                <Zap className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Integração em breve</p>
                  <p className="text-xs text-muted-foreground">WhatsApp Business API, Z-API ou 360Dialog.</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transferir Conversa</DialogTitle>
              <DialogDescription>Selecione o atendente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              {["Ana Costa", "Carlos Mendes", "Pedro Lima"].map(name => (
                <button
                  key={name}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors text-left"
                  onClick={() => {
                    if (selectedConversation) {
                      setConversations(prev => prev.map(c =>
                        c.id === selectedConversation
                          ? {
                              ...c,
                              attendanceStatus: "humano" as const,
                              attendant: name,
                              messages: [...c.messages, { id: `s${Date.now()}`, sender: "system" as const, senderName: "Sistema", text: `Transferida para ${name}`, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }],
                            }
                          : c
                      ));
                    }
                    setShowTransferDialog(false);
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                    {name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className="text-sm font-medium flex-1">{name}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
}
