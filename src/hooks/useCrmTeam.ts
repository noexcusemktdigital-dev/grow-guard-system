import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export interface TeamMember {
  user_id: string;
  full_name: string;
  role: string;
}

export function useCrmTeam() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["crm-team", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_memberships")
        .select("user_id, role, profiles(full_name)")
        .eq("organization_id", orgId!);
      if (error) throw error;
      return (data || []).map((m: any) => ({
        user_id: m.user_id,
        full_name: m.profiles?.full_name || "Sem nome",
        role: m.role || "membro",
      })) as TeamMember[];
    },
    enabled: !!orgId,
  });
}
