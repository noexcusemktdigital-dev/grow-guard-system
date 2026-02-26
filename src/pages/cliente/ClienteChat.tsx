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
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  );
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

  // Fetch last message preview for each contact
  const [lastMessages, setLastMessages] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!instance?.organization_id || contacts.length === 0) return;
    const orgId = instance.organization_id;

    // Fetch last message for all contacts in one query using distinct on
    const fetchPreviews = async () => {
      const contactIds = contacts.map(c => c.id);
      // Batch fetch: get recent messages for all contacts, then pick last per contact
      const { data } = await supabase
        .from("whatsapp_messages" as any)
        .select("contact_id, content, direction, type, created_at")
        .eq("organization_id", orgId)
        .in("contact_id", contactIds)
        .order("created_at", { ascending: false })
        .limit(contacts.length * 2); // rough: 2 msgs per contact max

      if (data) {
        const map = new Map<string, string>();
        const seen = new Set<string>();
        for (const msg of data as any[]) {
          if (seen.has(msg.contact_id)) continue;
          seen.add(msg.contact_id);
          const prefix = msg.direction === "outbound" ? "Você: " : "";
          const text = msg.type === "audio" ? "🎵 Áudio" : msg.type === "image" ? "📷 Imagem" : (msg.content || "");
          map.set(msg.contact_id, prefix + (text.length > 60 ? text.slice(0, 57) + "..." : text));
        }
        setLastMessages(map);
      }
    };

    fetchPreviews();
  }, [instance?.organization_id, contacts]);

  const handleSelectContact = (contact: WhatsAppContact) => {
    setSelectedContactId(contact.id);
    if (contact.unread_count > 0) {
      markRead.mutate(contact.id);
    }
  };

  // Realtime subscriptions — optimized: only invalidate selected contact's messages
  useEffect(() => {
    if (!instance?.organization_id) return;
    const channel = supabase
      .channel("whatsapp-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_messages", filter: `organization_id=eq.${instance.organization_id}` }, (payload: any) => {
        const changedContactId = payload.new?.contact_id || payload.old?.contact_id;
        // Only invalidate messages for the currently selected contact
        if (changedContactId && changedContactId === selectedContactId) {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
        }
        // Always update contacts list (for unread badges & last_message_at)
        queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "whatsapp_contacts", filter: `organization_id=eq.${instance.organization_id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [instance?.organization_id, queryClient, selectedContactId]);

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
            leadStages={leadStages}
            isConnected={isConnected}
            lastMessages={lastMessages}
          />
        )}
      </div>
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        <ChatConversation
          contact={selectedContact}
          messages={messages}
          isLoading={loadingMessages}
          agents={agents}
        />
      </div>
    </div>
  );
}
