// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------
export interface AdsConnection {
  id: string;
  org_id: string;
  provider: string;
  account_id: string;
  account_name: string | null;
  access_token: string | null;
  token_expires_at: string | null;
  connected_at: string;
  disconnected_at: string | null;
  is_active: boolean;
  created_at: string;
}

// -----------------------------------------------------------------------
// useAdsConnections — lista e gerencia conexões OAuth de ads da org
// -----------------------------------------------------------------------
export function useAdsConnections() {
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();

  const { data: connections, isLoading, isError, error } = useQuery<AdsConnection[]>({
    queryKey: ["ads-connections", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("ads_connections")
        .select("*")
        .eq("org_id", orgId)
        .order("connected_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdsConnection[];
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  });

  const disconnect = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("ads_connections")
        .update({ is_active: false, disconnected_at: new Date().toISOString() })
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ads-connections"] });
      qc.invalidateQueries({ queryKey: ["ads-connection-status"] });
      qc.invalidateQueries({ queryKey: ["meta-ads-insights"] });
    },
  });

  return {
    connections: connections ?? [],
    isLoading,
    isError,
    error,
    disconnect,
  };
}

// -----------------------------------------------------------------------
// useAdsConnectionStatus — status rápido para badge no sidebar
// -----------------------------------------------------------------------
export function useAdsConnectionStatus() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["ads-connection-status", orgId],
    queryFn: async () => {
      if (!orgId) return { hasActiveConnection: false, expiresAt: null, accountName: null };

      const { data, error } = await supabase
        .from("ads_connections")
        .select("id, account_name, token_expires_at")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("connected_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return { hasActiveConnection: false, expiresAt: null, accountName: null };

      // Verificar se o token ainda não expirou
      const expiresAt = data.token_expires_at ? new Date(data.token_expires_at) : null;
      const isExpired = expiresAt ? expiresAt < new Date() : false;

      return {
        hasActiveConnection: !isExpired,
        expiresAt: data.token_expires_at,
        accountName: data.account_name,
        isExpired,
      };
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  });
}
