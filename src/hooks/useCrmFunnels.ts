import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export function useCrmFunnels() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["crm-funnels", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_funnels")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useCrmFunnelMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createFunnel = useMutation({
    mutationFn: async (funnel: { name: string; description?: string; stages?: any[]; is_default?: boolean }) => {
      const { data, error } = await supabase
        .from("crm_funnels")
        .insert({ ...funnel, organization_id: orgId!, stages: funnel.stages || [] })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-funnels"] }),
  });

  const updateFunnel = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("crm_funnels").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-funnels"] }),
  });

  const deleteFunnel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_funnels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-funnels"] }),
  });

  return { createFunnel, updateFunnel, deleteFunnel };
}
