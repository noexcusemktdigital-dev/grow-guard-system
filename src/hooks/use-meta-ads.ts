import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type MetaAdsPeriod = "today" | "last_7d" | "last_30d";

export interface MetaAdsCampaign {
  id: string;
  name: string;
  status: string; // ACTIVE | PAUSED | ARCHIVED | DELETED
  daily_budget: number | null; // BRL
  objective: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
}

export interface MetaAdsAccount {
  id: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
  ctr: number;
}

export interface MetaAdsInsights {
  period: MetaAdsPeriod;
  account: MetaAdsAccount;
  campaigns: MetaAdsCampaign[];
}

export function useMetaAdsInsights(period: MetaAdsPeriod = "today") {
  return useQuery<MetaAdsInsights>({
    queryKey: ["meta-ads-insights", period],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("meta-ads-insights", {
        body: { period },
      });
      if (error) throw error;
      return data as MetaAdsInsights;
    },
    refetchInterval: 5 * 60 * 1000, // 5 min
    staleTime: 4 * 60 * 1000,
    retry: 1,
  });
}
