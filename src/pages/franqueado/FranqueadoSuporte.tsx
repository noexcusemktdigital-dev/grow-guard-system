import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, MessageSquare, Search, Inbox, AlertTriangle, Timer, Clock,
  Send, ArrowLeft, User,
} from "lucide-react";
import { useSupportTickets, useSupportMessages, useSupportTicketMutations } from "@/hooks/useSupportTickets";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_LABELS: Record<string, string> = { open: "Aberto", in_progress: "Em análise", resolved: "Resolvido", closed: "Encerrado" };
const STATUS_VARIANTS: Record<string, "destructive" | "secondary" | "outline" | "default"> = { open: "destructive", in_progress: "secondary", resolved: "default", closed: "outline" };
const CATEGORIAS = ["Financeiro", "Jurídico", "Comercial", "Marketing", "Treinamentos", "Sistema", "Dúvidas gerais"];

export default function FranqueadoSuporte() {
  const { user } = useAuth();
  const { data: tickets, isLoading } = useSupportTickets();
  const { createTicket, sendMessage } = useSupportTicketMutations();
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");

  // New ticket form
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("Dúvidas gerais");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaPrioridade, setNovaPrioridade] = useState("normal");

  const filtered = useMemo(() => {
    return (tickets ?? []).filter(t => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tickets, filterStatus, search]);

  const alerts = useMemo(() => {
    const abertos = (tickets ?? []).filter(t => t.status === "open").length;
    const emAnalise = (tickets ?? []).filter(t => t.status === "in_progress").length;
    const resolvidos = (tickets ?? []).filter(t => t.status === "resolved").length;
    return [
      { label: "Abertos", count: abertos, cor: "text-red-500", icon: AlertTriangle },
      { label: "Em Análise", count: emAnalise, cor: "text-amber-500", icon: Timer },
      { label: "Resolvidos", count: resolvidos, cor: "text-emerald-500", icon: Clock },
    ];
  }, [tickets]);

  function handleCreate() {
    if (!novoTitulo.trim()) { toast.error("Informe o título"); return; }
    createTicket.mutate({ title: novoTitulo, description: novaDescricao, category: novaCategoria, priority: novaPrioridade }, {
      onSuccess: () => { setCreateDialog(false); setNovoTitulo(""); setNovaDescricao(""); toast.success("Chamado criado!"); },
    });
  }

  function handleSendMessage() {
    if (!newMessage.trim() || !selectedTicket) return;
    sendMessage.mutate({ ticket_id: selectedTicket.id, content: newMessage }, {
      onSuccess: () => setNewMessage(""),
    });
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Suporte</h1>
            <Badge variant="outline" className="text-[10px]">Unidade</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Abra e acompanhe seus chamados</p>
        </div>
        <Button size="sm" onClick={() => setCreateDialog(true)}><Plus className="w-4 h-4 mr-1" /> Novo Chamado</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {alerts.map(a => (
          <Card key={a.label} className="p-3 flex items-center gap-3">
            <a.icon className={`w-5 h-5 ${a.cor}`} />
            <div>
              <p className="text-lg font-bold">{a.count}</p>
              <p className="text-[11px] text-muted-foreground">{a.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="in_progress">Em análise</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-[200px] h-8 text-xs pl-8" />
        </div>
      </div>

      {/* Split view */}
      <div className="flex gap-4 min-h-[500px]">
        {/* Ticket List */}
        <div className={`space-y-2 ${selectedTicket ? "w-1/3 hidden md:block" : "w-full"} flex-shrink-0`}>
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Nenhum chamado encontrado</p>
            </div>
          ) : (
            filtered.map(t => (
              <Card
                key={t.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedTicket?.id === t.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedTicket(t)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{t.title}</p>
                      <p className="text-[11px] text-muted-foreground">{t.category || "Geral"} · {format(new Date(t.created_at), "dd/MM")}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant={STATUS_VARIANTS[t.status] || "secondary"} className="text-[10px]">
                        {STATUS_LABELS[t.status] || t.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground capitalize">{t.priority || "normal"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Chat / Detail panel */}
        {selectedTicket && (
          <div className="flex-1 border border-border rounded-xl flex flex-col min-w-0">
            {/* Detail header */}
            <div className="p-4 border-b border-border flex items-start gap-3">
              <Button size="icon" variant="ghost" className="h-8 w-8 md:hidden" onClick={() => setSelectedTicket(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold">{selectedTicket.title}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={STATUS_VARIANTS[selectedTicket.status] || "secondary"} className="text-[10px]">
                    {STATUS_LABELS[selectedTicket.status] || selectedTicket.status}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{selectedTicket.category || "Geral"}</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    Aberto {formatDistanceToNow(new Date(selectedTicket.created_at), { locale: ptBR, addSuffix: true })}
                  </span>
                </div>
                {selectedTicket.description && (
                  <p className="text-xs text-muted-foreground mt-2">{selectedTicket.description}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <TicketMessages ticketId={selectedTicket.id} userId={user?.id} />

            {/* Input */}
            {selectedTicket.status !== "closed" && (
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="text-sm"
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                />
                <Button size="icon" onClick={handleSendMessage} disabled={sendMessage.isPending || !newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {!selectedTicket && (
          <div className="flex-1 hidden md:flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Selecione um chamado para visualizar</p>
            </div>
          </div>
        )}
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Chamado</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} placeholder="Descreva brevemente o problema" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Categoria</Label>
                <Select value={novaCategoria} onValueChange={setNovaCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Prioridade</Label>
                <Select value={novaPrioridade} onValueChange={setNovaPrioridade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição</Label><Textarea value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} placeholder="Descreva o problema..." rows={4} /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={createTicket.isPending}>{createTicket.isPending ? "Criando..." : "Criar Chamado"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Messages sub-component */
function TicketMessages({ ticketId, userId }: { ticketId: string; userId?: string }) {
  const { data: messages, isLoading } = useSupportMessages(ticketId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><Skeleton className="h-8 w-32" /></div>;

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      {(!messages || messages.length === 0) ? (
        <div className="text-center text-muted-foreground text-xs py-8">
          Nenhuma mensagem ainda. Inicie a conversa!
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(m => {
            const isMine = m.user_id === userId;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-sm ${
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}>
                  {!isMine && (
                    <div className="flex items-center gap-1 mb-1">
                      <User className="w-3 h-3" />
                      <span className="text-[10px] font-medium">Matriz</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {format(new Date(m.created_at), "HH:mm")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );
}
