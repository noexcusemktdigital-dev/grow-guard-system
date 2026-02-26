import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useUserProfile() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
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
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile", user?.id] });
      toast.success("Perfil salvo com sucesso!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { ...query, update };
}
