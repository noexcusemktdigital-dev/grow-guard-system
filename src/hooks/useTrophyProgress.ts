import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { differenceInDays, parseISO } from "date-fns";

export interface TrophyStatus {
  unlocked: boolean;
  unlockedAt?: string;
}

export type TrophyId = "first_sale" | "hat_trick" | "top_revenue" | "speed_close" | "first_goal" | "ten_clients";

export function useTrophyProgress(goalProgressData?: Record<string, { percent: number }>, overrideOrgId?: string | null) {
  const { data: userOrgId } = useUserOrgId();
  const orgId = overrideOrgId ?? userOrgId;

  return useQuery({
    queryKey: ["trophy-progress", orgId, goalProgressData ? Object.keys(goalProgressData).length : 0],
    queryFn: async (): Promise<Record<TrophyId, TrophyStatus>> => {
      if (!orgId) return getEmptyTrophies();

      // Fetch won leads
      const { data: wonLeads } = await supabase
        .from("crm_leads")
        .select("id, value, won_at, created_at")
        .eq("organization_id", orgId)
        .not("won_at", "is", null)
        .order("won_at", { ascending: true });

      const leads = wonLeads || [];

      // first_sale
      const firstSale: TrophyStatus = leads.length >= 1
        ? { unlocked: true, unlockedAt: formatDate(leads[0].won_at) }
        : { unlocked: false };

      // hat_trick (3 clients)
      const hatTrick: TrophyStatus = leads.length >= 3
        ? { unlocked: true, unlockedAt: formatDate(leads[2].won_at) }
        : { unlocked: false };

      // ten_clients
      const tenClients: TrophyStatus = leads.length >= 10
        ? { unlocked: true, unlockedAt: formatDate(leads[9].won_at) }
        : { unlocked: false };

      // top_revenue (R$20k in a single month)
      const monthlyRevenue: Record<string, { total: number; lastDate: string }> = {};
      for (const l of leads) {
        const month = l.won_at!.substring(0, 7); // YYYY-MM
        if (!monthlyRevenue[month]) monthlyRevenue[month] = { total: 0, lastDate: l.won_at! };
        monthlyRevenue[month].total += Number(l.value) || 0;
        if (l.won_at! > monthlyRevenue[month].lastDate) monthlyRevenue[month].lastDate = l.won_at!;
      }
      const topMonth = Object.values(monthlyRevenue).find(m => m.total >= 20000);
      const topRevenue: TrophyStatus = topMonth
        ? { unlocked: true, unlockedAt: formatDate(topMonth.lastDate) }
        : { unlocked: false };

      // speed_close (won in < 7 days)
      const fastLead = leads.find(l => {
        const days = differenceInDays(parseISO(l.won_at!), parseISO(l.created_at));
        return days < 7;
      });
      const speedClose: TrophyStatus = fastLead
        ? { unlocked: true, unlockedAt: formatDate(fastLead.won_at) }
        : { unlocked: false };

      // first_goal (any goal >= 100%)
      const hasGoalMet = goalProgressData
        ? Object.values(goalProgressData).some(g => g.percent >= 100)
        : false;
      const firstGoal: TrophyStatus = hasGoalMet
        ? { unlocked: true }
        : { unlocked: false };

      return {
        first_sale: firstSale,
        hat_trick: hatTrick,
        top_revenue: topRevenue,
        speed_close: speedClose,
        first_goal: firstGoal,
        ten_clients: tenClients,
      };
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

function formatDate(isoDate: string | null): string | undefined {
  if (!isoDate) return undefined;
  return new Date(isoDate).toLocaleDateString("pt-BR");
}

function getEmptyTrophies(): Record<TrophyId, TrophyStatus> {
  return {
    first_sale: { unlocked: false },
    hat_trick: { unlocked: false },
    top_revenue: { unlocked: false },
    speed_close: { unlocked: false },
    first_goal: { unlocked: false },
    ten_clients: { unlocked: false },
  };
}
