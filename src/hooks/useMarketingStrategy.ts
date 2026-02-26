import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export interface MarketingStrategy {
  id: string;
  organization_id: string;
  answers: Record<string, any>;
  score_percentage: number;
  nivel: string;
  is_active: boolean;
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
    mutationFn: async (payload: { answers: Record<string, any>; score_percentage: number; nivel: string }) => {
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