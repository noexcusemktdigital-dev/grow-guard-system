import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export interface ClientTask {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  source: string;
  status: string;
  created_by: string | null;
  assigned_to: string | null;
  assigned_team: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useClienteTasks(filters?: { status?: string; assigned_to?: string }) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["client-tasks", orgId, filters],
    queryFn: async () => {
      let query = supabase
        .from("client_tasks")
        .select("*")
        .eq("organization_id", orgId!)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.assigned_to) query = query.eq("assigned_to", filters.assigned_to);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ClientTask[];
    },
    enabled: !!orgId,
  });
}

export function useClienteTaskMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createTask = useMutation({
    mutationFn: async (task: {
      title: string;
      description?: string;
      due_date?: string;
      priority?: string;
      source?: string;
      assigned_to?: string;
      assigned_team?: string;
    }) => {
      const { data, error } = await supabase
        .from("client_tasks")
        .insert({
          ...task,
          organization_id: orgId!,
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-tasks"] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from("client_tasks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-tasks"] }),
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const updates = done
        ? { status: "done", completed_at: new Date().toISOString(), completed_by: user!.id }
        : { status: "pending", completed_at: null, completed_by: null };
      const { error } = await supabase.from("client_tasks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-tasks"] }),
  });

  return { createTask, updateTask, toggleTask, deleteTask };
}
