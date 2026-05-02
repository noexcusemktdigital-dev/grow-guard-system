import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/integrations/supabase/typed";

type PlatformErrorRow = Tables<"platform_error_logs">;

export function usePlatformErrors(filters?: { severity?: string; source?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: ["platform-errors", filters],
    queryFn: async () => {
      let query = supabase
        .from("platform_error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.severity && filters.severity !== "all") {
        query = query.eq("severity", filters.severity);
      }
      if (filters?.source && filters.source !== "all") {
        query = query.eq("source", filters.source);
      }
      if (filters?.status === "open") {
        query = query.eq("resolved", false);
      } else if (filters?.status === "resolved") {
        query = query.eq("resolved", true);
      }
      if (filters?.search) {
        query = query.or(`error_message.ilike.%${filters.search}%,function_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PlatformErrorRow[];
    },
  });
}

export function useResolveError() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ errorId, note }: { errorId: string; note?: string }) => {
      const { error } = await supabase
        .from("platform_error_logs")
        .update({ resolved: true, resolved_at: new Date().toISOString(), resolved_note: note || null } as Record<string, unknown>)
        .eq("id", errorId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-errors"] });
      qc.invalidateQueries({ queryKey: ["error-stats"] });
    },
  });
}

export function useDeleteError() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (errorId: string) => {
      const { error } = await supabase
        .from("platform_error_logs")
        .delete()
        .eq("id", errorId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-errors"] });
      qc.invalidateQueries({ queryKey: ["error-stats"] });
    },
  });
}

export function useErrorStats() {
  return useQuery({
    queryKey: ["error-stats"],
    queryFn: async () => {
      const { data: all, error } = await supabase
        .from("platform_error_logs")
        .select("id, severity, source, resolved, created_at, resolved_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;

      const items = (all ?? []) as PlatformErrorRow[];
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const openErrors = items.filter((e: PlatformErrorRow) => !e.resolved);
      const criticalOpen = openErrors.filter((e: PlatformErrorRow) => e.severity === "critical");
      const resolvedThisMonth = items.filter((e: PlatformErrorRow) => e.resolved && e.resolved_at && new Date(e.resolved_at) >= startOfMonth);
      const last24hErrors = items.filter((e: PlatformErrorRow) => new Date(e.created_at) >= last24h);

      // Errors per day (last 7 days)
      const dailyCounts: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dailyCounts[key] = 0;
      }
      items.forEach((e: PlatformErrorRow) => {
        const key = e.created_at.slice(0, 10);
        if (key in dailyCounts) dailyCounts[key]++;
      });

      // By source
      const bySource: Record<string, number> = {};
      items.forEach((e: PlatformErrorRow) => {
        bySource[e.source] = (bySource[e.source] || 0) + 1;
      });

      return {
        totalOpen: openErrors.length,
        criticalOpen: criticalOpen.length,
        resolvedThisMonth: resolvedThisMonth.length,
        last24h: last24hErrors.length,
        dailyCounts: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
        bySource: Object.entries(bySource).map(([source, count]) => ({ source, count })),
      };
    },
  });
}
