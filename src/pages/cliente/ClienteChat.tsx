import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, Send, Search, Bot, User, Phone, Mail, ArrowLeft,
  Plus, Wifi, WifiOff, Filter, UserPlus, Link2, XCircle, ArrowRightLeft,
  Paperclip, Info, ChevronRight, Clock, CheckCheck, Zap, Mic,
  MoreVertical, Image, Camera, Video, FileText, Archive,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getChatAccounts,
  getChatConversations,
  type ChatConversation,
} from "@/data/clienteData";

const statusConfig: Record<ChatConversation["attendanceStatus"], { label: string; dot: string; cls: string }> = {
  ia: { label: "IA", dot: "bg-purple-500", cls: "text-purple-500" },
  humano: { label: "Humano", dot: "bg-emerald-500", cls: "text-emerald-500" },
  encerrado: { label: "Encerrado", dot: "bg-muted-foreground", cls: "text-muted-foreground" },
  espera: { label: "Espera", dot: "bg-yellow-500", cls: "text-yellow-500" },
};

const tagColors: Record<string, string> = {
  Lead: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Cliente: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Pós-venda": "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

export default function ClienteChat() {
  const isMobile = useIsMobile();
  const accounts = getChatAccounts();
  const [conversations, setConversations] = useState<ChatConversation[]>(getChatConversations());
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [mobileView, setMobileView] = useState<"conversations" | "chat">("conversations");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredConversations = conversations.filter(c => {
    if (selectedAccount !== "all" && c.accountId !== selectedAccount) return false;
    if (filterStatus !== "all" && c.attendanceStatus !== filterStatus) return false;
    if (filterTag !== "all" && c.tag !== filterTag) return false;
    if (searchQuery && !c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) && !c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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

  const activeFilters = [filterStatus, filterTag, selectedAccount].filter(f => f !== "all").length;
  const unreadTotal = conversations.reduce((s, c) => s + c.unread, 0);

  // === Conversations List ===
  const ConversationsList = () => (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold font-display">Conversas</h2>
          <div className="flex items-center gap-1">
            {unreadTotal > 0 && (
              <Badge variant="destructive" className="text-[9px] h-4 min-w-4 px-1 justify-center">{unreadTotal}</Badge>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowConnectDialog(true)}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Buscar conversa ou mensagem..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-8 text-xs bg-muted/30 border-transparent focus:border-border" />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {[
            { value: "all", label: "Todas" },
            { value: "ia", label: "IA" },
            { value: "humano", label: "Humano" },
            { value: "espera", label: "Espera" },
            { value: "encerrado", label: "Encerrado" },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-all ${
                filterStatus === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex gap-2 mt-2">
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="h-7 text-[10px] flex-1 bg-transparent">
              <Wifi className="w-3 h-3 mr-1 shrink-0" />
              <SelectValue placeholder="Conta" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">Todas contas</SelectItem>
              {accounts.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${a.status === "connected" ? "bg-emerald-500" : "bg-red-500"}`} />
                    {a.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger className="h-7 text-[10px] flex-1 bg-transparent">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">Todas tags</SelectItem>
              <SelectItem value="Lead">Lead</SelectItem>
              <SelectItem value="Cliente">Cliente</SelectItem>
              <SelectItem value="Pós-venda">Pós-venda</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {filteredConversations.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto opacity-20 mb-2" />
              Nenhuma conversa
            </div>
          )}
          {filteredConversations.map(c => {
            const status = statusConfig[c.attendanceStatus];
            const isActive = c.id === selectedConversation;
            return (
              <button
                key={c.id}
                onClick={() => { setSelectedConversation(c.id); if (isMobile) setMobileView("chat"); }}
                className={`w-full text-left px-3 py-2.5 border-b border-border/30 transition-colors ${isActive ? "bg-primary/5" : "hover:bg-muted/30"}`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                      {c.contactName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${status.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium truncate">{c.contactName}</span>
                      <span className={`text-[10px] shrink-0 ${c.unread > 0 ? "text-primary font-semibold" : "text-muted-foreground"}`}>{c.lastMessageTime}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-[11px] truncate pr-2 ${c.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {c.lastMessage}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {c.unread > 0 && (
                          <span className="w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-[9px] font-medium ${status.cls}`}>{status.label}</span>
                      <span className="text-[9px] text-muted-foreground">·</span>
                      <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 border ${tagColors[c.tag] || ""}`}>{c.tag}</Badge>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  // === Active Chat ===
  const ActiveChat = () => {
    if (!active) {
      return (
        <div className="flex-1 flex items-center justify-center bg-muted/10">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
              <MessageCircle className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Selecione uma conversa</p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">Escolha um contato para iniciar</p>
            </div>
          </div>
        </div>
      );
    }

    const status = statusConfig[active.attendanceStatus];

    return (
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.15) 100%)" }}>
        {/* Chat Header */}
        <div className="px-4 py-2 border-b border-border bg-card flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileView("conversations")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold">
              {active.contactName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${status.dot}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{active.contactName}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <span className={status.cls}>{status.label}</span>
              {active.attendanceStatus === "ia" && <Bot className="w-3 h-3 text-purple-500" />}
              <span>· {active.contactPhone}</span>
            </p>
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-0.5">
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
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-1.5 max-w-2xl mx-auto">
            {active.messages.map((m, idx) => {
              if (m.sender === "system") {
                return (
                  <div key={m.id} className="flex justify-center py-1">
                    <span className="text-[10px] text-muted-foreground bg-muted/60 px-3 py-0.5 rounded-md">{m.text}</span>
                  </div>
                );
              }
              const isUser = m.sender === "user";
              const isIA = m.sender === "ia";
              const showAvatar = idx === 0 || active.messages[idx - 1]?.sender !== m.sender;

              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] ${!showAvatar ? (isUser ? "mr-0" : "ml-8") : ""}`}>
                    {showAvatar && !isUser && (
                      <div className="flex items-center gap-1.5 mb-0.5 ml-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold ${isIA ? "bg-purple-500/15 text-purple-500" : "bg-muted text-muted-foreground"}`}>
                          {isIA ? <Bot className="w-3 h-3" /> : (m.avatar || "?")}
                        </div>
                        <span className={`text-[10px] font-medium ${isIA ? "text-purple-500" : "text-muted-foreground"}`}>{m.senderName}</span>
                      </div>
                    )}
                    <div className={`px-3 py-2 text-[13px] leading-relaxed ${
                      isUser
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                        : isIA
                          ? "bg-purple-500/8 border border-purple-500/15 rounded-2xl rounded-bl-md"
                          : "bg-card border border-border rounded-2xl rounded-bl-md"
                    }`}>
                      <p>{m.text}</p>
                      <div className={`flex items-center gap-1 mt-0.5 ${isUser ? "justify-end" : ""}`}>
                        <span className={`text-[9px] ${isUser ? "text-primary-foreground/50" : "text-muted-foreground/60"}`}>{m.time}</span>
                        {isUser && <CheckCheck className={`w-3 h-3 ${isUser ? "text-primary-foreground/50" : "text-muted-foreground/40"}`} />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        {active.attendanceStatus !== "encerrado" && (
          <div className="border-t border-border bg-card">
            {/* Quick replies */}
            <div className="px-3 pt-2 flex gap-1.5 overflow-x-auto">
              {["Olá! Como posso ajudar?", "Vou verificar para você", "Obrigado pelo contato!"].map(reply => (
                <button key={reply} className="text-[10px] text-muted-foreground bg-muted/40 hover:bg-muted px-2.5 py-1 rounded-full whitespace-nowrap transition-colors" onClick={() => setMessageInput(reply)}>
                  {reply}
                </button>
              ))}
            </div>
            <div className="p-2 flex items-end gap-1.5">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground rounded-full"><Plus className="w-5 h-5" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 bg-popover z-50" align="start" side="top">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-blue-500"><Image className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-purple-500"><Camera className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-red-500"><Video className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-orange-500"><FileText className="w-4 h-4" /></Button>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="flex-1 relative">
                <Input
                  placeholder="Digite uma mensagem..."
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                  className="h-9 text-sm pr-10 rounded-full bg-muted/30 border-transparent focus:border-border"
                />
                <Button variant="ghost" size="icon" className="absolute right-1 top-0.5 h-8 w-8 text-muted-foreground rounded-full"><Paperclip className="w-4 h-4" /></Button>
              </div>
              {messageInput.trim() ? (
                <Button size="icon" className="h-9 w-9 shrink-0 rounded-full" onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground rounded-full">
                  <Mic className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // === Contact Sheet ===
  const ContactSheet = () => (
    <Sheet open={showContactSheet} onOpenChange={setShowContactSheet}>
      <SheetContent side="right" className="w-80 p-5">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display">Contato</SheetTitle>
        </SheetHeader>
        {active && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                {active.contactName.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <p className="text-sm font-semibold">{active.contactName}</p>
              <Badge variant="outline" className={`text-[10px] ${tagColors[active.tag] || ""}`}>{active.tag}</Badge>
            </div>
            <Separator />
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" /><span>{active.contactPhone}</span></div>
              {active.contactEmail && <div className="flex items-center gap-2.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" /><span>{active.contactEmail}</span></div>}
            </div>
            {active.crmLinked && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">CRM</h5>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Etapa</span><span className="font-medium">{active.crmStage}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Responsável</span><span className="font-medium">{active.crmResponsible}</span></div>
                  </div>
                </div>
              </>
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
        {mobileView === "conversations" && <ConversationsList />}
        {mobileView === "chat" && <ActiveChat />}
        <ContactSheet />
        <Dialogs />
      </div>
    );
  }

  // === DESKTOP — 2 columns, no KPI cards ===
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex-1 flex rounded-xl border border-border overflow-hidden bg-card">
        <div className="w-[320px] flex-shrink-0"><ConversationsList /></div>
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
              <DialogTitle className="font-display">Conectar WhatsApp</DialogTitle>
              <DialogDescription>Integre um novo número de WhatsApp à plataforma.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
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
              <DialogTitle className="font-display">Transferir Conversa</DialogTitle>
              <DialogDescription>Selecione o atendente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-1 py-4">
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
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
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
