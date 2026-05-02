import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { useUserOrgId } from "./useUserOrgId";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/typed";

export type MarketingStrategy = Tables<"marketing_strategies">;

export function useActiveStrategy() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["marketing-strategy-active", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_strategies")
        .select("*")
        .eq("organization_id", orgId ?? "")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as MarketingStrategy | null;
    },
    enabled: !!orgId,
  });
}

export function useStrategyHistory() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["marketing-strategy-history", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_strategies")
        .select("*")
        .eq("organization_id", orgId ?? "")
        .eq("is_active", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MarketingStrategy[];
    },
    enabled: !!orgId,
  });
}

export function useHasActiveStrategy(): { hasStrategy: boolean; isLoading: boolean } {
  const { data, isLoading } = useActiveStrategy();
  return { hasStrategy: !!data && data.status === "approved", isLoading };
}

export function useSaveStrategy() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (payload: {
      answers: Record<string, unknown>;
      score_percentage: number;
      nivel: string;
      strategy_result?: Record<string, unknown>;
      status?: string;
    }) => {
      if (!orgId) throw new Error("Org not found");

      // Deactivate previous active strategies
      await supabase
        .from("marketing_strategies")
        .update({ is_active: false } satisfies TablesUpdate<"marketing_strategies">)
        .eq("organization_id", orgId)
        .eq("is_active", true);

      // Insert new active strategy
      const { data, error } = await supabase
        .from("marketing_strategies")
        .insert({
          organization_id: orgId,
          answers: payload.answers,
          score_percentage: payload.score_percentage,
          nivel: payload.nivel,
          is_active: true,
          strategy_result: payload.strategy_result || null,
          status: payload.status || "pending",
        } satisfies TablesInsert<"marketing_strategies">)
        .select()
        .single();

      if (error) throw error;
      return data as MarketingStrategy;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing-strategy-active"] });
      qc.invalidateQueries({ queryKey: ["marketing-strategy-history"] });
    },
  });
}

export function useApproveStrategy() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (strategyId: string) => {
      if (!orgId) throw new Error("Org not found");

      // Debit credits on approval
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      // Primeiro GPS é sempre gratuito — cobra só a partir do segundo
      const { data: previousStrategies } = await supabase
        .from("marketing_strategies")
        .select("id")
        .eq("organization_id", orgId)
        .eq("status", "approved");

      const isFirstGPS = !previousStrategies || previousStrategies.length === 0;

      if (!isFirstGPS) {
        const { error: debitError } = await supabase.rpc("debit_credits", {
          _org_id: orgId,
          _amount: 50,
          _description: "Novo GPS do Negócio aprovado",
          _source: "marketing-strategy",
        });
        if (debitError) throw debitError;
      }

      // Update status
      const { data, error } = await supabase
        .from("marketing_strategies")
        .update({ status: "approved" } satisfies TablesUpdate<"marketing_strategies">)
        .eq("id", strategyId)
        .select()
        .single();

      if (error) throw error;
      return data as MarketingStrategy;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing-strategy-active"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
    },
  });
}

export function useGenerateStrategy() {
  return useMutation({
    mutationFn: async (payload: { answers: Record<string, unknown>; organization_id: string; section?: string }) => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const resp = await invokeEdge("generate-strategy", {
        body: {
          answers: payload.answers,
          organization_id: payload.organization_id,
          ...(payload.section ? { section: payload.section } : {}),
        },
      });

      if (resp.error) {
        const realError = await extractEdgeFunctionError(resp.error);
        throw realError;
      }
      
      const data = resp.data as Record<string, unknown>;
      if (data?.error) throw new Error(String(data.error));
      
      return data;
    },
  });
}
