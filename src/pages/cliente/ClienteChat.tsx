import { useState, useEffect } from "react";
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

  const isConnected = instance?.status === "connected";

  // Mark contact as read on select
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_messages", filter: `organization_id=eq.${instance.organization_id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
          queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "whatsapp_contacts", filter: `organization_id=eq.${instance.organization_id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instance?.organization_id, queryClient]);

  if (loadingInstance) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader title="Chat WhatsApp" subtitle="Central de atendimento" icon={<MessageCircle className="w-5 h-5 text-primary" />} />
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader title="Chat WhatsApp" subtitle="Central de atendimento integrada ao WhatsApp" icon={<MessageCircle className="w-5 h-5 text-primary" />} />
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <Badge variant="outline" className="gap-1.5 mb-3 text-orange-400 border-orange-500/30">
              WhatsApp não conectado
            </Badge>
            <p className="text-sm font-medium">Configure o WhatsApp para usar o chat</p>
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
    <div className="max-w-6xl mx-auto space-y-4">
      <PageHeader
        title="Chat WhatsApp"
        subtitle="Central de atendimento integrada ao WhatsApp"
        icon={<MessageCircle className="w-5 h-5 text-primary" />}
      />

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[320px_1fr] h-[calc(100vh-220px)] min-h-[500px]">
          {loadingContacts ? (
            <div className="p-4 space-y-3 border-r border-border">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : (
            <ChatContactList
              contacts={contacts}
              selectedId={selectedContact?.id ?? null}
              onSelect={handleSelectContact}
            />
          )}
          <ChatConversation
            contact={selectedContact}
            messages={messages}
            isLoading={loadingMessages}
          />
        </div>
      </Card>
    </div>
  );
}
