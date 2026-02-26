import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export function useUnitMembers(unitOrgId: string | null | undefined) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["unit-members", unitOrgId],
    queryFn: async () => {
      // Get members of the unit's organization
      const targetOrgId = unitOrgId || orgId;
      const { data, error } = await supabase
        .from("organization_memberships")
        .select("*, profiles(full_name, avatar_url)")
        .eq("organization_id", targetOrgId!);
      if (error) throw error;
      return data;
    },
    enabled: !!(unitOrgId || orgId),
  });
}
