import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { useClienteSubscription } from "./useClienteSubscription";
import { getEffectiveLimits, TRIAL_PLAN } from "@/constants/plans";

export function useLeadQuota() {
  const { data: orgId } = useUserOrgId();
  const { data: subscription } = useClienteSubscription();

  const isTrial = subscription?.plan === "trial" || subscription?.status === "trialing";
  const limits = getEffectiveLimits(
    subscription?.plan !== "trial" ? subscription?.plan : null,
    null,
    isTrial,
  );

  const { data: activeLeadCount = 0, isLoading } = useQuery({
    queryKey: ["crm-lead-count", orgId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("crm_leads")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId!)
        .is("archived_at", null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  const maxLeads = limits.maxLeads;
  const atLimit = activeLeadCount >= maxLeads;
  const percentage = maxLeads > 0 ? (activeLeadCount / maxLeads) * 100 : 0;
  const planName = isTrial ? "Trial" : (subscription?.plan ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : "Starter");

  return {
    activeLeadCount,
    maxLeads,
    atLimit,
    percentage,
    planName,
    isLoading,
  };
}
