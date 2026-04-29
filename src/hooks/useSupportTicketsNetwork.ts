// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface NetworkTicket {
  id: string;
  organization_id: string;
  org_name: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  subcategory: string | null;
  created_by: string | null;
  assigned_to: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSupportTicketsNetwork() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["support-tickets-network", user?.id],
    queryFn: async () => {
      // Uses get_all_network_tickets which auto-detects the matrix org from auth.uid(),
      // so any matrix member sees ALL tickets regardless of which org is "active" in their session.
      const { data, error } = await supabase.rpc("get_all_network_tickets");
      if (error) throw error;
      return (data ?? []) as NetworkTicket[];
    },
    enabled: !!user,
  });
}
