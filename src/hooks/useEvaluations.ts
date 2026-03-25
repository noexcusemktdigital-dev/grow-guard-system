import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export interface Evaluation {
  id: string;
  organization_id: string;
  evaluator_id: string;
  user_id: string;
  period: string;
  score: number;
  categories: Record<string, number>;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export function useEvaluations(userId?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["evaluations", orgId, userId],
    queryFn: async () => {
      let q = supabase
        .from("user_evaluations")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Evaluation[];
    },
    enabled: !!orgId,
  });
}

export function useMyEvaluations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-evaluations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_evaluations")
        .select("*")
        .eq("user_id", user?.id ?? "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Evaluation[];
    },
    enabled: !!user,
  });
}

export function useEvaluationMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createEvaluation = useMutation({
    mutationFn: async (input: {
      user_id: string;
      period: string;
      score: number;
      categories: Record<string, number>;
      comment?: string;
    }) => {
      if (!orgId || !user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("user_evaluations")
        .insert({
          ...input,
          organization_id: orgId,
          evaluator_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evaluations"] });
      qc.invalidateQueries({ queryKey: ["my-evaluations"] });
    },
  });

  const deleteEvaluation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_evaluations")
        .delete()
        .eq("id", id)
        .eq("evaluator_id", user?.id ?? "");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evaluations"] });
      qc.invalidateQueries({ queryKey: ["my-evaluations"] });
    },
  });

  return { createEvaluation, deleteEvaluation };
}
