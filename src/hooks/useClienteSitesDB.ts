import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    mutationFn: async ({ name, type, html }: { name: string; type: string; html: string }) => {
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
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-sites"] });
    },
  });
}

export function useApproveSite() {
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (siteId: string) => {
      if (!orgId) throw new Error("No org");

      // Debit credits on approval
      const { error: debitError } = await supabase.rpc("debit_credits" as any, {
        _org_id: orgId,
        _amount: 500,
        _description: "Site aprovado",
        _source: "generate-site",
      });
      if (debitError) throw debitError;

      // Update status
      const { error } = await supabase
        .from("client_sites")
        .update({ status: "Aprovado" } as any)
        .eq("id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-sites"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
    },
  });
}
