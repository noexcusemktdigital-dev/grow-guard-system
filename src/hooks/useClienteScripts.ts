// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

export function useClienteScripts() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["client-scripts", orgId],
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_scripts")
        .select("*")
        .eq("organization_id", orgId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useClienteScriptMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createScript = useMutation({
    mutationFn: async (script: { title: string; content?: string; category?: string; tags?: string[] }) => {
      const { data, error } = await supabase
        .from("client_scripts")
        .insert({ ...script, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-scripts"] }),
  });

  const updateScript = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("client_scripts").update(updates).eq("id", id).eq("organization_id", orgId!).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-scripts"] }),
  });

  const deleteScript = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_scripts").delete().eq("id", id).eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-scripts"] }),
  });

  return { createScript, updateScript, deleteScript };
}
