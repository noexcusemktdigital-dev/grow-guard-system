// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";

export function useUserProfile() {
  const { user, refreshProfile } = useAuth();

  const query = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id ?? "")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const qc = useQueryClient();

  const update = useMutation({
    mutationFn: async (updates: { full_name?: string; phone?: string; job_title?: string; avatar_url?: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user?.id ?? "");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile", user?.id] });
      refreshProfile();
      toast.success("Perfil salvo com sucesso!");
    },
    onError: (err: unknown) => {
      reportError(err, { title: 'Erro ao salvar perfil', category: 'user_profile.update' });
    },
  });

  return { ...query, update };
}
