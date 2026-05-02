// @ts-nocheck
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, MessageSquare, Search, Inbox, AlertTriangle, Timer, Clock,
  Send, User, Paperclip, X, FileText, Download, Settings, MessagesSquare,
  KanbanSquare, List,
} from "lucide-react";
import { useSupportMessages, useSupportTicketMutations } from "@/hooks/useSupportTickets";
import { useSupportTicketsNetwork, type NetworkTicket } from "@/hooks/useSupportTicketsNetwork";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { AtendimentoConfig } from "@/components/atendimento/AtendimentoConfig";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

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

export default function Atendimento() {
  const { user } = useAuth();
  const { data: tickets, isLoading } = useSupportTicketsNetwork();
  const { data: orgMembers } = useOrgMembers();
  const { createTicket, updateTicket, sendMessage } = useSupportTicketMutations();

  // Equipe da matriz disponível para responsabilizar por chamados
  const matrizTeam = useMemo(
    () => (orgMembers ?? []).filter(m => m.role === "super_admin" || m.role === "admin"),
    [orgMembers]
  );
  const memberMap = useMemo(() => {
    const m = new Map<string, { name: string; avatar: string | null }>();
    (orgMembers ?? []).forEach(x => m.set(x.user_id, { name: x.full_name || x.email, avatar: x.avatar_url }));
    return m;
  }, [orgMembers]);
  const [activeTab, setActiveTab] = useState<"chamados" | "config">("chamados");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<NetworkTicket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [msgAttachments, setMsgAttachments] = useState<File[]>([]);
  const [uploadingMsg, setUploadingMsg] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

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
  }, [tickets, filterStatus, search]);

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
      if (error) { reportError(error, { title: `Erro ao enviar ${file.name}`, category: "support.attachment_upload" }); continue; }
      const { data } = supabase.storage.from("support-attachments").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function handleCreate() {
    if (!novoTitulo.trim()) { reportError(new Error("Informe o título do chamado"), { title: "Informe o título", category: "support.validation" }); return; }
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
    } catch (err) {
      reportError(err, { title: "Erro ao criar chamado", category: "support.create_ticket" });
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
      } as Record<string, unknown>);
      setNewMessage("");
      setMsgAttachments([]);
    } catch (err) {
      reportError(err, { title: "Erro ao enviar mensagem", category: "support.send_message" });
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

  function handleAssignChange(id: string, value: string) {
    const assigned_to = value === "none" ? null : value;
    updateTicket.mutate({ id, assigned_to });
    setSelectedTicket(prev => prev ? { ...prev, assigned_to } : null);
    toast.success(assigned_to ? "Responsável definido" : "Responsável removido");
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
    <div className="w-full space-y-4">
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
          <Button size="sm" onClick={() => setCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Chamado
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "chamados" | "config")}>
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

          {/* Filters + view toggle */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Buscar título ou unidade..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-xs pl-8" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs w-full md:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                className="gap-1.5 h-8"
                onClick={() => setViewMode("kanban")}
              >
                <KanbanSquare className="w-3.5 h-3.5" /> Kanban
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                className="gap-1.5 h-8"
                onClick={() => setViewMode("list")}
              >
                <List className="w-3.5 h-3.5" /> Lista
              </Button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4 border border-dashed border-border rounded-lg">
              <Inbox className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium">Nenhum chamado</p>
              <p className="text-xs text-muted-foreground mt-1">Crie o primeiro ou aguarde os da rede.</p>
            </div>
          ) : viewMode === "kanban" ? (
            <AtendimentoKanbanView tickets={filtered} onSelect={setSelectedTicket} memberMap={memberMap} />
          ) : (
            <AtendimentoListView tickets={filtered} onSelect={setSelectedTicket} selectedId={selectedTicket?.id} memberMap={memberMap} />
          )}
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <AtendimentoConfig />
        </TabsContent>
      </Tabs>

      {/* Chat Dialog — opens when a ticket is selected (from Kanban or List) */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null); }}>
        <DialogContent className="max-w-3xl p-0 gap-0 h-[85vh] flex flex-col">
          {selectedTicket && (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-border flex-shrink-0 bg-muted/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold truncate pr-6">{selectedTicket.title}</h3>
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
                      {selectedTicket.assigned_to && memberMap.get(selectedTicket.assigned_to) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          Resp.: {memberMap.get(selectedTicket.assigned_to)!.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <Select value={selectedTicket.status} onValueChange={(v) => handleStatusChange(selectedTicket.id, v)}>
                      <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedTicket.assigned_to ?? "none"}
                      onValueChange={(v) => handleAssignChange(selectedTicket.id, v)}
                    >
                      <SelectTrigger className="h-8 w-44 text-xs">
                        <SelectValue placeholder="Sem responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">Sem responsável</SelectItem>
                        {matrizTeam.map(m => (
                          <SelectItem key={m.user_id} value={m.user_id} className="text-xs">
                            {m.full_name || m.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedTicket.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{selectedTicket.description}</p>
                )}
              </div>

              {/* Messages */}
              <TicketMessages ticketId={selectedTicket.id} userId={user?.id} />

              {/* Input */}
              {selectedTicket.status !== "closed" && (
                <div className="p-3 border-t border-border space-y-2 flex-shrink-0 bg-muted/20">
                  {msgAttachments.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {msgAttachments.map((f, i) => (
                        <div key={`${f.name}-${i}`} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-[11px]">
                          <FileText className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{f.name}</span>
                          <button onClick={() => setMsgAttachments(prev => prev.filter((_, j) => j !== i))}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 items-end">
                    <label className="cursor-pointer flex-shrink-0">
                      <input type="file" className="hidden" multiple accept="image/*,.pdf,.doc,.docx" onChange={e => {
                        if (e.target.files) setMsgAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                      }} />
                      <div className="h-10 w-10 flex items-center justify-center rounded-md border border-border hover:bg-muted transition-colors">
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </label>
                    <Textarea
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Responder ao chamado..."
                      className="text-sm min-h-[40px] max-h-32 resize-none"
                      rows={1}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button size="icon" className="h-10 w-10 flex-shrink-0" onClick={handleSendMessage} disabled={uploadingMsg || (!newMessage.trim() && msgAttachments.length === 0)} aria-label="Enviar">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

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

  const groupedByDate: Record<string, Array<NonNullable<typeof messages>[number]>> = {};
  (messages ?? []).forEach((m) => {
    const dateKey = format(new Date(m.created_at), "yyyy-MM-dd");
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(m);
  });

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 min-h-0">
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
              <div className="space-y-2">
                {msgs.map((m) => {
                  const isMine = m.user_id === userId;
                  const msgAtt = m.attachments as string[] | null;
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg overflow-hidden border ${
                        isMine
                          ? "bg-primary/10 border-r-4 border-r-primary"
                          : "bg-muted border-l-4 border-l-muted-foreground/30"
                      }`}>
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 gap-3">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            <span className="text-[10px] font-semibold">{isMine ? "Você (Matriz)" : "Franqueado/Cliente"}</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground">
                            {format(new Date(m.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="px-3 py-2">
                          {m.content && m.content !== "📎 Anexo" && (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                          )}
                          {msgAtt && msgAtt.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {msgAtt.map((url: string, i: number) => {
                                const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                return isImg ? (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block group">
                                    <img src={url} alt="Anexo" className="w-full h-24 object-cover rounded-md border border-border group-hover:opacity-80 transition-opacity" />
                                  </a>
                                ) : (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-background rounded-md px-2 py-1.5 text-[11px] hover:bg-background/80 transition-colors">
                                    <Download className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{url.split("/").pop()?.substring(0, 20)}</span>
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Kanban view ──────────────────────────────────────────────── */
const KANBAN_COLUMNS = ["open", "in_progress", "waiting", "resolved"];

type MemberMap = Map<string, { name: string; avatar: string | null }>;

function AtendimentoKanbanCard({ ticket: t, onClick, memberMap }: { ticket: NetworkTicket; onClick: () => void; memberMap: MemberMap }) {
  const responsavel = t.assigned_to ? memberMap.get(t.assigned_to) : null;
  return (
    <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={onClick}>
      <CardContent className="p-3 space-y-2">
        <p className="text-sm font-semibold line-clamp-2">{t.title}</p>
        <p className="text-[11px] text-primary font-medium truncate">{t.org_name}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px]">{t.category || "Geral"}</Badge>
          <span className={`text-[10px] font-medium ${PRIORITY_COLORS[t.priority] || ""}`}>
            ● {PRIORITY_LABELS[t.priority] || t.priority}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/40 gap-2">
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(t.created_at), { locale: ptBR, addSuffix: true })}
          </span>
          {responsavel ? (
            <span className="flex items-center gap-1 text-[10px] text-primary font-medium truncate" title={`Responsável: ${responsavel.name}`}>
              <User className="w-3 h-3" /> {responsavel.name}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground/60 italic">Sem resp.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AtendimentoKanbanView({ tickets, onSelect, memberMap }: { tickets: NetworkTicket[]; onSelect: (t: NetworkTicket) => void; memberMap: MemberMap }) {
  const colColors: Record<string, string> = {
    open: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    waiting: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map(status => {
        const col = tickets.filter(t => t.status === status);
        return (
          <div key={status} className="space-y-2">
            <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-1 z-10">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${colColors[status]}`}>
                {STATUS_LABELS[status]}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">{col.length}</span>
            </div>
            <div className="space-y-2 min-h-[120px]">
              {col.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg p-6 text-center">
                  <p className="text-[11px] text-muted-foreground">Nenhum chamado</p>
                </div>
              ) : (
                col.map(t => (
                  <AtendimentoKanbanCard key={t.id} ticket={t} onClick={() => onSelect(t)} memberMap={memberMap} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── List view ────────────────────────────────────────────────── */
function AtendimentoListView({ tickets, onSelect, selectedId, memberMap }: { tickets: NetworkTicket[]; onSelect: (t: NetworkTicket) => void; selectedId?: string; memberMap: MemberMap }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card divide-y divide-border">
      {tickets.map(t => {
        const responsavel = t.assigned_to ? memberMap.get(t.assigned_to) : null;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${t.id === selectedId ? "bg-muted" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium line-clamp-1 flex-1">{t.title}</p>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {formatDistanceToNow(new Date(t.created_at), { locale: ptBR, addSuffix: false })}
              </span>
            </div>
            <p className="text-[11px] text-primary font-medium mt-0.5 truncate">{t.org_name}</p>
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status] || ""}`}>
                {STATUS_LABELS[t.status] || t.status}
              </span>
              <span className="text-[9px] text-muted-foreground">{t.category || "Geral"}</span>
              <span className={`text-[9px] font-medium ${PRIORITY_COLORS[t.priority] || ""}`}>
                ● {PRIORITY_LABELS[t.priority] || t.priority}
              </span>
              {responsavel && (
                <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  <User className="w-2.5 h-2.5" /> {responsavel.name}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
