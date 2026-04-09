// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

const ACTIVITY_LIMIT = 50;

export function useCrmActivities(leadId: string | undefined, limit = ACTIVITY_LIMIT) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["crm-activities", leadId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("lead_id", leadId!)
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    enabled: !!leadId && !!orgId,
  });
}

export function useCrmActivityMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createActivity = useMutation({
    mutationFn: async (activity: { lead_id: string; type?: string; title: string; description?: string }) => {
      const { data, error } = await supabase
        .from("crm_activities")
        .insert({ ...activity, organization_id: orgId!, user_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-activities"] }),
  });

  return { createActivity };
}
