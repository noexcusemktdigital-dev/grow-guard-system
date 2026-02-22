import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export function useCrmTasks(leadId?: string) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["crm-tasks", orgId, leadId],
    queryFn: async () => {
      let q = supabase.from("crm_tasks").select("*").eq("organization_id", orgId!).order("due_date");
      if (leadId) q = q.eq("lead_id", leadId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useCrmTaskMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createTask = useMutation({
    mutationFn: async (task: { lead_id?: string; title: string; description?: string; due_date?: string; priority?: string; assigned_to?: string }) => {
      const { data, error } = await supabase.from("crm_tasks").insert({ ...task, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-tasks"] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("crm_tasks").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-tasks"] }),
  });

  return { createTask, updateTask, deleteTask };
}
