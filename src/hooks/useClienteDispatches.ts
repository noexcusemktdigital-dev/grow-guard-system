import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { useUserOrgId } from "./useUserOrgId";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/typed";

export type ClientDispatch = Tables<"client_dispatches">;

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
      return data as ClientDispatch[];
    },
    enabled: !!orgId,
  });
}

export function useClienteDispatchMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createDispatch = useMutation({
    mutationFn: async (dispatch: {
      title: string;
      channel?: string;
      message?: string;
      scheduled_at?: string;
      recipients?: string[];
      image_url?: string;
      delay_seconds?: number;
      source_type?: string;
    }) => {
      const payload: TablesInsert<"client_dispatches"> = {
        ...dispatch,
        organization_id: orgId!,
        recipients: (dispatch.recipients || []) as TablesInsert<"client_dispatches">["recipients"],
      };
      const { data, error } = await supabase
        .from("client_dispatches")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-dispatches"] }),
  });

  const updateDispatch = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TablesUpdate<"client_dispatches">) => {
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

  const triggerBulkSend = useMutation({
    mutationFn: async (dispatchId: string) => {
      const { data, error } = await invokeEdge("whatsapp-bulk-send", {
        body: { dispatch_id: dispatchId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-dispatches"] }),
  });

  return { createDispatch, updateDispatch, deleteDispatch, triggerBulkSend };
}
