import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export function useUserFunnelAccess() {
  const { data: orgId } = useUserOrgId();
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ["user-funnel-access", orgId, user?.id, role],
    queryFn: async () => {
      if (!orgId || !user?.id) return null;

      // Admins see all funnels
      if (role === "cliente_admin" || role === "super_admin" || role === "admin") {
        return { accessAll: true as const, funnelIds: [] as string[] };
      }

      // Fetch teams the user belongs to
      const { data: teams, error } = await supabase
        .from("crm_teams")
        .select("funnel_ids")
        .eq("organization_id", orgId);

      if (error) throw error;

      // Filter teams where user is in members (JSONB array)
      // Since we can't filter JSONB arrays easily, we fetch all and filter client-side
      const allTeams = (teams || []) as any[];
      const userTeams = allTeams.filter((t) => {
        const members = Array.isArray(t.members) ? t.members : [];
        return members.includes(user.id);
      });

      const funnelIds = new Set<string>();
      userTeams.forEach((t) => {
        const ids = Array.isArray(t.funnel_ids) ? t.funnel_ids : [];
        ids.forEach((id: string) => funnelIds.add(id));
      });

      return { accessAll: false as const, funnelIds: Array.from(funnelIds) };
    },
    enabled: !!orgId && !!user?.id,
  });
}
