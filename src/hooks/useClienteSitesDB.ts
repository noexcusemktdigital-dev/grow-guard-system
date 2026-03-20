import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export interface ClientSiteDB {
  id: string;
  organization_id: string;
  name: string;
  type: string | null;
  status: string;
  content: { html: string } | null;
  url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  strategy_id: string | null;
}

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
      return data as unknown as ClientSiteDB[];
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
      const { data, error } = await supabase
        .from("client_sites")
        .insert({
          organization_id: orgId,
          name,
          type,
          status: "Rascunho",
          content: { html } as any,
          created_by: user?.id,
          strategy_id: strategy_id || null,
        } as any)
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
      const { error } = await supabase
        .from("client_sites")
        .update({ status: "Aprovado" } as any)
        .eq("id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-sites"] });
    },
  });
}

export function useUpdateSiteUrl() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ siteId, url }: { siteId: string; url: string }) => {
      const { error } = await supabase
        .from("client_sites")
        .update({ url, status: "Publicado", published_at: new Date().toISOString() } as any)
        .eq("id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-sites"] });
    },
  });
}
