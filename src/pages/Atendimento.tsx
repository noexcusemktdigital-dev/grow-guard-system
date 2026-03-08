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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, MessageSquare, Search, Inbox, AlertTriangle, Timer, Clock,
  Send, ArrowLeft, User, Paperclip, X, FileText, Download,
  KanbanSquare, List, ChevronRight, Settings,
} from "lucide-react";
import { useSupportMessages, useSupportTicketMutations } from "@/hooks/useSupportTickets";
import { useSupportTicketsNetwork, type NetworkTicket } from "@/hooks/useSupportTicketsNetwork";
import { AtendimentoConfig } from "@/components/atendimento/AtendimentoConfig";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const STATUS_LABELS: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em análise",
  waiting: "Aguardando",
  resolved: "Resolvido",
  closed: "Encerrado",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  waiting: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  closed: "bg-muted text-muted-foreground",
};
const PRIORITY_LABELS: Record<string, string> = { low: "Baixa", normal: "Normal", medium: "Normal", high: "Alta", urgent: "Urgente" };
const PRIORITY_COLORS: Record<string, string> = {
  low: "text-muted-foreground",
  normal: "text-foreground",
  medium: "text-foreground",
  high: "text-amber-600",
  urgent: "text-red-600",
};
const CATEGORIAS = ["Financeiro", "Jurídico", "Comercial", "Marketing", "Treinamentos", "Sistema", "Dúvidas gerais"];
const KANBAN_COLUMNS = ["open", "in_progress", "waiting", "resolved"];

