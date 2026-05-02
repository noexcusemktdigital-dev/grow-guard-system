import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/typed";

export type ClientSiteDB = Tables<"client_sites">;

export function useClienteSitesDB() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["client-sites", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_sites")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ClientSiteDB[];
    },
    enabled: !!orgId,
  });
}

export function useCreateClientSite() {
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, type, html, strategy_id }: { name: string; type: string; html: string; strategy_id?: string }) => {
      if (!orgId) throw new Error("No org");
      const payload: TablesInsert<"client_sites"> = {
        organization_id: orgId,
        name,
        type,
        status: "Rascunho",
        content: { html } as TablesInsert<"client_sites">["content"],
        created_by: user?.id,
        strategy_id: strategy_id || null,
      };
      const { data, error } = await supabase
        .from("client_sites")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-sites"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
    },
  });
}

export function useApproveSite() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (siteId: string) => {
      const patch: TablesUpdate<"client_sites"> = { status: "Aprovado" };
      const { error } = await supabase
        .from("client_sites")
        .update(patch)
        .eq("id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-sites"] });
      qc.invalidateQueries({ queryKey: ["approval-stats"] });
    },
  });
}

export function useUpdateSiteUrl() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ siteId, url }: { siteId: string; url: string }) => {
      const patch: TablesUpdate<"client_sites"> = { url, status: "Publicado", published_at: new Date().toISOString() };
      const { error } = await supabase
        .from("client_sites")
        .update(patch)
        .eq("id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-sites"] });
    },
  });
}
