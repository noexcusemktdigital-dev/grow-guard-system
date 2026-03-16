import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export interface SalesPlan {
  id: string;
  organization_id: string;
  answers: Record<string, any>;
  score: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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
  const completed = !!plan && Object.keys(plan.answers || {}).length > 5;
  return { completed, isLoading };
}

export function useSaveSalesPlan() {
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ answers, score }: { answers: Record<string, any>; score: number }) => {
      if (!orgId) throw new Error("No org");
      const { data, error } = await supabase
        .from("sales_plans")
        .upsert(
          {
            organization_id: orgId,
            answers,
            score,
            created_by: user?.id,
          },
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
