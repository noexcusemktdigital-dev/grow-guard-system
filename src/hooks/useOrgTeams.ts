import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

export interface OrgTeam {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
  created_at: string;
}

export function useOrgTeams() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["org-teams", orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // Seed default teams if none exist
      const { count } = await supabase
        .from("org_teams")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId);

      if (count === 0) {
        await supabase.rpc("seed_default_teams", { _org_id: orgId });
      }

      const { data, error } = await supabase
        .from("org_teams")
        .select("*")
        .eq("organization_id", orgId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as OrgTeam[];
    },
    enabled: !!orgId,
  });
}

export function useTeamMemberships() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["team-memberships", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: teams } = await supabase
        .from("org_teams")
        .select("id")
        .eq("organization_id", orgId);
      if (!teams?.length) return [];

      const teamIds = teams.map((t) => t.id);
      const { data, error } = await supabase
        .from("org_team_memberships")
        .select("*")
        .in("team_id", teamIds);
      if (error) throw error;
      return (data ?? []) as TeamMembership[];
    },
    enabled: !!orgId,
  });
}

export function useTeamMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const setUserTeams = useMutation({
    mutationFn: async ({ userId, teamIds }: { userId: string; teamIds: string[] }) => {
      // Get current teams for this user within the org
      const { data: teams } = await supabase
        .from("org_teams")
        .select("id")
        .eq("organization_id", orgId!);
      const orgTeamIds = (teams ?? []).map((t) => t.id);

      // Remove all existing memberships for this user in org teams
      if (orgTeamIds.length > 0) {
        await supabase
          .from("org_team_memberships")
          .delete()
          .eq("user_id", userId)
          .in("team_id", orgTeamIds);
      }

      // Insert new ones
      if (teamIds.length > 0) {
        const rows = teamIds.map((tid) => ({ team_id: tid, user_id: userId }));
        const { error } = await supabase.from("org_team_memberships").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-memberships"] });
      qc.invalidateQueries({ queryKey: ["org-members"] });
    },
  });

  return { setUserTeams };
}
