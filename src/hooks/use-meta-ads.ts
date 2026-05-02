// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
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
 * Conta central NOE (orgId=null): usa 2-step PostgreSQL via pg_net
 *   1. request_meta_noe_insights — dispara requests async à Meta API
 *   2. collect_meta_noe_insights — lê respostas após ~3s
 *
 * Conta de franqueado (orgId!=null): usa ads-sync-metrics com token OAuth da org.
 *
 * @param period  Período de análise
 * @param orgId   Org ID do usuário (null = conta central NOE)
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

      // ── CONTA CENTRAL NOE (admin/franqueadora) ──
      // WORKAROUND: meta-ads-insights não está deployed via Lovable.
      // Usa 2-step PostgreSQL via pg_net (sem edge function):
      //   1. request_meta_noe_insights — dispara 3 requests async à Meta API
      //   2. collect_meta_noe_insights — lê respostas do net._http_response
      // TODO: quando meta-ads-insights for deployada, substituir por:
      //   supabase.functions.invoke("meta-ads-insights", { body: { period } })
      if (!orgId) {
        // Passo 1: disparar requests
        const { data: reqData, error: reqErr } = await supabase.rpc(
          "request_meta_noe_insights",
          { p_period: period }
        );
        if (reqErr) throw reqErr;
        if ((reqData as any)?.error) throw new Error((reqData as any).error);

        const { acct_id, camp_id, ci_id } = reqData as {
          acct_id: number;
          camp_id: number;
          ci_id: number;
        };

        // Passo 2: aguardar e coletar (polling até 10s)
        let insights: MetaAdsInsights | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          // Esperar 3s na primeira tentativa, 1.5s nas seguintes
          await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 3000 : 1500));

          const { data: collected, error: colErr } = await supabase.rpc(
            "collect_meta_noe_insights",
            { p_acct_id: acct_id, p_camp_id: camp_id, p_ci_id: ci_id, p_period: period }
          );
          if (colErr) throw colErr;

          if (!(collected as any)?.pending) {
            insights = collected as MetaAdsInsights;
            break;
          }
        }
        if (!insights) throw new Error("Timeout aguardando Meta API");
        return { ...insights, hasConnection: true };
      }

      // ── CONTA DE FRANQUEADO com conexão OAuth própria ──
      const { data, error } = await invokeEdge("ads-sync-metrics", {
        body: { org_id: orgId, mode: "noe_insights" },
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
