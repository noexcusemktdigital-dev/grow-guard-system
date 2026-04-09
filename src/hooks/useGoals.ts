/* eslint-disable */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

interface GoalRow {
  id: string;
  title: string;
  type: string;
  target_value: number;
  current_value: number;
  scope: string;
  status: string;
  priority: number | null;
  period_start: string | null;
  period_end: string | null;
  assigned_to: string | null;
  unit_org_id: string | null;
  team_id: string | null;
  metric: string | null;
  organization_id: string;
  parent_name?: string;
  [key: string]: unknown;
}

interface RankingRow {
  id: string;
  month: number;
  year: number;
  [key: string]: unknown;
}

export function useGoals(scope?: string, month?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["goals", orgId, scope, month],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_goals_with_parent", {
        _org_id: orgId ?? "",
      });
      if (error) throw error;
      let results = data as unknown as GoalRow[];
      if (scope && scope !== "all") results = results.filter((g: GoalRow) => g.scope === scope);
      return results;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
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
        _org_id: orgId ?? "",
      });
      if (error) throw error;
      let results = (data as unknown as GoalRow[]).filter((g: GoalRow) =>
        ["active", "completed"].includes(g.status) &&
        (!g.period_end || g.period_end >= firstOfMonth)
      );
      if (scope && scope !== "all") results = results.filter((g: GoalRow) => g.scope === scope);
      results.sort((a: GoalRow, b: GoalRow) => (a.priority ?? 99) - (b.priority ?? 99));
      return results;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
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
        _org_id: orgId ?? "",
      });
      if (error) throw error;
      const results = (data as unknown as GoalRow[]).filter((g: GoalRow) => g.period_end && g.period_end < firstOfMonth);
      results.sort((a: GoalRow, b: GoalRow) => (b.period_end ?? "").localeCompare(a.period_end ?? ""));
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
      const { data, error } = await supabase.rpc("get_rankings_with_parent", { _org_id: orgId ?? "" });
      if (error) throw error;
      let results = data as unknown as RankingRow[];
      if (month) results = results.filter((r: RankingRow) => r.month === month);
      if (year) results = results.filter((r: RankingRow) => r.year === year);
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
      const { data, error } = await supabase.from("goals").insert({ ...goal, organization_id: orgId ?? "" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goals-active"] });
      qc.invalidateQueries({ queryKey: ["goals-historic"] });
      qc.invalidateQueries({ queryKey: ["goal-progress"] });
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("goals").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goals-active"] });
      qc.invalidateQueries({ queryKey: ["goals-historic"] });
      qc.invalidateQueries({ queryKey: ["goal-progress"] });
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
      qc.invalidateQueries({ queryKey: ["goal-progress"] });
    },
  });

  return { createGoal, updateGoal, archiveGoal };
}
