import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MessageCircle, Settings2, PanelRightOpen, PanelRightClose, WifiOff } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatContactList } from "@/components/cliente/ChatContactList";
import { ChatConversation } from "@/components/cliente/ChatConversation";
import { ChatLeadPanel } from "@/components/cliente/ChatLeadPanel";
import {
  useWhatsAppInstance,
  useWhatsAppContacts,
  useWhatsAppMessages,
  useMarkContactRead,
  useContactPreviews,
  type WhatsAppContact,
} from "@/hooks/useWhatsApp";
import { useClienteAgents } from "@/hooks/useClienteAgents";
import { useCrmLeads } from "@/hooks/useClienteCrm";
import { useCrmLeadMutations, useCrmFunnels } from "@/hooks/useClienteCrm";
import { useLinkContactToCrmLead } from "@/hooks/useWhatsApp";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { setCachedContacts, getCachedContacts } from "@/lib/chatCache";

export default function ClienteChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: instance, isLoading: loadingInstance } = useWhatsAppInstance();
  const { data: contacts = [], isLoading: loadingContacts } = useWhatsAppContacts(instance?.id ?? null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [leadPanelOpen, setLeadPanelOpen] = useState(false);
  
  const [mobileShowConversation, setMobileShowConversation] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disconnectedAtRef = useRef<number | null>(null);

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  );
  const { data: messages = [], isLoading: loadingMessages } = useWhatsAppMessages(selectedContact?.id ?? null);
  const markRead = useMarkContactRead();
  const { data: agentsData } = useClienteAgents();
  const { data: funnelsData } = useCrmFunnels();
  const { createLead } = useCrmLeadMutations();
  const linkMutation = useLinkContactToCrmLead();

  const isConnected = instance?.status === "connected";

  // Cache contacts to IndexedDB
  useEffect(() => {
    if (contacts.length > 0) setCachedContacts(contacts);
  }, [contacts]);

  // Auto check-status + sync chats on mount
  useEffect(() => {
    if (!instance?.instance_id) return;
    let cancelled = false;
    const sync = async () => {
      try {
        await supabase.functions.invoke("whatsapp-setup", {
          body: { action: "check-status", instanceId: instance.instance_id },
        });
        if (!cancelled) queryClient.invalidateQueries({ queryKey: ["whatsapp-instances"] });
      } catch (err) { console.error("Auto check-status failed:", err); }
      try {
        await supabase.functions.invoke("whatsapp-sync-chats", {
          body: { instanceId: instance.instance_id },
        });
        if (!cancelled) queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
      } catch (err) { console.error("Auto sync-chats failed:", err); }
      try {
        supabase.functions.invoke("whatsapp-sync-photos", { body: { limit: 30 } })
          .then(() => { if (!cancelled) queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] }); })
          .catch(() => {});
      } catch {}
    };
    sync();
    return () => { cancelled = true; };
  }, [instance?.instance_id, queryClient]);

  const agents = useMemo(() =>
    (agentsData || []).filter((a) => a.status === "active").map((a) => ({ id: a.id, name: a.name })),
    [agentsData]
  );

  const contactIdsStr = useMemo(() => contacts.map((c) => c.id).sort().join(","), [contacts]);
  const contactIds = useMemo(() => contactIdsStr ? contactIdsStr.split(",") : [], [contactIdsStr]);
  const { data: realPreviews } = useContactPreviews(contactIds);
  const lastMessages = realPreviews ?? new Map<string, string>();

  const handleSelectContact = (contact: WhatsAppContact) => {
    setSelectedContactId(contact.id);
    setMobileShowConversation(true);
    if (contact.unread_count > 0) markRead.mutate(contact.id);
  };

  const handleBackToList = useCallback(() => setMobileShowConversation(false), []);


  const handleCreateLeadFromChat = async () => {
    if (!selectedContact) return;
    try {
      const defaultFunnel = funnelsData?.find(f => f.is_default) || funnelsData?.[0];
      const dbStages = defaultFunnel?.stages as any[] | undefined;
      const firstStage = Array.isArray(dbStages) && dbStages.length > 0 ? (dbStages[0].key || "novo") : "novo";
      const lead = await createLead.mutateAsync({
        name: selectedContact.name || selectedContact.phone,
        phone: selectedContact.phone, source: "whatsapp", tags: ["whatsapp"],
        funnel_id: defaultFunnel?.id, stage: firstStage,
      });
      if (lead?.id) {
        await linkMutation.mutateAsync({ contactId: selectedContact.id, leadId: lead.id });
        toast({ title: "Lead criado e vinculado!" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao criar lead", description: err.message, variant: "destructive" });
    }
  };

  const selectedContactIdRef = useRef<string | null>(null);
  useEffect(() => { selectedContactIdRef.current = selectedContactId; }, [selectedContactId]);

  // Realtime subscriptions with connection tracking
  useEffect(() => {
    if (!instance?.organization_id) return;

    const channel = supabase
      .channel(`whatsapp-realtime-${instance.organization_id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_messages", filter: `organization_id=eq.${instance.organization_id}` }, (payload: any) => {
        const changedContactId = payload.new?.contact_id || payload.old?.contact_id;
        if (changedContactId && changedContactId === selectedContactIdRef.current) {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
        }
        queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_contacts", filter: `organization_id=eq.${instance.organization_id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeConnected(true);
          disconnectedAtRef.current = null;
          // Stop polling if active
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          if (!disconnectedAtRef.current) disconnectedAtRef.current = Date.now();
          // Start polling fallback after 10s disconnected
          setTimeout(() => {
            if (disconnectedAtRef.current && Date.now() - disconnectedAtRef.current >= 10000 && !pollingRef.current) {
              setRealtimeConnected(false);
              pollingRef.current = setInterval(() => {
                queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
                queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
              }, 5000);
            }
          }, 10000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    };
  }, [instance?.organization_id, queryClient]);

  const formattedPhone = instance?.phone_number
    ? instance.phone_number.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '+$1 ($2) $3-$4')
    : null;

  if (loadingInstance) {
    return (
      <div className="space-y-4">
        <PageHeader title="Conversas" subtitle="Central de atendimento WhatsApp" icon={<MessageCircle className="w-5 h-5 text-primary" />} />
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Conversas" subtitle="Central de atendimento integrada ao WhatsApp" icon={<MessageCircle className="w-5 h-5 text-primary" />} />
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <Badge variant="outline" className="gap-1.5 mb-3 text-orange-400 border-orange-500/30">WhatsApp não conectado</Badge>
            <p className="text-sm font-medium">Configure o WhatsApp para usar as conversas</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mb-4">
              Vá em Integrações para conectar sua instância Z-API e começar a enviar e receber mensagens.
            </p>
            <Button size="sm" onClick={() => navigate("/cliente/integracoes")}>
              <Settings2 className="w-4 h-4 mr-1" /> Ir para Integrações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden h-[calc(100vh-3.5rem)]">
      {/* Reconnecting banner */}
      {!realtimeConnected && (
        <div className="flex items-center justify-center gap-2 py-1.5 bg-amber-500/10 border-b border-amber-500/30 text-amber-600 text-xs font-medium shrink-0">
          <WifiOff className="w-3.5 h-3.5" />
          Reconectando... (atualizando a cada 5s)
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Contact List */}
        <div className={`${mobileShowConversation ? "hidden md:flex" : "flex"} w-full md:w-[340px] shrink-0 h-full overflow-hidden flex-col`}>
          {loadingContacts ? (
            <div className="p-4 space-y-3 border-r border-border">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[68px] rounded-lg" />)}
            </div>
          ) : (
            <ChatContactList
              contacts={contacts}
              selectedId={selectedContact?.id ?? null}
              onSelect={handleSelectContact}
              agents={agents}
              isConnected={isConnected}
              lastMessages={lastMessages}
              connectedPhone={formattedPhone ?? undefined}
            />
          )}
        </div>

        {/* Conversation */}
        <div className={`${mobileShowConversation ? "flex" : "hidden md:flex"} flex-1 min-w-0 h-full overflow-hidden relative flex-col`}>
          <ChatConversation
            contact={selectedContact}
            messages={messages}
            isLoading={loadingMessages}
            agents={agents}
            instanceId={instance?.instance_id ?? null}
            onBack={handleBackToList}
          />
          {selectedContact && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm z-10"
              onClick={() => setLeadPanelOpen(!leadPanelOpen)}
            >
              {leadPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* Lead Info Panel */}
        {leadPanelOpen && selectedContact && (
          <ChatLeadPanel
            contact={selectedContact}
            onClose={() => setLeadPanelOpen(false)}
            onCreateLead={handleCreateLeadFromChat}
          />
        )}
      </div>
    </div>
  );
}
