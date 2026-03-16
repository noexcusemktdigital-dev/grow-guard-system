import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

export function useCrmSettings() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["crm-settings", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_settings")
        .select("*")
        .eq("organization_id", orgId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useCrmSettingsMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const upsertSettings = useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      const { data: existing } = await supabase
        .from("crm_settings")
        .select("id")
        .eq("organization_id", orgId!)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("crm_settings")
          .update(settings)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("crm_settings")
          .insert({ ...settings, organization_id: orgId! })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-settings"] }),
  });

  return { upsertSettings };
}
