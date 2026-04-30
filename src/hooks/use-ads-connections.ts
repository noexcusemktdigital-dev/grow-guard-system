// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

// -----------------------------------------------------------------------
// Types — alinhadas com ads_connections (migration 20260409100000)
// -----------------------------------------------------------------------
export interface AdsConnection {
  id: string;
  org_id: string;
  provider: string;
  ad_account_id: string;
  ad_account_name: string | null;
  access_token: string | null;
  token_expires_at: string | null;
  business_id: string | null;
  page_id: string | null;
  page_name: string | null;
  status: "active" | "expired" | "revoked";  // sem is_active, sem disconnected_at
  connected_by: string | null;
  connected_at: string;
  last_synced_at: string | null;
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

  // Desconectar — marca status como 'revoked' (sem coluna disconnected_at)
  const disconnect = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("ads_connections")
        .update({ status: "revoked" })
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
        .select("id, ad_account_name, token_expires_at")
        .eq("org_id", orgId)
        .eq("status", "active")          // usa coluna 'status', não 'is_active'
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
        accountName: data.ad_account_name ?? null,
        isExpired,
      };
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  });
}

// -----------------------------------------------------------------------
// useInitiateMetaOAuth — inicia fluxo OAuth da Meta
//
// WORKAROUND: ads-oauth-start não está deployed no Lovable.
// Usa PostgreSQL RPC start_meta_ads_oauth (SECURITY DEFINER) para gerar
// o state seguro + ads-get-config (deployada) para obter META_APP_ID.
// -----------------------------------------------------------------------
export function useInitiateMetaOAuth() {
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (): Promise<string> => {
      // 1. Gerar state via RPC (armazena em ads_oauth_states com TTL 10min)
      const { data: rpcData, error: rpcErr } = await supabase.rpc("start_meta_ads_oauth", {
        p_org_id: orgId ?? null,
      });
      if (rpcErr) throw rpcErr;
      const state: string = (rpcData as any)?.state;
      if (!state) throw new Error("Falha ao gerar state OAuth");

      // 2. Obter META_APP_ID + redirect_uri via ads-get-config (deployada)
      const { data: configData, error: configErr } = await supabase.functions.invoke("ads-get-config");
      if (configErr) throw configErr;
      const appId: string = (configData as any)?.meta?.app_id ?? (configData as any)?.app_id;
      const redirectUri: string =
        (configData as any)?.meta?.redirect_uri ??
        (configData as any)?.redirect_uri ??
        `${window.location.origin}/auth/ads/callback`;

      if (!appId) throw new Error("META_APP_ID não configurado. Contate o suporte.");

      // 3. Construir URL do diálogo OAuth da Meta
      const params = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        scope: "ads_read,leads_retrieval,pages_show_list,pages_read_engagement,pages_manage_ads,pages_manage_metadata",
        state,
        response_type: "code",
      });

      return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
    },
  });
}
