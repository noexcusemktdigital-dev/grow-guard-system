import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  Send, ArrowLeft, User, Image, Paperclip, X, FileText, Download,
  KanbanSquare, List, ChevronRight,
} from "lucide-react";
import { useSupportTickets, useSupportMessages, useSupportTicketMutations } from "@/hooks/useSupportTickets";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
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
const PRIORITY_LABELS: Record<string, string> = { low: "Baixa", normal: "Normal", high: "Alta", urgent: "Urgente" };
const PRIORITY_COLORS: Record<string, string> = {
  low: "text-muted-foreground",
  normal: "text-foreground",
  high: "text-amber-600",
  urgent: "text-red-600",
};
const CATEGORIAS = ["Financeiro", "Jurídico", "Comercial", "Marketing", "Treinamentos", "Sistema", "Dúvidas gerais"];
const SUBCATEGORIAS: Record<string, string[]> = {
  Financeiro: ["Dúvida de repasse", "DRE", "Cobrança", "Nota fiscal"],
  Jurídico: ["Contrato", "COF", "Documentação"],
  Comercial: ["Proposta", "Calculadora", "Estratégia"],
  Marketing: ["Material de campanha", "Criativo", "Meta Ads"],
  Treinamentos: ["Módulo bloqueado", "Certificado", "Prova"],
  Sistema: ["Erro no sistema", "Acesso", "Permissão", "Bug"],
  "Dúvidas gerais": ["Dúvida", "Sugestão", "Reclamação"],
};
const KANBAN_COLUMNS = ["open", "in_progress", "waiting", "resolved"];

