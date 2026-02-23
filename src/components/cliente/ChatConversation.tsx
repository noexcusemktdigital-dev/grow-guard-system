import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Send, Loader2, MessageCircle, Bot, User, UserPlus, ExternalLink,
  ArrowRight, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Paperclip, Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMessageBubble } from "./ChatMessageBubble";
import {
  useSendWhatsAppMessage,
  useUpdateAttendingMode,
  useFindLeadByPhone,
  useLinkContactToCrmLead,
  useUpdateContactAgent,
} from "@/hooks/useWhatsApp";
import { useCrmLeadMutations, useCrmFunnels } from "@/hooks/useClienteCrm";
import type { WhatsAppContact, WhatsAppMessage } from "@/hooks/useWhatsApp";
import { toast } from "@/hooks/use-toast";
import { playSound } from "@/lib/sounds";
import { useNavigate } from "react-router-dom";
import { isToday, isYesterday, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  contact: WhatsAppContact | null;
  messages: WhatsAppMessage[];
  isLoading: boolean;
  agents?: { id: string; name: string }[];
}

const DISPLAY_STEP = 100;

function DateSeparator({ date }: { date: Date }) {
  let label: string;
  if (isToday(date)) label = "Hoje";
  else if (isYesterday(date)) label = "Ontem";
  else label = format(date, "dd 'de' MMM", { locale: ptBR });

  return (
    <div className="flex justify-center my-3">
      <span className="text-[10px] font-medium text-muted-foreground bg-muted/80 px-3 py-0.5 rounded-full shadow-sm">
        {label}
      </span>
    </div>
  );
}

