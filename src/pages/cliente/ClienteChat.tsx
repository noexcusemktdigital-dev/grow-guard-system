import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MessageCircle, Settings2, PanelRightOpen, PanelRightClose } from "lucide-react";
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
  type WhatsAppContact,
} from "@/hooks/useWhatsApp";
import { useClienteAgents } from "@/hooks/useClienteAgents";
import { useCrmLeads } from "@/hooks/useClienteCrm";
import { useCrmLeadMutations, useCrmFunnels } from "@/hooks/useClienteCrm";
import { useLinkContactToCrmLead } from "@/hooks/useWhatsApp";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { playSound } from "@/lib/sounds";

export default function ClienteChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: instance, isLoading: loadingInstance } = useWhatsAppInstance();
  const { data: contacts = [], isLoading: loadingContacts } = useWhatsAppContacts(instance?.id ?? null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [leadPanelOpen, setLeadPanelOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  );
  const { data: messages = [], isLoading: loadingMessages } = useWhatsAppMessages(selectedContact?.id ?? null);
  const markRead = useMarkContactRead();
  const { data: agentsData } = useClienteAgents();
  const { data: leadsData } = useCrmLeads();
  const { data: funnelsData } = useCrmFunnels();
  const { createLead } = useCrmLeadMutations();
  const linkMutation = useLinkContactToCrmLead();

  const isConnected = instance?.status === "connected";

  // Auto check-status + sync chats on mount
  useEffect(() => {
    if (!instance?.instance_id) return;
    let cancelled = false;
    const sync = async () => {
      try {
        await supabase.functions.invoke("whatsapp-setup", {
          body: { action: "check-status", instanceId: instance.instance_id },
        });
        if (!cancelled) {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-instances"] });
        }
      } catch (err) {
        console.error("Auto check-status failed:", err);
      }
      // Auto sync chats
      try {
        await supabase.functions.invoke("whatsapp-sync-chats", {
          body: { instanceId: instance.instance_id },
        });
        if (!cancelled) {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
        }
      } catch (err) {
        console.error("Auto sync-chats failed:", err);
      }
      // Auto sync photos (separate call, non-blocking)
      try {
        supabase.functions.invoke("whatsapp-sync-photos", {
          body: { limit: 30 },
        }).then(() => {
          if (!cancelled) {
            queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
          }
        }).catch(() => {});
      } catch {}
    };
    sync();
    return () => { cancelled = true; };
  }, [instance?.instance_id, queryClient]);

  const agents = useMemo(() =>
    (agentsData || [])
      .filter((a) => a.status === "active")
      .map((a) => ({ id: a.id, name: a.name })),
    [agentsData]
  );


  // Use last_message_preview from contacts directly (no separate DB fetch needed)
  const lastMessages = useMemo(() => {
    const map = new Map<string, string>();
    contacts.forEach((c) => {
      const preview = (c as any).last_message_preview;
      if (preview) map.set(c.id, preview);
    });
    return map;
  }, [contacts]);

  const handleSelectContact = (contact: WhatsAppContact) => {
    setSelectedContactId(contact.id);
    if (contact.unread_count > 0) {
      markRead.mutate(contact.id);
    }
  };

  const handleSyncChats = useCallback(async () => {
    if (!instance?.instance_id || isSyncing) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-sync-chats", {
        body: { instanceId: instance.instance_id },
      });
      if (error) throw error;
      toast({
        title: "Sincronização concluída!",
        description: `${data.contacts_created} novos contatos, ${data.contacts_updated} atualizados de ${data.total_chats_found} conversas encontradas.`,
      });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
      
      // Trigger photo sync in background
      supabase.functions.invoke("whatsapp-sync-photos", { body: { limit: 30 } })
        .then(() => queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] }))
        .catch(() => {});
    } catch (err: any) {
      toast({ title: "Erro na sincronização", description: err.message, variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  }, [instance?.instance_id, isSyncing, queryClient]);

  const handleCreateLeadFromChat = async () => {
    if (!selectedContact) return;
    try {
      const defaultFunnel = funnelsData?.find(f => f.is_default) || funnelsData?.[0];
      const dbStages = defaultFunnel?.stages as any[] | undefined;
      const firstStage = Array.isArray(dbStages) && dbStages.length > 0
        ? (dbStages[0].key || "novo")
        : "novo";

      const lead = await createLead.mutateAsync({
        name: selectedContact.name || selectedContact.phone,
        phone: selectedContact.phone,
        source: "whatsapp",
        tags: ["whatsapp"],
        funnel_id: defaultFunnel?.id,
        stage: firstStage,
      });
      if (lead?.id) {
        await linkMutation.mutateAsync({ contactId: selectedContact.id, leadId: lead.id });
        toast({ title: "Lead criado e vinculado!" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao criar lead", description: err.message, variant: "destructive" });
    }
  };

  // Stable ref for selectedContactId to avoid recreating Realtime channel
  const selectedContactIdRef = useRef<string | null>(null);
  useEffect(() => { selectedContactIdRef.current = selectedContactId; }, [selectedContactId]);

  // Realtime subscriptions (stable — no selectedContactId in deps)
  useEffect(() => {
    if (!instance?.organization_id) return;
    const channel = supabase
      .channel("whatsapp-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_messages", filter: `organization_id=eq.${instance.organization_id}` }, (payload: any) => {
        const changedContactId = payload.new?.contact_id || payload.old?.contact_id;
        if (changedContactId && changedContactId === selectedContactIdRef.current) {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
        }
        queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
        // Play notification sound for new inbound messages
        if (payload.eventType === "INSERT" && payload.new?.direction === "inbound") {
          try { playSound("notification"); } catch {}
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_contacts", filter: `organization_id=eq.${instance.organization_id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
            <Badge variant="outline" className="gap-1.5 mb-3 text-orange-400 border-orange-500/30">
              WhatsApp não conectado
            </Badge>
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
    <div className="flex overflow-hidden h-[calc(100vh-3.5rem)]">
      {/* Contact List */}
      <div className="w-[340px] shrink-0 h-full overflow-hidden">
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
            onSync={handleSyncChats}
            isSyncing={isSyncing}
          />
        )}
      </div>

      {/* Conversation */}
      <div className="flex-1 min-w-0 h-full overflow-hidden relative">
        <ChatConversation
          contact={selectedContact}
          messages={messages}
          isLoading={loadingMessages}
          agents={agents}
          instanceId={instance?.instance_id ?? null}
        />
        {/* Toggle lead panel button */}
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
  );
}
