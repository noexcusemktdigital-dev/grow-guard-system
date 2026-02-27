import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { differenceInDays, parseISO, startOfDay } from "date-fns";

interface GoalProgressResult {
  goalId: string;
  currentValue: number;
  percent: number;
  status: "batida" | "no_ritmo" | "em_andamento" | "abaixo" | "critica";
  pacePerDay: number;
  requiredPacePerDay: number;
  remaining: number;
  daysLeft: number;
}

export function useGoalProgress(goals: any[] | undefined) {
  const { data: orgId } = useUserOrgId();
  const hasNetworkGoals = goals?.some(g => g.scope === "network" || g.scope === "global");

  return useQuery({
    queryKey: ["goal-progress", orgId, goals?.map(g => g.id).join(",")],
    queryFn: async (): Promise<Record<string, GoalProgressResult>> => {
      if (!goals?.length || !orgId) return {};

      // If there are network/global goals, fetch aggregated data via RPC
      let allLeads: any[] = [];
      let allActivities: any[] = [];

      if (hasNetworkGoals) {
        const { data: networkData } = await supabase.rpc("get_network_crm_data", { _org_id: orgId });
        const rows = networkData || [];
        allLeads = rows.filter((r: any) => r.lead_id).map((r: any) => ({
          id: r.lead_id, value: r.lead_value, won_at: r.lead_won_at,
          created_at: r.lead_created_at, assigned_to: r.lead_assigned_to, stage: r.lead_stage,
        }));
        allActivities = rows.filter((r: any) => r.activity_id).map((r: any) => ({
          id: r.activity_id, type: r.activity_type, created_at: r.activity_created_at, user_id: r.activity_user_id,
        }));
      } else {
        const [leadsRes, activitiesRes] = await Promise.all([
          supabase.from("crm_leads").select("id, value, won_at, created_at, assigned_to").eq("organization_id", orgId),
          supabase.from("crm_activities").select("id, type, created_at, lead_id, user_id").eq("organization_id", orgId),
        ]);
        allLeads = leadsRes.data || [];
        allActivities = activitiesRes.data || [];
      }

      const today = startOfDay(new Date());
      const results: Record<string, GoalProgressResult> = {};

      for (const goal of goals) {
        const periodStart = goal.period_start ? parseISO(goal.period_start) : today;
        const periodEnd = goal.period_end ? parseISO(goal.period_end) : today;
        const metric = goal.metric || "revenue";
        const targetValue = goal.target_value || 0;

        // Filter leads by period
        const leadsInPeriod = allLeads.filter(l => {
          const d = parseISO(l.created_at);
          return d >= periodStart && d <= periodEnd;
        });

        const wonLeads = allLeads.filter(l => {
          if (!l.won_at) return false;
          const d = parseISO(l.won_at);
          return d >= periodStart && d <= periodEnd;
        });

        // Scope filtering
        const filterByScope = (items: any[], field: string = "assigned_to") => {
          if (goal.scope === "individual" && goal.assigned_to) {
            return items.filter(i => i[field] === goal.assigned_to);
          }
          // team scope would need team members - skip for now as team_members aren't easily fetched here
          return items;
        };

        const scopedWon = filterByScope(wonLeads);
        const scopedLeads = filterByScope(leadsInPeriod);
        const scopedActivities = filterByScope(
          allActivities.filter(a => {
            const d = parseISO(a.created_at);
            return d >= periodStart && d <= periodEnd;
          }),
          "user_id"
        );

        let currentValue = 0;
        switch (metric) {
          case "revenue":
            currentValue = scopedWon.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
            break;
          case "leads":
            currentValue = scopedLeads.length;
            break;
          case "conversions":
            currentValue = scopedLeads.length > 0
              ? Math.round((scopedWon.length / scopedLeads.length) * 100)
              : 0;
            break;
          case "contracts":
            currentValue = scopedWon.length;
            break;
          case "meetings":
            currentValue = scopedActivities.filter(a => a.type === "meeting").length;
            break;
          case "avg_ticket":
            currentValue = scopedWon.length > 0
              ? Math.round(scopedWon.reduce((s, l) => s + (Number(l.value) || 0), 0) / scopedWon.length)
              : 0;
            break;
          default:
            currentValue = goal.current_value || 0;
        }

        const percent = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
        const totalDays = Math.max(differenceInDays(periodEnd, periodStart), 1);
        const daysElapsed = Math.max(differenceInDays(today, periodStart), 1);
        const daysLeft = Math.max(differenceInDays(periodEnd, today), 0);
        const remaining = Math.max(targetValue - currentValue, 0);
        const pacePerDay = currentValue / daysElapsed;
        const requiredPacePerDay = daysLeft > 0 ? remaining / daysLeft : remaining;

        let status: GoalProgressResult["status"] = "em_andamento";
        if (percent >= 100) status = "batida";
        else if (pacePerDay >= requiredPacePerDay * 0.9) status = "no_ritmo";
        else if (percent >= 50) status = "em_andamento";
        else if (percent >= 25) status = "abaixo";
        else status = "critica";

        results[goal.id] = { goalId: goal.id, currentValue, percent, status, pacePerDay, requiredPacePerDay, remaining, daysLeft };
      }

      return results;
    },
    enabled: !!orgId && !!goals?.length,
    refetchInterval: 60000,
  });
}
