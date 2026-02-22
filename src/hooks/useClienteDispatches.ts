import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export function useClienteDispatches() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["client-dispatches", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_dispatches")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useClienteDispatchMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createDispatch = useMutation({
    mutationFn: async (dispatch: { title: string; channel?: string; message?: string; scheduled_at?: string }) => {
      const { data, error } = await supabase
        .from("client_dispatches")
        .insert({ ...dispatch, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-dispatches"] }),
  });

  const updateDispatch = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("client_dispatches").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-dispatches"] }),
  });

  const deleteDispatch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_dispatches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-dispatches"] }),
  });

  return { createDispatch, updateDispatch, deleteDispatch };
}
