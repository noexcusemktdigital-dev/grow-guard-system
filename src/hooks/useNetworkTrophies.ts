import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { differenceInDays, parseISO } from "date-fns";
import type { TrophyId, TrophyStatus } from "./useTrophyProgress";

export function useNetworkTrophies() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["network-trophies", orgId],
    queryFn: async (): Promise<Record<string, Record<TrophyId, TrophyStatus>>> => {
      if (!orgId) return {};

      // Get child orgs (units)
      const { data: childOrgs } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("parent_org_id", orgId);

      if (!childOrgs?.length) return {};

      const results: Record<string, Record<TrophyId, TrophyStatus>> = {};

      for (const org of childOrgs) {
        const { data: wonLeads } = await supabase
          .from("crm_leads")
          .select("id, value, won_at, created_at")
          .eq("organization_id", org.id)
          .not("won_at", "is", null)
          .order("won_at", { ascending: true });

        const leads = wonLeads || [];

        const firstSale: TrophyStatus = leads.length >= 1
          ? { unlocked: true, unlockedAt: formatDate(leads[0].won_at) }
          : { unlocked: false };

        const hatTrick: TrophyStatus = leads.length >= 3
          ? { unlocked: true, unlockedAt: formatDate(leads[2].won_at) }
          : { unlocked: false };

        const tenClients: TrophyStatus = leads.length >= 10
          ? { unlocked: true, unlockedAt: formatDate(leads[9].won_at) }
          : { unlocked: false };

        const monthlyRevenue: Record<string, { total: number; lastDate: string }> = {};
        for (const l of leads) {
          const month = l.won_at!.substring(0, 7);
          if (!monthlyRevenue[month]) monthlyRevenue[month] = { total: 0, lastDate: l.won_at! };
          monthlyRevenue[month].total += Number(l.value) || 0;
          if (l.won_at! > monthlyRevenue[month].lastDate) monthlyRevenue[month].lastDate = l.won_at!;
        }
        const topMonth = Object.values(monthlyRevenue).find(m => m.total >= 20000);
        const topRevenue: TrophyStatus = topMonth
          ? { unlocked: true, unlockedAt: formatDate(topMonth.lastDate) }
          : { unlocked: false };

        const fastLead = leads.find(l => {
          const days = differenceInDays(parseISO(l.won_at!), parseISO(l.created_at));
          return days < 7;
        });
        const speedClose: TrophyStatus = fastLead
          ? { unlocked: true, unlockedAt: formatDate(fastLead.won_at) }
          : { unlocked: false };

        results[org.id] = {
          first_sale: firstSale,
          hat_trick: hatTrick,
          top_revenue: topRevenue,
          speed_close: speedClose,
          first_goal: { unlocked: false },
          ten_clients: tenClients,
        };
      }

      return results;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

function formatDate(isoDate: string | null): string | undefined {
  if (!isoDate) return undefined;
  return new Date(isoDate).toLocaleDateString("pt-BR");
}
