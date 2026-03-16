import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

export interface MarketingStrategy {
  id: string;
  organization_id: string;
  answers: Record<string, any>;
  score_percentage: number;
  nivel: string;
  is_active: boolean;
  status: string;
  strategy_result: any | null;
  created_at: string;
}

export function useActiveStrategy() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["marketing-strategy-active", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_strategies" as any)
        .select("*")
        .eq("organization_id", orgId!)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as MarketingStrategy | null;
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
        .from("marketing_strategies" as any)
        .select("*")
        .eq("organization_id", orgId!)
        .eq("is_active", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MarketingStrategy[];
    },
    enabled: !!orgId,
  });
}

export function useHasActiveStrategy(): boolean {
  const { data } = useActiveStrategy();
  return !!data;
}

export function useSaveStrategy() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (payload: {
      answers: Record<string, any>;
      score_percentage: number;
      nivel: string;
      strategy_result?: any;
      status?: string;
    }) => {
      if (!orgId) throw new Error("Org not found");

      // Deactivate previous active strategies
      await supabase
        .from("marketing_strategies" as any)
        .update({ is_active: false } as any)
        .eq("organization_id", orgId)
        .eq("is_active", true);

      // Insert new active strategy
      const { data, error } = await supabase
        .from("marketing_strategies" as any)
        .insert({
          organization_id: orgId,
          answers: payload.answers,
          score_percentage: payload.score_percentage,
          nivel: payload.nivel,
          is_active: true,
          strategy_result: payload.strategy_result || null,
          status: payload.status || "pending",
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as MarketingStrategy;
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

      // Call debit via RPC (server-side)
      const { error: debitError } = await supabase.rpc("debit_credits" as any, {
        _org_id: orgId,
        _amount: 300,
        _description: "Estratégia de marketing aprovada",
        _source: "marketing-strategy",
      });
      if (debitError) throw debitError;

      // Update status
      const { data, error } = await supabase
        .from("marketing_strategies" as any)
        .update({ status: "approved" } as any)
        .eq("id", strategyId)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as MarketingStrategy;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing-strategy-active"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
    },
  });
}

export function useGenerateStrategy() {
  return useMutation({
    mutationFn: async (payload: { answers: Record<string, any>; organization_id: string }) => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const resp = await supabase.functions.invoke("generate-strategy", {
        body: { answers: payload.answers, organization_id: payload.organization_id },
      });

      if (resp.error) throw new Error(resp.error.message || "Erro ao gerar estratégia");
      
      const data = resp.data as any;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
  });
}