export default function Atendimento() {
  const { user } = useAuth();
  const { data: tickets, isLoading } = useSupportTicketsNetwork();
  const { createTicket, updateTicket, sendMessage } = useSupportTicketMutations();
  const [activeTab, setActiveTab] = useState<"chamados" | "config">("chamados");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOrigin, setFilterOrigin] = useState("all");
  const [search, setSearch] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<NetworkTicket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [msgAttachments, setMsgAttachments] = useState<File[]>([]);
  const [uploadingMsg, setUploadingMsg] = useState(false);

  // New ticket form
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("Dúvidas gerais");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaPrioridade, setNovaPrioridade] = useState("medium");
  const [creatingTicket, setCreatingTicket] = useState(false);

  const filtered = useMemo(() => {
    return (tickets ?? []).filter(t => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.org_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tickets, filterStatus, filterOrigin, search]);

  const alerts = useMemo(() => {
    const abertos = (tickets ?? []).filter(t => t.status === "open").length;
    const emAnalise = (tickets ?? []).filter(t => t.status === "in_progress").length;
    const aguardando = (tickets ?? []).filter(t => t.status === "waiting").length;
    const resolvidos = (tickets ?? []).filter(t => t.status === "resolved").length;
    return [
      { label: "Abertos", count: abertos, cor: "text-red-500", icon: AlertTriangle },
      { label: "Em Análise", count: emAnalise, cor: "text-amber-500", icon: Timer },
      { label: "Aguardando", count: aguardando, cor: "text-blue-500", icon: Clock },
      { label: "Resolvidos", count: resolvidos, cor: "text-emerald-500", icon: Clock },
    ];
  }, [tickets]);

  async function uploadFiles(files: File[]): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("support-attachments").upload(path, file);
      if (error) { toast.error(`Erro ao enviar ${file.name}`); continue; }
      const { data } = supabase.storage.from("support-attachments").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function handleCreate() {
    if (!novoTitulo.trim()) { toast.error("Informe o título"); return; }
    setCreatingTicket(true);
    try {
      await createTicket.mutateAsync({
        title: novoTitulo,
        description: novaDescricao,
        category: novaCategoria,
        priority: novaPrioridade,
      });
      setCreateDialog(false);
      setNovoTitulo(""); setNovaDescricao("");
      toast.success("Chamado criado!");
    } catch {
      toast.error("Erro ao criar chamado");
    }
    setCreatingTicket(false);
  }

  async function handleSendMessage() {
    if ((!newMessage.trim() && msgAttachments.length === 0) || !selectedTicket) return;
    setUploadingMsg(true);
    try {
      let attachmentUrls: string[] = [];
      if (msgAttachments.length > 0) {
        attachmentUrls = await uploadFiles(msgAttachments);
      }
      await sendMessage.mutateAsync({
        ticket_id: selectedTicket.id,
        content: newMessage || (attachmentUrls.length > 0 ? "📎 Anexo" : ""),
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      } as any);
      setNewMessage("");
      setMsgAttachments([]);
    } catch {
      toast.error("Erro ao enviar mensagem");
    }
    setUploadingMsg(false);
  }

  // Sync selectedTicket when tickets data updates
  useEffect(() => {
    if (selectedTicket && tickets) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated && (updated.status !== selectedTicket.status || updated.updated_at !== selectedTicket.updated_at)) {
        setSelectedTicket(updated);
      }
    }
  }, [tickets, selectedTicket]);

  function handleStatusChange(id: string, status: string) {
    updateTicket.mutate({ id, status });
    setSelectedTicket(prev => prev ? { ...prev, status } : null);
    toast.success(`Status atualizado para ${STATUS_LABELS[status] || status}`);
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        <Skeleton className="h-[500px]" />
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
            <h1 className="text-xl font-bold">Atendimento</h1>
            <Badge variant="secondary" className="text-[10px]">Franqueadora</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Central de suporte e chamados da rede</p>
        </div>
        {activeTab === "chamados" && (
          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button size="sm" variant={viewMode === "kanban" ? "default" : "ghost"} className="rounded-none h-8 px-3" onClick={() => setViewMode("kanban")}>
                <KanbanSquare className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant={viewMode === "list" ? "default" : "ghost"} className="rounded-none h-8 px-3" onClick={() => setViewMode("list")}>
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Button size="sm" onClick={() => setCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-1" /> Novo Chamado
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="chamados" className="gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Chamados</TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5"><Settings className="w-3.5 h-3.5" /> Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="chamados" className="mt-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Buscar título ou unidade..." value={search} onChange={e => setSearch(e.target.value)} className="w-[240px] h-8 text-xs pl-8" />
            </div>
          </div>

          {/* Content */}
          {(filtered ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Nenhum chamado</h3>
              <p className="text-sm text-muted-foreground mb-4">Crie o primeiro chamado ou aguarde os da rede.</p>
              <Button onClick={() => setCreateDialog(true)}><Plus className="w-4 h-4 mr-1" /> Novo Chamado</Button>
            </div>
          ) : viewMode === "kanban" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {KANBAN_COLUMNS.map(status => {
                const col = filtered.filter(t => t.status === status);
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{col.length}</span>
                    </div>
                    <div className="space-y-2 min-h-[200px]">
                      {col.length === 0 ? (
                        <div className="border border-dashed border-border rounded-lg p-4 text-center">
                          <p className="text-[11px] text-muted-foreground">Nenhum chamado</p>
                        </div>
                      ) : col.map(t => (
                        <Card key={t.id} className={`cursor-pointer transition-all hover:shadow-md ${t.id === selectedTicket?.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedTicket(t)}>
                          <CardContent className="p-3 space-y-1.5">
                            <p className="text-sm font-medium line-clamp-2">{t.title}</p>
                            <p className="text-[10px] text-primary font-medium">{t.org_name}</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="outline" className="text-[10px]">{t.category || "Geral"}</Badge>
                              <span className={`text-[10px] font-medium ${PRIORITY_COLORS[t.priority] || ""}`}>
                                ● {PRIORITY_LABELS[t.priority] || t.priority}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground block">
                              {formatDistanceToNow(new Date(t.created_at), { locale: ptBR, addSuffix: true })}
                            </span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(t => (
                <Card key={t.id} className={`cursor-pointer transition-all hover:shadow-md ${t.id === selectedTicket?.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedTicket(t)}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status] || ""}`}>
                          {STATUS_LABELS[t.status] || t.status}
                        </span>
                        <span className="text-[10px] text-primary font-medium">{t.org_name}</span>
                        <span className="text-[10px] text-muted-foreground">{t.category || "Geral"}</span>
                        <span className={`text-[10px] font-medium ${PRIORITY_COLORS[t.priority] || ""}`}>
                          {PRIORITY_LABELS[t.priority] || t.priority}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(t.created_at), "dd/MM")}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <AtendimentoConfig />
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={open => !open && setSelectedTicket(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0">
            <div className="p-5 border-b border-border">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold">{selectedTicket.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedTicket.status] || ""}`}>
                      {STATUS_LABELS[selectedTicket.status] || selectedTicket.status}
                    </span>
                    <Badge variant="outline" className="text-[10px]">{selectedTicket.category || "Geral"}</Badge>
                    <span className={`text-[10px] font-medium ${PRIORITY_COLORS[selectedTicket.priority] || ""}`}>
                      ● {PRIORITY_LABELS[selectedTicket.priority] || selectedTicket.priority}
                    </span>
                    <span className="text-[10px] text-primary font-medium">{selectedTicket.org_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      Aberto {formatDistanceToNow(new Date(selectedTicket.created_at), { locale: ptBR, addSuffix: true })}
                    </span>
                  </div>
                  {selectedTicket.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{selectedTicket.description}</p>
                  )}
                  {/* Status changer */}
                  <div className="mt-3">
                    <Select value={selectedTicket.status} onValueChange={(v) => handleStatusChange(selectedTicket.id, v)}>
                      <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <TicketMessages ticketId={selectedTicket.id} userId={user?.id} />
            </div>

            {/* Input */}
            {selectedTicket.status !== "closed" && (
              <div className="p-3 border-t border-border space-y-2">
                {msgAttachments.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {msgAttachments.map((f, i) => (
                      <div key={i} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-[11px]">
                        <FileText className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{f.name}</span>
                        <button onClick={() => setMsgAttachments(prev => prev.filter((_, j) => j !== i))}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input type="file" className="hidden" multiple accept="image/*,.pdf,.doc,.docx" onChange={e => {
                      if (e.target.files) setMsgAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                    }} />
                    <div className="h-9 w-9 flex items-center justify-center rounded-md border border-border hover:bg-muted transition-colors">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </label>
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Responder ao chamado..."
                    className="text-sm"
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  />
                  <Button size="icon" onClick={handleSendMessage} disabled={uploadingMsg || (!newMessage.trim() && msgAttachments.length === 0)}>
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
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="medium">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} placeholder="Descreva em detalhes..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creatingTicket}>
              {creatingTicket ? "Criando..." : "Criar Chamado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Messages with Realtime ──────────────────────────────────── */
function TicketMessages({ ticketId, userId }: { ticketId: string; userId?: string }) {
  const { data: messages, isLoading, refetch } = useSupportMessages(ticketId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`support-messages-atend-${ticketId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketId, refetch]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) return <div className="flex-1 flex items-center justify-center p-8"><Skeleton className="h-8 w-32" /></div>;

  const groupedByDate: Record<string, any[]> = {};
  (messages ?? []).forEach((m: any) => {
    const dateKey = format(new Date(m.created_at), "yyyy-MM-dd");
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(m);
  });

  return (
    <ScrollArea className="flex-1 p-4 max-h-[400px]" ref={scrollRef}>
      {(!messages || messages.length === 0) ? (
        <div className="text-center text-muted-foreground text-xs py-8">
          Nenhuma mensagem ainda. Responda ao chamado!
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {format(new Date(dateKey), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-3">
                {msgs.map((m: any) => {
                  const isMine = m.user_id === userId;
                  const msgAtt = m.attachments as string[] | null;
                  return (
                    <div key={m.id} className={`rounded-lg border bg-card overflow-hidden ${isMine ? "border-l-4 border-l-primary" : "border-l-4 border-l-muted-foreground/30"}`}>
                      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isMine ? "bg-primary/15 text-primary" : "bg-muted-foreground/15 text-muted-foreground"}`}>
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold">{isMine ? "Você" : "Unidade"}</span>
                            <span className="text-[10px] text-muted-foreground ml-2">
                              {isMine ? "Equipe Matriz" : "Franqueado/Cliente"}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(m.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="px-4 py-3">
                        {m.content && m.content !== "📎 Anexo" && (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        )}
                        {msgAtt && msgAtt.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                            {msgAtt.map((url: string, i: number) => {
                              const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                              return isImg ? (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block group">
                                  <img src={url} alt="Anexo" className="w-full h-24 object-cover rounded-md border border-border group-hover:opacity-80 transition-opacity" />
                                </a>
                              ) : (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 text-[11px] hover:bg-muted/80 transition-colors">
                                  <Download className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{url.split("/").pop()?.substring(0, 25)}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
