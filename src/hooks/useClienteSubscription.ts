// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

export function useClienteSubscription() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["subscription", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}
