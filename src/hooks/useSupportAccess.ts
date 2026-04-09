// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { toast } from "sonner";

export function useSupportTokens() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["support-access-tokens", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("support_access_tokens")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });
}

export function useSupportLogs(tokenId?: string) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["support-access-logs", orgId, tokenId],
    queryFn: async () => {
      if (!orgId) return [];
      let query = supabase
        .from("support_access_logs")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (tokenId) query = query.eq("token_id", tokenId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });
}

export function useGenerateSupportToken() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (params: { duration_minutes: number; access_level: string; ticket_id?: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-support-access", {
        body: { ...params, organization_id: orgId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-access-tokens"] });
      toast.success("Token de acesso gerado com sucesso");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao gerar token");
    },
  });
}

export function useRevokeSupportToken() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (tokenId: string) => {
      const { data, error } = await supabase.functions.invoke("revoke-support-access", {
        body: { token_id: tokenId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-access-tokens"] });
      toast.success("Acesso revogado com sucesso");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao revogar acesso");
    },
  });
}
