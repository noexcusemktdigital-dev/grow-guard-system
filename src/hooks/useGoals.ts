import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

export function useGoals(scope?: string, month?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["goals", orgId, scope, month],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_goals_with_parent", {
        _org_id: orgId!,
      });
      if (error) throw error;
      let results = data as any[];
      if (scope && scope !== "all") results = results.filter((g: any) => g.scope === scope);
      return results;
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
      const { data, error } = await supabase.rpc("get_goals_with_parent", {
        _org_id: orgId!,
      });
      if (error) throw error;
      let results = (data as any[]).filter((g: any) =>
        ["active", "completed"].includes(g.status) &&
        (!g.period_end || g.period_end >= firstOfMonth)
      );
      if (scope && scope !== "all") results = results.filter((g: any) => g.scope === scope);
      results.sort((a: any, b: any) => (a.priority ?? 99) - (b.priority ?? 99));
      return results;
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
      const { data, error } = await supabase.rpc("get_goals_with_parent", {
        _org_id: orgId!,
      });
      if (error) throw error;
      const results = (data as any[]).filter((g: any) => g.period_end && g.period_end < firstOfMonth);
      results.sort((a: any, b: any) => (b.period_end ?? "").localeCompare(a.period_end ?? ""));
      return results;
    },
    enabled: !!orgId,
  });
}

export function useRankings(month?: number, year?: number) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["rankings", orgId, month, year],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_rankings_with_parent", { _org_id: orgId! });
      if (error) throw error;
      let results = data as any[];
      if (month) results = results.filter((r: any) => r.month === month);
      if (year) results = results.filter((r: any) => r.year === year);
      return results;
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
