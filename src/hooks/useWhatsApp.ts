import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export interface WhatsAppInstance {
  id: string;
  organization_id: string;
  instance_id: string;
  token: string;
  client_token: string;
  status: string;
  phone_number: string | null;
  webhook_url: string | null;
  label: string | null;
  provider: "zapi" | "evolution";
  base_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppContact {
  id: string;
  organization_id: string;
  phone: string;
  name: string | null;
  photo_url: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
  contact_type?: "individual" | "group" | "lid";
  last_message_preview?: string | null;
}

export interface WhatsAppMessage {
  id: string;
  organization_id: string;
  contact_id: string;
  message_id_zapi: string | null;
  direction: string;
  type: string;
  content: string | null;
  media_url: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Returns all instances for the organization
export function useWhatsAppInstances() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["whatsapp-instances", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("whatsapp_instances" as any)
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as WhatsAppInstance[];
    },
    enabled: !!orgId,
  });
}

// Legacy alias — returns the first instance (backward compat)
export function useWhatsAppInstance() {
  const { data: instances, ...rest } = useWhatsAppInstances();
  return {
    ...rest,
    data: instances && instances.length > 0 ? instances[0] : null,
  };
}

export function useWhatsAppContacts(filterInstanceId?: string | null) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["whatsapp-contacts", orgId, filterInstanceId],
    queryFn: async () => {
      if (!orgId) return [];
      let query = supabase
        .from("whatsapp_contacts" as any)
        .select("*")
        .eq("organization_id", orgId)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (filterInstanceId) {
        query = query.eq("instance_id", filterInstanceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      const enriched = (data || []).map((c: any) => {
        const phone = c.phone || "";
        let contact_type: "individual" | "group" | "lid" = c.contact_type || "individual";
        if (contact_type === "individual") {
          if (phone.endsWith("-group") || phone.includes("@g.us") || /^\d+-\d{10,}$/.test(phone)) {
            contact_type = "group";
          } else if (phone.includes("@lid")) {
            contact_type = "lid";
          }
        }
        return { ...c, contact_type };
      });
      const filtered = enriched.filter((c: any) => {
        const phone = c.phone || "";
        if (phone.includes("@broadcast")) return false;
        if (phone === "status") return false;
        if (phone.includes("status@broadcast")) return false;
        return true;
      });
      return filtered as unknown as WhatsAppContact[];
    },
    enabled: !!orgId,
    refetchInterval: 30000,
  });
}

export function useWhatsAppMessages(contactId: string | null) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["whatsapp-messages", orgId, contactId],
    queryFn: async () => {
      if (!orgId || !contactId) return [];
      const { data, error } = await supabase
        .from("whatsapp_messages" as any)
        .select("*")
        .eq("organization_id", orgId)
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return ((data || []) as unknown as WhatsAppMessage[]).reverse();
    },
    enabled: !!orgId && !!contactId,
    refetchInterval: 30000,
  });
}

export function useSetupWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      instanceId?: string;
      instanceToken?: string;
      clientToken?: string;
      action?: string;
      label?: string;
      provider?: "zapi" | "evolution";
      baseUrl?: string;
      apiKey?: string;
      instanceName?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("whatsapp-setup", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-instances"] });
    },
  });
}

export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      contactPhone?: string;
      contactId?: string;
      message: string;
      type?: string;
      mediaUrl?: string;
      quotedMessageId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("whatsapp-send", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
    },
  });
}

export function useMarkContactRead() {
  const queryClient = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (contactId: string) => {
      if (!orgId) return;
      const { error } = await supabase
        .from("whatsapp_contacts" as any)
        .update({ unread_count: 0 } as any)
        .eq("id", contactId)
        .eq("organization_id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
    },
  });
}

export function useUpdateAttendingMode() {
  const queryClient = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async ({ contactId, mode }: { contactId: string; mode: "ai" | "human" }) => {
      if (!orgId) return;
      const { error } = await supabase
        .from("whatsapp_contacts" as any)
        .update({ attending_mode: mode } as any)
        .eq("id", contactId)
        .eq("organization_id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
    },
  });
}

export function useUpdateContactAgent() {
  const queryClient = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async ({ contactId, agentId }: { contactId: string; agentId: string }) => {
      if (!orgId) return;
      const { error } = await supabase
        .from("whatsapp_contacts" as any)
        .update({ agent_id: agentId } as any)
        .eq("id", contactId)
        .eq("organization_id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
    },
  });
}

export function useLinkContactToCrmLead() {
  const queryClient = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async ({ contactId, leadId }: { contactId: string; leadId: string }) => {
      if (!orgId) return;
      await Promise.all([
        supabase
          .from("whatsapp_contacts" as any)
          .update({ crm_lead_id: leadId } as any)
          .eq("id", contactId)
          .eq("organization_id", orgId),
        supabase
          .from("crm_leads")
          .update({ whatsapp_contact_id: contactId } as any)
          .eq("id", leadId),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
    },
  });
}

export function useFindLeadByPhone(phone: string | null) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["crm-lead-by-phone", orgId, phone],
    queryFn: async () => {
      if (!orgId || !phone) return null;
      const { data, error } = await supabase
        .from("crm_leads")
        .select("id, name, phone, stage, value")
        .eq("organization_id", orgId!)
        .eq("phone", phone)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId && !!phone,
  });
}

// Send typing indicator
export function useSendTypingIndicator() {
  return useMutation({
    mutationFn: async (contactPhone: string) => {
      const { data, error } = await supabase.functions.invoke("whatsapp-typing", {
        body: { contactPhone },
      });
      if (error) throw error;
      return data;
    },
  });
}

// Mark messages as read on WhatsApp
export function useMarkWhatsAppRead() {
  return useMutation({
    mutationFn: async (params: { contactPhone?: string; contactId?: string }) => {
      const { data, error } = await supabase.functions.invoke("whatsapp-send", {
        body: { ...params, action: "read", message: "" },
      });
      if (error) throw error;
      return data;
    },
  });
}

// Fetch real message previews for contacts
export function useContactPreviews(contactIds: string[]) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["whatsapp-contact-previews", orgId, contactIds],
    queryFn: async () => {
      if (!orgId || contactIds.length === 0) return new Map<string, string>();

      const { data, error } = await supabase.rpc("get_contact_last_messages", {
        p_org_id: orgId,
        p_contact_ids: contactIds,
      });

      if (error) throw error;

      const map = new Map<string, string>();
      (data || []).forEach((msg: any) => {
        const preview = formatMessagePreview(msg);
        if (preview) map.set(msg.contact_id, preview);
      });

      return map;
    },
    enabled: !!orgId && contactIds.length > 0,
  });
}

function formatMessagePreview(msg: {
  content: string | null;
  type: string;
  direction: string;
  status: string;
}): string {
  if (msg.type === "audio") return "🎤 Áudio";
  if (msg.type === "image") return "📷 Foto";
  if (msg.type === "video") return "📹 Vídeo";
  if (msg.type === "document") return "📄 Documento";

  const text = msg.content || "";

  if (msg.direction === "outbound") {
    const checkmarks = msg.status === "read" || msg.status === "delivered" ? "✓✓" : "✓";
    const truncated = text.length > 80 ? text.substring(0, 80) + "..." : text;
    return `${checkmarks} Você: ${truncated}`;
  }

  const truncated = text.length > 100 ? text.substring(0, 100) + "..." : text;
  return truncated;
}
