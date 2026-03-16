import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

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
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["support-tickets-network", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_network_tickets", {
        _parent_org_id: orgId!,
      });
      if (error) throw error;
      return (data ?? []) as NetworkTicket[];
    },
    enabled: !!orgId,
  });
}
