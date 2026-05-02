import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/typed";

export interface CrmTeam {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  members: string[];
  funnel_ids: string[];
  created_at: string;
  updated_at: string;
}

export function useCrmTeams() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["crm-teams", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_teams")
        .select("*")
        .eq("organization_id", orgId!)
        .order("name");
      if (error) throw error;
      return (data || []).map((t: Record<string, unknown>) => ({
        ...t,
        members: Array.isArray(t.members) ? t.members : [],
        funnel_ids: Array.isArray(t.funnel_ids) ? t.funnel_ids : [],
      })) as CrmTeam[];
    },
    enabled: !!orgId,
  });
}

export function useCrmTeamMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createTeam = useMutation({
    mutationFn: async (team: { name: string; description?: string; members?: string[]; funnel_ids?: string[] }) => {
      const payload: TablesInsert<"crm_teams"> = { ...team, organization_id: orgId ?? "" };
      const { data, error } = await supabase
        .from("crm_teams")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-teams"] }),
  });

  const updateTeam = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TablesUpdate<"crm_teams">) => {
      const { data, error } = await supabase
        .from("crm_teams")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-teams"] }),
  });

  const deleteTeam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-teams"] }),
  });

  return { createTeam, updateTeam, deleteTeam };
}
