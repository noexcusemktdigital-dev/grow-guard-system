import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import type { TablesInsert } from "@/integrations/supabase/typed";

export function useClienteCampaignsDB() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["client-campaigns-db", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_campaigns")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });
}

export function useCreateClientCampaign() {
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, type, content }: { name: string; type?: string; content: Record<string, unknown> }) => {
      if (!orgId) throw new Error("No org");
      const payload: TablesInsert<"client_campaigns"> = {
        organization_id: orgId,
        name,
        type: type || "content",
        status: "active",
        content: content as TablesInsert<"client_campaigns">["content"],
        created_by: user?.id,
      };
      const { data, error } = await supabase
        .from("client_campaigns")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-campaigns-db"] });
    },
  });
}

export function useUpdateClientCampaign() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from("client_campaigns")
        .update({ content: content as TablesInsert<"client_campaigns">["content"] })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-campaigns-db"] });
    },
  });
}
