import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export interface TrafficPlatformStrategy {
  platform: string;
  objective: string;
  audience: string;
  budget_suggestion: string;
  ad_copies: string[];
  creative_formats: string;
  kpis: {
    estimated_reach: string;
    estimated_clicks: string;
    estimated_cpc: string;
    estimated_cpl: string;
  };
  keywords?: string[];
  interests?: string[];
  tips: string[];
}

export interface TrafficStrategy {
  id: string;
  organization_id: string;
  platforms: TrafficPlatformStrategy[];
  source_data: Record<string, any>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export function useActiveTrafficStrategy() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["traffic-strategy-active", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traffic_strategies" as any)
        .select("*")
        .eq("organization_id", orgId!)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as TrafficStrategy | null;
    },
    enabled: !!orgId,
  });
}

export function useTrafficStrategyHistory() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["traffic-strategy-history", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traffic_strategies" as any)
        .select("*")
        .eq("organization_id", orgId!)
        .eq("is_active", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TrafficStrategy[];
    },
    enabled: !!orgId,
  });
}

export function useGenerateTrafficStrategy() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Org not found");
      const { data, error } = await supabase.functions.invoke("generate-traffic-strategy", {
        body: { organization_id: orgId },
      });
      if (error) throw error;
      if (data?.error) {
        const err = new Error(data.error);
        (err as any).code = data.code;
        throw err;
      }
      return data.strategy as TrafficStrategy;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["traffic-strategy-active"] });
      qc.invalidateQueries({ queryKey: ["traffic-strategy-history"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
    },
  });
}