export function ChatConversation({ contact, messages, isLoading, agents = [] }: Props) {
  const [text, setText] = useState("");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(DISPLAY_STEP);
  const [uploading, setUploading] = useState(false);
  const sendMutation = useSendWhatsAppMessage();
  const updateMode = useUpdateAttendingMode();
  const updateAgent = useUpdateContactAgent();
  const linkMutation = useLinkContactToCrmLead();
  const { createLead, updateLead } = useCrmLeadMutations();
  const { data: funnelsData } = useCrmFunnels();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSeenIdRef = useRef<string | null>(null);
  const isNearBottomRef = useRef(true);

  const contactAny = contact as any;
  const attendingMode = contactAny?.attending_mode || null;
  const crmLeadId = contactAny?.crm_lead_id || null;
  const agentId = contactAny?.agent_id || null;

  const { data: matchedLead } = useFindLeadByPhone(contact?.phone ?? null);

  const stages = useMemo(() => {
    if (!funnelsData || funnelsData.length === 0) return [];
    const defaultFunnel = funnelsData.find((f) => f.is_default) || funnelsData[0];
    const dbStages = defaultFunnel.stages as any[];
    if (!Array.isArray(dbStages)) return [];
    return dbStages.map((s: any) => ({
      key: s.key || s.label?.toLowerCase().replace(/\s+/g, "_") || "stage",
      label: s.label || "Etapa",
    }));
  }, [funnelsData]);

  // Reset display count when contact changes
  useEffect(() => {
    setDisplayCount(DISPLAY_STEP);
    lastSeenIdRef.current = null;
    isNearBottomRef.current = true;
  }, [contact?.id]);

  // Smart scroll: track if user is near bottom
  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  // Auto-scroll only when near bottom — use viewport directly to avoid scrollIntoView affecting parents
  useEffect(() => {
    if (!isNearBottomRef.current) return;
    const viewport = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages.length]);

  // Sound effect on new inbound message
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.direction === "inbound" && lastSeenIdRef.current && lastMsg.id !== lastSeenIdRef.current) {
      playSound("notification");
    }
    lastSeenIdRef.current = lastMsg.id;
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !contact) return;
    sendMutation.mutate(
      { contactId: contact.id, contactPhone: contact.phone, message: text.trim() },
      {
        onSuccess: () => { setText(""); isNearBottomRef.current = true; },
        onError: (err: any) =>
          toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !contact) return;
    e.target.value = "";

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${contact.organization_id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("chat-media").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      sendMutation.mutate(
        { contactId: contact.id, contactPhone: contact.phone, message: "", mediaUrl: publicUrl, type: "image" },
        {
          onSuccess: () => { isNearBottomRef.current = true; },
          onError: (err: any) =>
            toast({ title: "Erro ao enviar mídia", description: err.message, variant: "destructive" }),
        }
      );
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleToggleMode = () => {
    if (!contact) return;
    const newMode = attendingMode === "ai" ? "human" : "ai";
    updateMode.mutate(
      { contactId: contact.id, mode: newMode },
      {
        onSuccess: () =>
          toast({ title: newMode === "human" ? "Você assumiu o atendimento" : "IA reativada para este contato" }),
      }
    );
  };

  const handleCreateLead = async () => {
    if (!contact) return;
    try {
      const lead = await createLead.mutateAsync({
        name: contact.name || contact.phone,
        phone: contact.phone,
        source: "whatsapp",
        tags: ["whatsapp"],
      });
      if (lead?.id) {
        await linkMutation.mutateAsync({ contactId: contact.id, leadId: lead.id });
        toast({ title: "Lead criado e vinculado!" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao criar lead", description: err.message, variant: "destructive" });
    }
  };

  const handleChangeAgent = (newAgentId: string) => {
    if (!contact) return;
    updateAgent.mutate(
      { contactId: contact.id, agentId: newAgentId },
      { onSuccess: () => toast({ title: "Agente alterado" }) }
    );
  };

  const handleChangeStage = (newStage: string) => {
    if (!linkedLead) return;
    updateLead.mutate(
      { id: linkedLead.id, stage: newStage },
      { onSuccess: () => toast({ title: `Etapa alterada para "${stages.find(s => s.key === newStage)?.label || newStage}"` }) }
    );
  };

  useEffect(() => {
    if (matchedLead && contact && !crmLeadId) {
      linkMutation.mutate({ contactId: contact.id, leadId: matchedLead.id });
    }
  }, [matchedLead?.id, contact?.id, crmLeadId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const linkedLead = crmLeadId ? matchedLead : null;
  const isHandoffAlert = attendingMode === "human" && (contact?.unread_count ?? 0) > 0;

  // Paginated messages
  const displayedMessages = useMemo(() => {
    if (messages.length <= displayCount) return messages;
    return messages.slice(messages.length - displayCount);
  }, [messages, displayCount]);

  const hasMore = messages.length > displayCount;

  // Group messages by date
  const messagesWithSeparators = useMemo(() => {
    const items: { type: "date" | "message"; date?: Date; message?: WhatsAppMessage; isGrouped?: boolean }[] = [];
    let lastDate: Date | null = null;

    displayedMessages.forEach((msg, i) => {
      const msgDate = new Date(msg.created_at);
      if (!lastDate || !isSameDay(lastDate, msgDate)) {
        items.push({ type: "date", date: msgDate });
        lastDate = msgDate;
      }
      const prev = displayedMessages[i - 1];
      const isGrouped = prev && prev.direction === msg.direction && (msgDate.getTime() - new Date(prev.created_at).getTime()) < 60000;
      items.push({ type: "message", message: msg, isGrouped });
    });

    return items;
  }, [displayedMessages]);

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 whatsapp-bg">
        <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-5">
          <MessageCircle className="w-10 h-10 text-muted-foreground/20" />
        </div>
        <p className="text-base font-semibold text-foreground/80">Conversas WhatsApp</p>
        <p className="text-xs text-muted-foreground mt-2 max-w-sm">
          Selecione uma conversa à esquerda para visualizar e responder mensagens em tempo real
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Premium Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={contact.photo_url || undefined} />
          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
            {(contact.name || contact.phone).substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{contact.name || contact.phone}</p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{contact.phone}</span>
            {linkedLead && (
              <Badge variant="outline" className="text-[8px] px-1 py-0">{linkedLead.stage}</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {attendingMode && (
            <Badge variant="outline" className={`text-[10px] gap-1 rounded-full ${
              attendingMode === "ai" ? "text-purple-500 border-purple-500/30" : "text-emerald-500 border-emerald-500/30"
            }`}>
              {attendingMode === "ai" ? <><Bot className="w-3 h-3" /> IA</> : <><User className="w-3 h-3" /> Humano</>}
            </Badge>
          )}

          {attendingMode && (
            <Button
              variant={attendingMode === "ai" ? "default" : "outline"}
              size="sm"
              className={`h-7 text-[11px] gap-1 rounded-full ${attendingMode !== "ai" ? "border-emerald-500/30 text-emerald-600 hover:bg-emerald-50" : ""}`}
              onClick={handleToggleMode}
              disabled={updateMode.isPending}
            >
              {attendingMode === "ai" ? <><User className="w-3 h-3" /> Assumir</> : <><RefreshCw className="w-3 h-3" /> IA</>}
            </Button>
          )}

          <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full">
                {actionsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      {/* Collapsible Actions Panel */}
      <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
        <CollapsibleContent>
          <div className="px-4 py-2.5 border-b border-border bg-muted/30 space-y-2">
            {isHandoffAlert && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="text-[11px] font-medium">IA solicitou transbordo — atendimento humano necessário</p>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {linkedLead ? (
                <Card className="flex-1 min-w-[200px] border-border/50">
                  <CardContent className="p-2 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate">{linkedLead.name}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[8px] px-1 py-0">{linkedLead.stage}</Badge>
                        {linkedLead.value != null && (
                          <span className="text-[10px] font-medium text-primary">
                            R$ {Number(linkedLead.value).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigate("/cliente/crm")}>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 rounded-full" onClick={handleCreateLead} disabled={createLead.isPending || linkMutation.isPending}>
                  <UserPlus className="w-3 h-3" /> Criar Lead
                </Button>
              )}

              {linkedLead && stages.length > 0 && (
                <Select value={linkedLead.stage} onValueChange={handleChangeStage}>
                  <SelectTrigger className="h-7 text-[10px] w-32 rounded-full">
                    <ArrowRight className="w-3 h-3 mr-1" />
                    <SelectValue placeholder="Etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {agents.length > 0 && (
                <Select value={agentId || ""} onValueChange={handleChangeAgent}>
                  <SelectTrigger className="h-7 text-[10px] w-32 rounded-full">
                    <Bot className="w-3 h-3 mr-1" />
                    <SelectValue placeholder="Agente" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Messages area with WhatsApp background */}
      <ScrollArea className="flex-1 min-h-0 whatsapp-bg" ref={scrollAreaRef} onScrollCapture={handleScroll}>
        <div className="px-4 py-3">
          {hasMore && (
            <div className="flex justify-center mb-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-[11px] text-muted-foreground rounded-full bg-muted/60 hover:bg-muted"
                onClick={() => setDisplayCount((c) => c + DISPLAY_STEP)}
              >
                Carregar anteriores
              </Button>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs text-muted-foreground bg-muted/60 inline-block px-3 py-1 rounded-full">
                Nenhuma mensagem ainda. Envie a primeira!
              </p>
            </div>
          ) : (
            messagesWithSeparators.map((item, i) => {
              if (item.type === "date") return <DateSeparator key={`date-${i}`} date={item.date!} />;
              return <ChatMessageBubble key={item.message!.id} message={item.message!} isGrouped={item.isGrouped} />;
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* WhatsApp-style Input */}
      <div className="px-3 py-2.5 border-t border-border bg-card">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,application/pdf"
          className="hidden"
          onChange={handleFileUpload}
        />
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-end gap-2"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-muted-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </Button>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              placeholder="Digite uma mensagem..."
              className="w-full resize-none rounded-2xl bg-muted/50 border-0 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground min-h-[36px] max-h-[120px]"
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sendMutation.isPending}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            className="rounded-full h-9 w-9 shrink-0 shadow-md"
            disabled={!text.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
