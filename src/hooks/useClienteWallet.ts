import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export function useClienteWallet() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["credit-wallet", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_wallets")
        .select("*")
        .eq("organization_id", orgId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}
