import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { toast } from "sonner";

export function useOrgProfile() {
  const { data: orgId } = useUserOrgId();

  const query = useQuery({
    queryKey: ["org-profile", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const qc = useQueryClient();

  const update = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!orgId) throw new Error("Organização não encontrada. Tente novamente.");
      const { error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-profile", orgId] });
      toast.success("Dados da organização salvos!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { ...query, update };
}
