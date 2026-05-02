import { useState, useMemo, useRef, useEffect } from "react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, MessageSquare, Search, Inbox, AlertTriangle, Timer, Clock,
  Send, Paperclip, X, FileText,
} from "lucide-react";
import { useSupportTickets, useSupportMessages, useSupportTicketMutations } from "@/hooks/useSupportTickets";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { SupportAccessManager } from "@/components/cliente/SupportAccessManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_LABELS: Record<string, string> = {
  open: "Aberto", in_progress: "Em análise", waiting: "Aguardando", resolved: "Resolvido", closed: "Encerrado",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  waiting: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  closed: "bg-muted text-muted-foreground",
};
const PRIORITY_LABELS: Record<string, string> = { low: "Baixa", normal: "Normal", high: "Alta", urgent: "Urgente" };
const CATEGORIAS = ["Dúvida", "Problema técnico", "Sugestão", "Financeiro", "Outro"];

export default function ClienteSuporte() {
  const { user } = useAuth();
  const { data: tickets, isLoading } = useSupportTickets();
  const { createTicket, sendMessage } = useSupportTicketMutations();
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Tables<'support_tickets'> | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // New ticket form
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("Dúvida");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaPrioridade, setNovaPrioridade] = useState("normal");
  const [creatingTicket, setCreatingTicket] = useState(false);

  const filtered = useMemo(() => {
    return (tickets ?? []).filter(t => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tickets, filterStatus, search]);

  const counts = useMemo(() => {
    const all = tickets ?? [];
    return {
      open: all.filter(t => t.status === "open").length,
      in_progress: all.filter(t => t.status === "in_progress").length,
      resolved: all.filter(t => t.status === "resolved").length,
    };
  }, [tickets]);

  async function handleCreate() {
    if (!novoTitulo.trim()) { toast.error("Informe o título"); return; }
    setCreatingTicket(true);
    try {
      await createTicket.mutateAsync({
        title: novoTitulo,
        description: novaDescricao,
        category: novaCategoria,
        priority: novaPrioridade,
      } as TablesInsert<'support_tickets'>);
      setCreateDialog(false);
      setNovoTitulo("");
      setNovaDescricao("");
      toast.success("Chamado criado!");
    } catch {
      toast.error("Erro ao criar chamado");
    }
    setCreatingTicket(false);
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedTicket) return;
    try {
      await sendMessage.mutateAsync({ ticket_id: selectedTicket.id, content: newMessage });
      setNewMessage("");
    } catch {
      toast.error("Erro ao enviar mensagem");
    }
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        <Skeleton className="h-[400px]" />
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
          </div>
          <p className="text-sm text-muted-foreground">Chamados e acesso temporário de suporte</p>
        </div>
      </div>

      <Tabs defaultValue="chamados">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="chamados" className="gap-1.5 text-xs sm:text-sm"><MessageSquare className="w-4 h-4" /> Chamados</TabsTrigger>
          <TabsTrigger value="acesso" className="gap-1.5 text-xs sm:text-sm"><Clock className="w-4 h-4" /> Acesso Temporário</TabsTrigger>
        </TabsList>

        <TabsContent value="chamados">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Chamado
          </Button>
        </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div><p className="text-lg font-bold">{counts.open}</p><p className="text-[11px] text-muted-foreground">Abertos</p></div>
        </Card>
        <Card className="p-3 flex items-center gap-3">
          <Timer className="w-5 h-5 text-amber-500" />
          <div><p className="text-lg font-bold">{counts.in_progress}</p><p className="text-[11px] text-muted-foreground">Em Análise</p></div>
        </Card>
        <Card className="p-3 flex items-center gap-3">
          <Clock className="w-5 h-5 text-emerald-500" />
          <div><p className="text-lg font-bold">{counts.resolved}</p><p className="text-[11px] text-muted-foreground">Resolvidos</p></div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar" className="w-[200px] h-8 text-xs pl-8" />
        </div>
      </div>

      {/* Ticket List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="w-10 h-10 mb-3" />
          <p className="text-sm font-medium">Nenhum chamado encontrado</p>
          <p className="text-xs mt-1">Crie um novo chamado para entrar em contato com o suporte</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <Card
              key={t.id}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedTicket(t)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status] || ""}`}>
                      {STATUS_LABELS[t.status] || t.status}
                    </span>
                    {t.category && <Badge variant="outline" className="text-[10px]">{t.category}</Badge>}
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(t.created_at), { locale: ptBR, addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={open => !open && setSelectedTicket(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0">
            <div className="p-5 border-b border-border">
              <h3 className="text-base font-semibold">{selectedTicket.title}</h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedTicket.status] || ""}`}>
                  {STATUS_LABELS[selectedTicket.status] || selectedTicket.status}
                </span>
                {selectedTicket.category && <Badge variant="outline" className="text-[10px]">{selectedTicket.category}</Badge>}
              </div>
              {selectedTicket.description && (
                <p className="text-xs text-muted-foreground mt-2">{selectedTicket.description}</p>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              <TicketMessages ticketId={selectedTicket.id} userId={user?.id} />
            </div>

            {selectedTicket.status !== "closed" && (
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="text-sm"
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  />
                  <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim()} aria-label="Enviar">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* New Ticket Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Novo Chamado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} placeholder="Descreva brevemente" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={novaCategoria} onValueChange={setNovaCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
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
            <div>
              <Label>Descrição</Label>
              <Textarea value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} placeholder="Descreva o problema..." rows={4} />
            </div>
            <Button onClick={handleCreate} disabled={creatingTicket} className="w-full">
              {creatingTicket ? "Criando..." : "Criar Chamado"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="acesso">
          <SupportAccessManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TicketMessages({ ticketId, userId }: { ticketId: string; userId?: string }) {
  const { data: messages, isLoading } = useSupportMessages(ticketId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) return <div className="p-4"><Skeleton className="h-20" /></div>;

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        <Inbox className="w-5 h-5 mr-2" /> Nenhuma mensagem ainda
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] p-4" ref={scrollRef}>
      <div className="space-y-3">
        {messages.map(m => {
          const isOwn = m.user_id === userId;
          return (
            <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <p>{m.content}</p>
                <span className="text-[9px] opacity-60 block mt-1">
                  {format(new Date(m.created_at), "dd/MM HH:mm")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
