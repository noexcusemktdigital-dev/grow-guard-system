import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export function useSupportTickets() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["support-tickets", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("support_tickets").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useSupportMessages(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["support-messages", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase.from("support_messages").select("*").eq("ticket_id", ticketId!).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });
}

export function useSupportTicketMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createTicket = useMutation({
    mutationFn: async (ticket: { title: string; description?: string; category?: string; priority?: string }) => {
      const { data, error } = await supabase.from("support_tickets").insert({ ...ticket, organization_id: orgId!, created_by: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support-tickets"] }),
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("support_tickets").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support-tickets"] }),
  });

  const sendMessage = useMutation({
    mutationFn: async (msg: { ticket_id: string; content: string; is_internal?: boolean }) => {
      const { data, error } = await supabase.from("support_messages").insert({ ...msg, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support-messages"] }),
  });

  return { createTicket, updateTicket, sendMessage };
}
