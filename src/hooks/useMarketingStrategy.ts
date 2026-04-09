import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { useUserOrgId } from "./useUserOrgId";

export interface MarketingStrategy {
  id: string;
  organization_id: string;
  answers: Record<string, unknown>;
  score_percentage: number;
  nivel: string;
  is_active: boolean;
  status: string;
  strategy_result: Record<string, unknown> | null;
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
        .eq("organization_id", orgId ?? "")
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
        .eq("organization_id", orgId ?? "")
        .eq("is_active", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MarketingStrategy[];
    },
    enabled: !!orgId,
  });
}

export function useHasActiveStrategy(): { hasStrategy: boolean; isLoading: boolean } {
  const { data, isLoading } = useActiveStrategy();
  return { hasStrategy: !!data && (data as any).status === "approved", isLoading };
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

      // Check if trial — skip debit for trial users (GPS is free)
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("organization_id", orgId)
        .maybeSingle();

      if (sub?.status !== "trial") {
        // Call debit via RPC (server-side)
        const { error: debitError } = await supabase.rpc("debit_credits" as any, {
          _org_id: orgId,
          _amount: 50,
          _description: "Estratégia de marketing aprovada",
          _source: "marketing-strategy",
        });
        if (debitError) throw debitError;
      }

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
    mutationFn: async (payload: { answers: Record<string, unknown>; organization_id: string; section?: string }) => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const resp = await supabase.functions.invoke("generate-strategy", {
        body: { 
          answers: payload.answers, 
          organization_id: payload.organization_id,
          section: payload.section || "marketing",
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
