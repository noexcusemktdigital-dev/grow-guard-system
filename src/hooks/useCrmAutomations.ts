import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import type { TablesInsert } from "@/integrations/supabase/typed";

export function useCrmAutomations() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["crm-automations", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_automations")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useCrmAutomationMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createAutomation = useMutation({
    mutationFn: async (automation: {
      name: string;
      trigger_type: string;
      trigger_config?: Record<string, unknown>;
      action_type: string;
      action_config?: Record<string, unknown>;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("crm_automations")
        .insert({ ...automation, organization_id: orgId! } satisfies TablesInsert<"crm_automations">)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-automations"] }),
  });

  const updateAutomation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase
        .from("crm_automations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-automations"] }),
  });

  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-automations"] }),
  });

  return { createAutomation, updateAutomation, deleteAutomation };
}
