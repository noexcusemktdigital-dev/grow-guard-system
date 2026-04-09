import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { DEFAULT_STAGES } from "@/components/crm/CrmStageSystem";

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
    mutationFn: async (funnel: { name: string; description?: string; stages?: Record<string, unknown>[]; is_default?: boolean }) => {
      if (funnel.is_default && orgId) {
        await supabase
          .from("crm_funnels")
          .update({ is_default: false })
          .eq("organization_id", orgId);
      }
      const { data, error } = await supabase
        .from("crm_funnels")
        .insert({ ...funnel, organization_id: orgId!, stages: funnel.stages || [] } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-funnels"] }),
  });

  const updateFunnel = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      if (updates.is_default === true && orgId) {
        await supabase
          .from("crm_funnels")
          .update({ is_default: false })
          .eq("organization_id", orgId)
          .neq("id", id);
      }
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

export function useEnsureDefaultFunnel() {
  const { data: funnels, isLoading } = useCrmFunnels();
  const { createFunnel } = useCrmFunnelMutations();
  const created = useRef(false);

  useEffect(() => {
    if (isLoading || created.current) return;
    if (funnels && funnels.length === 0) {
      created.current = true;
      createFunnel.mutate({
        name: "Funil de Vendas",
        description: "Funil padrão do CRM",
        stages: DEFAULT_STAGES as any[],
        is_default: true,
      });
    }
  }, [funnels, isLoading]);
}
