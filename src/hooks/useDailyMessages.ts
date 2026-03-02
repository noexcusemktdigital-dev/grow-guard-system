import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";

export function useDailyMessages() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["daily-messages", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_daily_message_with_parent", {
        _org_id: orgId!,
      });
      if (error) throw error;
      return (data as any[])?.[0] ?? null;
    },
    enabled: !!orgId,
  });
}

export function useAllDailyMessages() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["daily-messages-all", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_messages")
        .select("*")
        .eq("organization_id", orgId!)
        .order("date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useDailyMessageMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createMessage = useMutation({
    mutationFn: async (msg: { message: string; author?: string; date?: string }) => {
      const { data, error } = await supabase.from("daily_messages").insert({ ...msg, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-messages"] });
      qc.invalidateQueries({ queryKey: ["daily-messages-all"] });
    },
  });

  const archiveMessage = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("daily_messages").delete().eq("id", id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-messages"] });
      qc.invalidateQueries({ queryKey: ["daily-messages-all"] });
    },
  });

  return { createMessage, archiveMessage };
}
