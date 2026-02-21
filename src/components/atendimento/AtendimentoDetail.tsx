import { useState, useRef, useEffect } from "react";
import { Ticket, TicketMessage, TicketStatus, TICKET_STATUSES, RESPONSAVEIS, isSlaBreached, getSlaRemaining, getMessagesForTicket } from "@/data/atendimentoData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Send, Paperclip, CheckCircle, XCircle, RotateCcw, Star, AlertTriangle, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Props {
  ticket: Ticket;
  onUpdateTicket: (updated: Ticket) => void;
}

const statusBadge: Record<string, string> = {
  "Aberto": "bg-blue-100 text-blue-700",
  "Em analise": "bg-yellow-100 text-yellow-700",
  "Em atendimento": "bg-purple-100 text-purple-700",
  "Aguardando franqueado": "bg-orange-100 text-orange-700",
  "Resolvido": "bg-green-100 text-green-700",
  "Encerrado": "bg-gray-100 text-gray-600",
  "Reaberto": "bg-blue-100 text-blue-700",
};

const priorityBadge: Record<string, string> = {
  "Baixa": "bg-slate-100 text-slate-600",
  "Normal": "bg-blue-100 text-blue-700",
  "Alta": "bg-amber-100 text-amber-700",
  "Urgente": "bg-red-100 text-red-700",
};

export function AtendimentoDetail({ ticket, onUpdateTicket }: Props) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<TicketMessage[]>(getMessagesForTicket(ticket.id));
  const [newMessage, setNewMessage] = useState("");
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const breached = isSlaBreached(ticket);
  const sla = getSlaRemaining(ticket);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: TicketMessage = {
      id: `m_${Date.now()}`,
      chamadoId: ticket.id,
      autorTipo: "suporte",
      autorNome: ticket.responsavelNome,
      mensagem: newMessage.trim(),
      criadoEm: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage("");
    onUpdateTicket({ ...ticket, atualizadoEm: new Date().toISOString() });
  };

  const handleStatusChange = (status: TicketStatus) => {
    onUpdateTicket({ ...ticket, status, atualizadoEm: new Date().toISOString() });
    toast({ title: `Status alterado para "${status}"` });
  };

  const handleResolve = () => {
    handleStatusChange("Resolvido");
  };

  const handleClose = () => {
    setShowRatingDialog(true);
  };

  const handleConfirmClose = () => {
    onUpdateTicket({ ...ticket, status: "Encerrado", avaliacao: rating || undefined, atualizadoEm: new Date().toISOString() });
    setShowRatingDialog(false);
    toast({ title: "Chamado encerrado" });
  };

  const handleReopen = () => {
    handleStatusChange("Reaberto");
  };

  const handleResponsavelChange = (rId: string) => {
    const r = RESPONSAVEIS.find(x => x.id === rId);
    if (r) onUpdateTicket({ ...ticket, responsavelId: r.id, responsavelNome: r.nome, atualizadoEm: new Date().toISOString() });
  };

  const isClosedOrResolved = ticket.status === "Resolvido" || ticket.status === "Encerrado";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left - Info */}
      <Card className="lg:col-span-2 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-mono font-bold">{ticket.numero}</span>
          <Badge className={`${priorityBadge[ticket.prioridade]}`}>{ticket.prioridade}</Badge>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unidade</span>
            <span className="font-medium">{ticket.unidadeNome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Categoria</span>
            <span>{ticket.categoria} / {ticket.subcategoria}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status</span>
            <Badge className={`text-xs ${statusBadge[ticket.status]}`}>{ticket.status}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Responsável</span>
            <Select value={ticket.responsavelId} onValueChange={handleResponsavelChange}>
              <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RESPONSAVEIS.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Abertura</span>
            <span>{format(new Date(ticket.criadoEm), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">SLA</span>
            {breached ? (
              <span className="flex items-center gap-1 text-red-500 font-medium animate-pulse text-xs">
                <AlertTriangle className="w-3 h-3" /> Estourado
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs">
                <Clock className="w-3 h-3" /> {sla}
              </span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1">Descrição</p>
          <p className="text-sm">{ticket.descricao}</p>
        </div>

        {ticket.anexos.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Anexos</p>
            {ticket.anexos.map((a, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-primary">
                <FileText className="w-3 h-3" /> {a}
              </div>
            ))}
          </div>
        )}

        {ticket.status === "Encerrado" && ticket.avaliacao && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Avaliação</p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= ticket.avaliacao! ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          {!isClosedOrResolved && (
            <Button size="sm" variant="default" onClick={handleResolve} className="gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Resolver
            </Button>
          )}
          {ticket.status === "Resolvido" && (
            <Button size="sm" variant="outline" onClick={handleClose} className="gap-1">
              <XCircle className="w-3.5 h-3.5" /> Encerrar
            </Button>
          )}
          {isClosedOrResolved && (
            <Button size="sm" variant="outline" onClick={handleReopen} className="gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Reabrir
            </Button>
          )}
        </div>
      </Card>

      {/* Right - Chat */}
      <Card className="lg:col-span-3 flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-medium">Chat do Chamado</p>
        </div>

        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.autorTipo === "suporte" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.autorTipo === "suporte" ? "bg-muted" : "bg-primary/10"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] h-4">
                      {msg.autorTipo === "suporte" ? "Suporte" : "Franqueado"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-medium">{msg.autorNome}</span>
                  </div>
                  <p className="text-sm">{msg.mensagem}</p>
                  {msg.anexo && (
                    <div className="flex items-center gap-1 text-xs text-primary mt-1">
                      <FileText className="w-3 h-3" /> {msg.anexo}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    {format(new Date(msg.criadoEm), "dd/MM HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {!isClosedOrResolved && (
          <div className="px-4 py-3 border-t flex gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="min-h-[36px] max-h-[80px] resize-none text-sm"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            />
            <Button size="icon" className="shrink-0 h-9 w-9" onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Avaliar Atendimento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Avaliação do franqueado (opcional):</p>
          <div className="flex gap-1 justify-center py-4">
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                className={`w-8 h-8 cursor-pointer transition-colors ${s <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30 hover:text-yellow-400"}`}
                onClick={() => setRating(s)}
              />
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRating(0); handleConfirmClose(); }}>Pular</Button>
            <Button onClick={handleConfirmClose}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
