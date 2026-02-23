import { useState, useEffect, useMemo } from "react";
import { MessageCircle, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatContactList } from "@/components/cliente/ChatContactList";
import { ChatConversation } from "@/components/cliente/ChatConversation";
import {
  useWhatsAppInstance,
  useWhatsAppContacts,
  useWhatsAppMessages,
  useMarkContactRead,
  type WhatsAppContact,
} from "@/hooks/useWhatsApp";
import { useClienteAgents } from "@/hooks/useClienteAgents";
import { useCrmLeads } from "@/hooks/useClienteCrm";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function ClienteChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: instance, isLoading: loadingInstance } = useWhatsAppInstance();
  const { data: contacts = [], isLoading: loadingContacts } = useWhatsAppContacts();
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const { data: messages = [], isLoading: loadingMessages } = useWhatsAppMessages(selectedContact?.id ?? null);
  const markRead = useMarkContactRead();
  const { data: agentsData } = useClienteAgents();
  const { data: leadsData } = useCrmLeads();

  const isConnected = instance?.status === "connected";

  const agents = useMemo(() =>
    (agentsData || [])
      .filter((a) => a.status === "active")
      .map((a) => ({ id: a.id, name: a.name })),
    [agentsData]
  );

  const leadStages = useMemo(() => {
    const map = new Map<string, string>();
    if (!leadsData) return map;
    contacts.forEach((c) => {
      const contactAny = c as any;
      if (contactAny.crm_lead_id) {
        const lead = leadsData.find((l) => l.id === contactAny.crm_lead_id);
        if (lead) map.set(c.id, lead.stage);
      }
    });
    return map;
  }, [contacts, leadsData]);

  // Build last message preview map
  const lastMessages = useMemo(() => {
    const map = new Map<string, string>();
    // We don't have all messages loaded, but we can use contacts' last_message_at as hint
    // For now, just use phone as fallback — real previews would need a separate query
    return map;
  }, []);

  const handleSelectContact = (contact: WhatsAppContact) => {
    setSelectedContact(contact);
    if (contact.unread_count > 0) {
      markRead.mutate(contact.id);
    }
  };

  // Realtime subscriptions
  useEffect(() => {
    if (!instance?.organization_id) return;
    const channel = supabase
      .channel("whatsapp-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_messages", filter: `organization_id=eq.${instance.organization_id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
        queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "whatsapp_contacts", filter: `organization_id=eq.${instance.organization_id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [instance?.organization_id, queryClient]);

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
      <div className="max-w-5xl mx-auto space-y-6">
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
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden gap-3">
      <div className="shrink-0">
        <PageHeader
          title="Conversas"
          subtitle="Central de atendimento WhatsApp"
          icon={<MessageCircle className="w-5 h-5 text-primary" />}
        />
      </div>

      <Card className="flex-1 min-h-0 overflow-hidden border-border/50">
        <div className="grid grid-cols-[340px_1fr] h-full overflow-hidden">
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
              leadStages={leadStages}
              isConnected={isConnected}
              lastMessages={lastMessages}
            />
          )}
          <ChatConversation
            contact={selectedContact}
            messages={messages}
            isLoading={loadingMessages}
            agents={agents}
          />
        </div>
      </Card>
    </div>
  );
}
