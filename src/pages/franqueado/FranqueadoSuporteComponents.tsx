import { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox, Paperclip, ChevronRight, User, Download } from "lucide-react";
import { useSupportMessages } from "@/hooks/useSupportTickets";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
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

const KANBAN_COLUMNS = ["open", "in_progress", "waiting", "resolved"];

/* ── Ticket Card (for Kanban) ────────────────────────────────── */
function TicketCard({ ticket: t, onClick, isSelected }: { ticket: Record<string, unknown>; onClick: () => void; isSelected: boolean }) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-1.5">
        <p className="text-sm font-medium line-clamp-2">{t.title as string}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px]">{(t.category as string) || "Geral"}</Badge>
          <span className={`text-[10px] font-medium ${PRIORITY_COLORS[t.priority as string] || ""}`}>
            ● {PRIORITY_LABELS[t.priority as string] || (t.priority as string)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(t.created_at as string), { locale: ptBR, addSuffix: true })}
          </span>
          {t.attachments && (t.attachments as string[]).length > 0 && (
            <Paperclip className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Kanban View ─────────────────────────────────────────────── */
export function KanbanView({ tickets, onSelect, selectedId }: { tickets: Record<string, unknown>[]; onSelect: (t: Record<string, unknown>) => void; selectedId?: string }) {
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
                  <TicketCard key={t.id as string} ticket={t} onClick={() => onSelect(t)} isSelected={t.id === selectedId} />
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
export function ListView({ tickets, onSelect, selectedId }: { tickets: Record<string, unknown>[]; onSelect: (t: Record<string, unknown>) => void; selectedId?: string }) {
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
          key={t.id as string}
          className={`cursor-pointer transition-all hover:shadow-md ${t.id === selectedId ? "ring-2 ring-primary" : ""}`}
          onClick={() => onSelect(t)}
        >
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{t.title as string}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status as string] || ""}`}>
                  {STATUS_LABELS[t.status as string] || (t.status as string)}
                </span>
                <span className="text-[10px] text-muted-foreground">{(t.category as string) || "Geral"}</span>
                <span className={`text-[10px] font-medium ${PRIORITY_COLORS[t.priority as string] || ""}`}>
                  {PRIORITY_LABELS[t.priority as string] || (t.priority as string)}
                </span>
                <span className="text-[10px] text-muted-foreground">{format(new Date(t.created_at as string), "dd/MM")}</span>
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

/* ── Attachment Preview ──────────────────────────────────────── */
export function AttachmentPreview({ url }: { url: string }) {
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
export function TicketMessages({ ticketId, userId }: { ticketId: string; userId?: string }) {
  const { data: messages, isLoading, refetch } = useSupportMessages(ticketId);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedByDate: Record<string, any[]> = {};
  (messages ?? []).forEach((m) => {
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
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {format(new Date(dateKey), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-3">
                {msgs.map((m) => {
                  const isMine = m.user_id === userId;
                  const attachments = m.attachments as string[] | null;
                  return (
                    <div
                      key={m.id}
                      className={`rounded-lg border bg-card overflow-hidden ${
                        isMine ? "border-l-4 border-l-primary" : "border-l-4 border-l-muted-foreground/30"
                      }`}
                    >
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

                      <div className="px-4 py-3">
                        {m.content && m.content !== "📎 Anexo" && (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        )}

                        {attachments && attachments.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                            {attachments.map((url: string, i: number) => {
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
