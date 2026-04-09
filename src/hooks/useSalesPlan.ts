import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export interface SalesPlan {
  id: string;
  organization_id: string;
  answers: Record<string, unknown>;
  score: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesPlanHistoryItem {
  id: string;
  organization_id: string;
  answers: Record<string, unknown>;
  score: number;
  created_by: string | null;
  created_at: string;
}

export function useSalesPlan() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["sales-plan", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_plans")
        .select("*")
        .eq("organization_id", orgId!)
        .maybeSingle();
      if (error) throw error;
      return data as SalesPlan | null;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSalesPlanCompleted() {
  const { data: plan, isLoading } = useSalesPlan();
  // A plan is "completed" if it exists and has at least 3 answered questions
  // (previously required >5, which was too strict and blocked PRO users)
  const completed = !!plan && Object.keys(plan.answers || {}).length >= 3;
  return { completed, isLoading };
}

export function useSalesPlanHistory() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["sales-plan-history", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_plan_history")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SalesPlanHistoryItem[];
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useArchiveSalesPlan() {
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ answers, score }: { answers: Record<string, unknown>; score: number }) => {
      if (!orgId) throw new Error("No org");
      const { error } = await supabase
        .from("sales_plan_history")
        .insert({
          organization_id: orgId,
          answers,
          score,
          created_by: user?.id,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-plan-history"] });
    },
  });
}

export function useSaveSalesPlan() {
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ answers, score }: { answers: Record<string, unknown>; score: number }) => {
      if (!orgId) throw new Error("No org");
      const { data, error } = await supabase
        .from("sales_plans")
        .upsert(
          {
            organization_id: orgId,
            answers,
            score,
            created_by: user?.id,
          } as any,
          { onConflict: "organization_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-plan"] });
    },
  });
}
