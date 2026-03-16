import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

export interface NetworkAIUsage {
  total_credits: number;
  orgs_zero_credits: number;
  orgs_low_credits: number;
  ai_messages_24h: number;
  ai_messages_7d: number;
  tokens_24h: number;
  tokens_7d: number;
  zero_credit_orgs: { id: string; name: string; balance: number }[];
  low_credit_orgs: { id: string; name: string; balance: number; percent: number }[];
}

export function useNetworkAIUsage() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["network-ai-usage", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_network_ai_usage", {
        _org_id: orgId!,
      } as any);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as NetworkAIUsage | null;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });
}
