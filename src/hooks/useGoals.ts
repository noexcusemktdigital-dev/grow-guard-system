import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export function useGoals() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["goals", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*").eq("organization_id", orgId!).order("period_start", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useRankings(month?: number, year?: number) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["rankings", orgId, month, year],
    queryFn: async () => {
      let q = supabase.from("rankings").select("*").eq("organization_id", orgId!).order("position");
      if (month) q = q.eq("month", month);
      if (year) q = q.eq("year", year);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useGoalMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createGoal = useMutation({
    mutationFn: async (goal: { title: string; type?: string; target_value: number; period_start?: string; period_end?: string; assigned_to?: string; unit_org_id?: string }) => {
      const { data, error } = await supabase.from("goals").insert({ ...goal, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("goals").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  return { createGoal, updateGoal };
}
