import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export function useNetworkClientStats() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["network-client-stats", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_network_client_stats", {
        _org_id: orgId!,
      } as any);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as {
        total_clients: number;
        active_clients: number;
        total_leads: number;
        total_credits: number;
        total_mrr: number;
        expiring_soon: number;
      } | null;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}
