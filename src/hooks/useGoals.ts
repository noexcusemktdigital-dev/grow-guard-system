import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export function useGoals(scope?: string, month?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["goals", orgId, scope, month],
    queryFn: async () => {
      let q = supabase.from("goals").select("*").eq("organization_id", orgId!).order("period_start", { ascending: false });
      if (scope && scope !== "all") q = q.eq("scope", scope);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useActiveGoals(scope?: string) {
  const { data: orgId } = useUserOrgId();
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  return useQuery({
    queryKey: ["goals-active", orgId, scope],
    queryFn: async () => {
      let q = supabase.from("goals").select("*")
        .eq("organization_id", orgId!)
        .in("status", ["active", "completed"])
        .or(`period_end.gte.${firstOfMonth},period_end.is.null`)
        .order("priority", { ascending: true });
      if (scope && scope !== "all") q = q.eq("scope", scope);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useHistoricGoals() {
  const { data: orgId } = useUserOrgId();
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  return useQuery({
    queryKey: ["goals-historic", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*")
        .eq("organization_id", orgId!)
        .lt("period_end", firstOfMonth)
        .order("period_end", { ascending: false });
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
    mutationFn: async (goal: {
      title: string;
      type?: string;
      target_value: number;
      period_start?: string;
      period_end?: string;
      assigned_to?: string;
      unit_org_id?: string;
      scope?: string;
      team_id?: string;
      metric?: string;
      priority?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase.from("goals").insert({ ...goal, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goals-active"] });
      qc.invalidateQueries({ queryKey: ["goals-historic"] });
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("goals").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goals-active"] });
      qc.invalidateQueries({ queryKey: ["goals-historic"] });
    },
  });

  const archiveGoal = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("goals").update({ status: "archived" }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goals-active"] });
      qc.invalidateQueries({ queryKey: ["goals-historic"] });
    },
  });

  return { createGoal, updateGoal, archiveGoal };
}
