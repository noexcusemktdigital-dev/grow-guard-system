// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAdsConnectionStatus } from "./use-ads-connections";

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
  hasConnection?: boolean;
}

/**
 * useMetaAdsInsights — versão multi-client.
 *
 * Se a org do usuário tiver uma ads_connection ativa, invoca a edge function
 * meta-ads-insights que usará o token da conexão da org.
 * Se não houver conexão, retorna { hasConnection: false }.
 *
 * @param period  Período de análise
 * @param orgId   Org ID do usuário (opcional — quando omitido usa a conta central NOE)
 */
export function useMetaAdsInsights(period: MetaAdsPeriod = "today", orgId?: string | null) {
  const connectionStatus = useAdsConnectionStatus();

  // Quando orgId é fornecido, verificar se tem conexão ativa
  const hasActiveConnection = orgId
    ? (connectionStatus.data?.hasActiveConnection ?? false)
    : true; // conta NOE central não precisa de conexão OAuth por org

  return useQuery<MetaAdsInsights>({
    queryKey: ["meta-ads-insights", period, orgId ?? "central"],
    queryFn: async () => {
      // Se a org não tem conexão ativa, retornar indicador de ausência
      if (orgId && !hasActiveConnection) {
        return {
          period,
          account: { id: "", spend: 0, impressions: 0, clicks: 0, leads: 0, cpl: 0, ctr: 0 },
          campaigns: [],
          hasConnection: false,
        };
      }

      const body: Record<string, unknown> = { period };
      if (orgId) body.org_id = orgId;

      // WORKAROUND: meta-ads-insights não está deployed ainda — usar ads-sync-metrics com mode="noe_insights"
      // Quando meta-ads-insights for deployada pelo Lovable Publish, reverter esta linha.
      const { data, error } = await supabase.functions.invoke("ads-sync-metrics", {
        body: { ...body, mode: "noe_insights" },
      });
      if (error) throw error;

      return { ...(data as MetaAdsInsights), hasConnection: true };
    },
    enabled: orgId ? connectionStatus.isSuccess : true,
    refetchInterval: 5 * 60 * 1000, // 5 min
    staleTime: 4 * 60 * 1000,
    retry: 1,
  });
}
