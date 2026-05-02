import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { useUserOrgId } from "./useUserOrgId";
import type { TablesUpdate } from "@/integrations/supabase/typed";

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
  campaign_structure?: Record<string, unknown>;
  tutorial?: string[];
}

export interface TrafficStrategy {
  id: string;
  organization_id: string;
  platforms: TrafficPlatformStrategy[];
  source_data: Record<string, unknown>;
  is_active: boolean;
  status: string;
  created_by: string | null;
  created_at: string;
}

export interface TrafficWizardData {
  objetivo: string;
  produto: string;
  publico: string[];
  publico_custom: string;
  pagina_destino: string;
  orcamento: number;
  plataformas: string[];
  regiao: string;
  ativos: string[];
}

export function useActiveTrafficStrategy() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["traffic-strategy-active", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traffic_strategies")
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
        .from("traffic_strategies")
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
    mutationFn: async (wizardData: TrafficWizardData & { strategy_id?: string }) => {
      if (!orgId) throw new Error("Org not found");
      const resp = await invokeEdge("generate-traffic-strategy", {
        body: { organization_id: orgId, ...wizardData },
      });
      if (resp.error) {
        const realError = await extractEdgeFunctionError(resp.error);
        throw realError;
      }
      const data = resp.data as Record<string, unknown>;
      if (data?.error) {
        const err = new Error(String(data.error));
        (err as unknown as Record<string, unknown>).code = data.code;
        throw err;
      }
      return data.strategy as TrafficStrategy;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["traffic-strategy-active"] });
      qc.invalidateQueries({ queryKey: ["traffic-strategy-history"] });
    },
  });
}

export function useApproveTrafficStrategy() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (strategyId: string) => {
      if (!orgId) throw new Error("Org not found");
      // Debit credits
      const { error: rpcErr } = await supabase.rpc("debit_credits", {
        _org_id: orgId,
        _amount: 25,
        _description: "Aprovação de Estratégia de Tráfego Pago",
        _source: "traffic_strategy",
      });
      if (rpcErr) throw rpcErr;
      // Update status
      const { error } = await supabase
        .from("traffic_strategies")
        .update({ status: "approved" } satisfies TablesUpdate<"traffic_strategies">)
        .eq("id", strategyId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["traffic-strategy-active"] });
      qc.invalidateQueries({ queryKey: ["traffic-strategy-history"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
    },
  });
}
