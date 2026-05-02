// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
    staleTime: 1000 * 60 * 2,
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
      if (!orgId || !user) throw new Error("Missing orgId or user");
      const { data, error } = await supabase
        .from("client_tasks")
        .insert({
          ...task,
          organization_id: orgId,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-tasks"] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase
        .from("client_tasks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("organization_id", orgId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-tasks"] }),
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      if (!user) throw new Error("Missing user");
      const updates = done
        ? { status: "done", completed_at: new Date().toISOString(), completed_by: user.id }
        : { status: "pending", completed_at: null, completed_by: null };
      const { error } = await supabase.from("client_tasks").update(updates).eq("id", id).eq("organization_id", orgId!);
      if (error) throw error;

      // Award +10 XP when completing a task
      if (done && user && orgId) {
        const { data: gamData } = await supabase
          .from("client_gamification")
          .select("*")
          .eq("user_id", user.id)
          .eq("organization_id", orgId)
          .maybeSingle();

        if (gamData) {
          const currentXp = (gamData.xp as number) || 0;
          const newXp = currentXp + 10;
          let title = "Novato";
          if (newXp >= 12000) title = "Lenda";
          else if (newXp >= 7000) title = "Mestre";
          else if (newXp >= 3500) title = "Especialista";
          else if (newXp >= 1500) title = "Profissional";
          else if (newXp >= 500) title = "Aprendiz";

          await supabase
            .from("client_gamification")
            .update({ xp: newXp, title, points: (gamData.points || 0) + 10, last_activity_at: new Date().toISOString() })
            .eq("id", gamData.id);

          return { xpAwarded: true };
        }
      }
      return { xpAwarded: false };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["client-tasks"] });
      if (result?.xpAwarded) {
        qc.invalidateQueries({ queryKey: ["client-gamification"] });
      }
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_tasks").delete().eq("id", id).eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-tasks"] }),
  });

  return { createTask, updateTask, toggleTask, deleteTask };
}