export default function FranqueadoSuporte() {
  const { user } = useAuth();
  const { data: tickets, isLoading } = useSupportTickets();
  const { createTicket, sendMessage } = useSupportTicketMutations();
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [msgAttachments, setMsgAttachments] = useState<File[]>([]);
  const [uploadingMsg, setUploadingMsg] = useState(false);

  // New ticket form
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("Dúvidas gerais");
  const [novaSubcategoria, setNovaSubcategoria] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaPrioridade, setNovaPrioridade] = useState("normal");
  const [novoAnexos, setNovoAnexos] = useState<File[]>([]);
  const [creatingTicket, setCreatingTicket] = useState(false);

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
      let attachmentUrls: string[] = [];
      if (novoAnexos.length > 0) {
        attachmentUrls = await uploadFiles(novoAnexos);
      }
      await createTicket.mutateAsync({
        title: novoTitulo,
        description: novaDescricao,
        category: novaCategoria,
        subcategory: novaSubcategoria || undefined,
        priority: novaPrioridade,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      } as any);
      setCreateDialog(false);
      setNovoTitulo("");
      setNovaDescricao("");
      setNovoAnexos([]);
      setNovaSubcategoria("");
      toast.success("Chamado criado!");
    } catch (err) {
      console.error("Erro ao criar chamado:", err);
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
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      toast.error("Erro ao enviar mensagem");
    }
    setUploadingMsg(false);
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
            <h1 className="text-xl font-bold">Suporte</h1>
            <Badge variant="outline" className="text-[10px]">Unidade</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Abra e acompanhe seus chamados com a Matriz</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            <Button
              size="sm" variant={viewMode === "kanban" ? "default" : "ghost"}
              className="rounded-none h-8 px-3"
              onClick={() => setViewMode("kanban")}
            >
              <KanbanSquare className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm" variant={viewMode === "list" ? "default" : "ghost"}
              className="rounded-none h-8 px-3"
              onClick={() => setViewMode("list")}
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Button size="sm" onClick={() => setCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Chamado
          </Button>
        </div>
      </div>

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
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar" className="w-[200px] h-8 text-xs pl-8" />
        </div>
      </div>

      {/* Content */}
      {viewMode === "kanban" ? (
        <KanbanView tickets={filtered} onSelect={setSelectedTicket} selectedId={selectedTicket?.id} />
      ) : (
        <ListView tickets={filtered} onSelect={setSelectedTicket} selectedId={selectedTicket?.id} />
      )}

      {/* Detail Panel */}
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
                    {selectedTicket.subcategory && (
                      <Badge variant="outline" className="text-[10px]">{selectedTicket.subcategory}</Badge>
                    )}
                    <span className={`text-[10px] font-medium ${PRIORITY_COLORS[selectedTicket.priority] || ""}`}>
                      ● {PRIORITY_LABELS[selectedTicket.priority] || selectedTicket.priority}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Aberto {formatDistanceToNow(new Date(selectedTicket.created_at), { locale: ptBR, addSuffix: true })}
                    </span>
                  </div>
                  {selectedTicket.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{selectedTicket.description}</p>
                  )}
                  {/* Ticket attachments */}
                  {selectedTicket.attachments && (selectedTicket.attachments as string[]).length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {(selectedTicket.attachments as string[]).map((url: string, i: number) => (
                        <AttachmentPreview key={i} url={url} />
                      ))}
                    </div>
                  )}
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
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={e => {
                        if (e.target.files) setMsgAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                      }}
                    />
                    <div className="h-9 w-9 flex items-center justify-center rounded-md border border-border hover:bg-muted transition-colors">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </label>
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="text-sm"
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  />
                  <Button size="icon" onClick={handleSendMessage} disabled={uploadingMsg || (!newMessage.trim() && msgAttachments.length === 0)} aria-label="Enviar">
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
              <Input value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} placeholder="Descreva brevemente o problema" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={novaCategoria} onValueChange={v => { setNovaCategoria(v); setNovaSubcategoria(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategoria</Label>
                <Select value={novaSubcategoria} onValueChange={setNovaSubcategoria}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(SUBCATEGORIAS[novaCategoria] ?? []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
            <div>
              <Label>Descrição</Label>
              <Textarea value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} placeholder="Descreva o problema em detalhes..." rows={4} />
            </div>
            <div>
              <Label>Anexos (imagens, PDF, documentos)</Label>
              <div className="mt-1">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={e => {
                      if (e.target.files) setNovoAnexos(prev => [...prev, ...Array.from(e.target.files!)]);
                    }}
                  />
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Clique para adicionar arquivos</span>
                </label>
                {novoAnexos.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {novoAnexos.map((f, i) => (
                      <div key={i} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-[11px]">
                        <FileText className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{f.name}</span>
                        <button onClick={() => setNovoAnexos(prev => prev.filter((_, j) => j !== i))}>
                          <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

/* ── Kanban View ─────────────────────────────────────────────── */
function KanbanView({ tickets, onSelect, selectedId }: { tickets: any[]; onSelect: (t: any) => void; selectedId?: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map(status => {
        const col = tickets.filter(t => t.status === status);
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
              ) : (
                col.map(t => (
                  <TicketCard key={t.id} ticket={t} onClick={() => onSelect(t)} isSelected={t.id === selectedId} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── List View ───────────────────────────────────────────────── */
function ListView({ tickets, onSelect, selectedId }: { tickets: any[]; onSelect: (t: any) => void; selectedId?: string }) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-16">
        <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Nenhum chamado encontrado</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {tickets.map(t => (
        <Card
          key={t.id}
          className={`cursor-pointer transition-all hover:shadow-md ${t.id === selectedId ? "ring-2 ring-primary" : ""}`}
          onClick={() => onSelect(t)}
        >
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{t.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status] || ""}`}>
                  {STATUS_LABELS[t.status] || t.status}
                </span>
                <span className="text-[10px] text-muted-foreground">{t.category || "Geral"}</span>
                <span className={`text-[10px] font-medium ${PRIORITY_COLORS[t.priority] || ""}`}>
                  {PRIORITY_LABELS[t.priority] || t.priority}
                </span>
                <span className="text-[10px] text-muted-foreground">{format(new Date(t.created_at), "dd/MM")}</span>
                {t.attachments && (t.attachments as string[]).length > 0 && (
                  <Paperclip className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Ticket Card (for Kanban) ────────────────────────────────── */
function TicketCard({ ticket: t, onClick, isSelected }: { ticket: any; onClick: () => void; isSelected: boolean }) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-1.5">
        <p className="text-sm font-medium line-clamp-2">{t.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px]">{t.category || "Geral"}</Badge>
          <span className={`text-[10px] font-medium ${PRIORITY_COLORS[t.priority] || ""}`}>
            ● {PRIORITY_LABELS[t.priority] || t.priority}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(t.created_at), { locale: ptBR, addSuffix: true })}
          </span>
          {t.attachments && (t.attachments as string[]).length > 0 && (
            <Paperclip className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Attachment Preview ──────────────────────────────────────── */
function AttachmentPreview({ url }: { url: string }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img src={url} alt="Anexo" className="w-16 h-16 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-muted rounded-lg px-3 py-2 text-[11px] hover:bg-muted/80 transition-colors">
      <Download className="w-3.5 h-3.5" />
      <span className="truncate max-w-[100px]">{url.split("/").pop()}</span>
    </a>
  );
}

/* ── Messages with Realtime ──────────────────────────────────── */
function TicketMessages({ ticketId, userId }: { ticketId: string; userId?: string }) {
  const { data: messages, isLoading, refetch } = useSupportMessages(ticketId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`support-messages-${ticketId}`)
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

  // Group messages by date
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
          Nenhuma mensagem ainda. Inicie a conversa!
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              {/* Date separator */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {format(new Date(dateKey), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Messages as documented cards */}
              <div className="space-y-3">
                {msgs.map((m: any) => {
                  const isMine = m.user_id === userId;
                  const msgAttachments = m.attachments as string[] | null;
                  return (
                    <div
                      key={m.id}
                      className={`rounded-lg border bg-card overflow-hidden ${
                        isMine ? "border-l-4 border-l-primary" : "border-l-4 border-l-muted-foreground/30"
                      }`}
                    >
                      {/* Message header */}
                      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            isMine ? "bg-primary/15 text-primary" : "bg-muted-foreground/15 text-muted-foreground"
                          }`}>
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold">{isMine ? "Você" : "Matriz"}</span>
                            <span className="text-[10px] text-muted-foreground ml-2">
                              {isMine ? "Franqueado" : "Equipe de Suporte"}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(m.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                        </span>
                      </div>

                      {/* Message content */}
                      <div className="px-4 py-3">
                        {m.content && m.content !== "📎 Anexo" && (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        )}

                        {/* Attachments grid */}
                        {msgAttachments && msgAttachments.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                            {msgAttachments.map((url: string, i: number) => {
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
