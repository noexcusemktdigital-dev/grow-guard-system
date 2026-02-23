import { useState, useEffect, useRef } from "react";
import {
  Send, Loader2, MessageCircle, Bot, User, UserPlus, ExternalLink,
  ArrowRight, AlertTriangle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatMessageBubble } from "./ChatMessageBubble";
import {
  useSendWhatsAppMessage,
  useUpdateAttendingMode,
  useFindLeadByPhone,
  useLinkContactToCrmLead,
  useUpdateContactAgent,
} from "@/hooks/useWhatsApp";
import { useCrmLeadMutations } from "@/hooks/useClienteCrm";
import { useCrmFunnels } from "@/hooks/useClienteCrm";
import type { WhatsAppContact, WhatsAppMessage } from "@/hooks/useWhatsApp";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Props {
  contact: WhatsAppContact | null;
  messages: WhatsAppMessage[];
  isLoading: boolean;
  agents?: { id: string; name: string }[];
}

export function ChatConversation({ contact, messages, isLoading, agents = [] }: Props) {
  const [text, setText] = useState("");
  const sendMutation = useSendWhatsAppMessage();
  const updateMode = useUpdateAttendingMode();
  const updateAgent = useUpdateContactAgent();
  const linkMutation = useLinkContactToCrmLead();
  const { createLead, updateLead } = useCrmLeadMutations();
  const { data: funnelsData } = useCrmFunnels();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

  const contactAny = contact as any;
  const attendingMode = contactAny?.attending_mode || "ai";
  const crmLeadId = contactAny?.crm_lead_id || null;
  const agentId = contactAny?.agent_id || null;

  const { data: matchedLead } = useFindLeadByPhone(contact?.phone ?? null);

  // Get stages from default funnel
  const stages = (() => {
    if (!funnelsData || funnelsData.length === 0) return [];
    const defaultFunnel = funnelsData.find((f) => f.is_default) || funnelsData[0];
    const dbStages = defaultFunnel.stages as any[];
    if (!Array.isArray(dbStages)) return [];
    return dbStages.map((s: any) => ({
      key: s.key || s.label?.toLowerCase().replace(/\s+/g, "_") || "stage",
      label: s.label || "Etapa",
    }));
  })();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !contact) return;
    sendMutation.mutate(
      { contactId: contact.id, contactPhone: contact.phone, message: text.trim() },
      {
        onSuccess: () => setText(""),
        onError: (err: any) =>
          toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" }),
      }
    );
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

  // Auto-link if matched lead found and not yet linked
  useEffect(() => {
    if (matchedLead && contact && !crmLeadId) {
      linkMutation.mutate({ contactId: contact.id, leadId: matchedLead.id });
    }
  }, [matchedLead?.id, contact?.id, crmLeadId]);

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <MessageCircle className="w-7 h-7 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Selecione uma conversa</p>
        <p className="text-xs text-muted-foreground mt-1">
          Escolha um contato à esquerda para visualizar as mensagens
        </p>
      </div>
    );
  }

  const linkedLead = crmLeadId ? matchedLead : null;
  const isHandoffAlert = attendingMode === "human" && contact.unread_count > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header with mode + contact info */}
      <div className="flex items-center gap-3 p-3 border-b border-border">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          attendingMode === "ai" ? "bg-purple-500/10 text-purple-500" : "bg-emerald-500/10 text-emerald-500"
        }`}>
          {attendingMode === "ai" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{contact.name || contact.phone}</p>
          <p className="text-[10px] text-muted-foreground">{contact.phone}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {attendingMode === "ai" ? (
            <Badge variant="outline" className="text-[10px] gap-1 text-purple-500 border-purple-500/30">
              <Bot className="w-3 h-3" /> IA
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] gap-1 text-emerald-500 border-emerald-500/30">
              <User className="w-3 h-3" /> Humano
            </Badge>
          )}

          <Button
            variant={attendingMode === "ai" ? "default" : "outline"}
            size="sm"
            className={`h-7 text-[11px] gap-1 ${attendingMode === "ai" ? "" : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"}`}
            onClick={handleToggleMode}
            disabled={updateMode.isPending}
          >
            {attendingMode === "ai" ? (
              <><User className="w-3 h-3" /> Assumir</>
            ) : (
              <><RefreshCw className="w-3 h-3" /> Devolver p/ IA</>
            )}
          </Button>
        </div>
      </div>

      {/* Action panel */}
      <div className="px-3 py-2 border-b border-border bg-muted/20 space-y-2">
        {/* Handoff alert */}
        {isHandoffAlert && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p className="text-[11px] font-medium">IA solicitou transbordo — atendimento humano necessário</p>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {/* CRM Link */}
          {linkedLead ? (
            <Card className="flex-1 min-w-[200px]">
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
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] gap-1"
              onClick={handleCreateLead}
              disabled={createLead.isPending || linkMutation.isPending}
            >
              <UserPlus className="w-3 h-3" /> Criar Lead
            </Button>
          )}

          {/* Change stage (if linked lead) */}
          {linkedLead && stages.length > 0 && (
            <Select value={linkedLead.stage} onValueChange={handleChangeStage}>
              <SelectTrigger className="h-7 text-[10px] w-32">
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

          {/* Transfer agent */}
          {agents.length > 0 && (
            <Select value={agentId || ""} onValueChange={handleChangeAgent}>
              <SelectTrigger className="h-7 text-[10px] w-32">
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

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            Nenhuma mensagem ainda. Envie a primeira!
          </div>
        ) : (
          messages.map((msg) => <ChatMessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="Digite uma mensagem..."
            className="flex-1 rounded-full h-10"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sendMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full h-10 w-10 shrink-0"
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
