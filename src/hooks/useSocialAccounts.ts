import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { invokeEdge } from "@/lib/edge";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";

export interface SocialAccount {
  id: string;
  organization_id: string;
  platform: "instagram" | "facebook" | "linkedin" | "google_ads" | "tiktok";
  account_id: string | null;
  account_name: string | null;
  account_username: string | null;
  status: "active" | "expired" | "disconnected" | "pending";
  metadata: Record<string, unknown> | null;
  last_synced_at: string | null;
  token_expires_at: string | null;
  created_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export function useSocialAccounts() {
  const { data: orgId } = useUserOrgId();

  return useQuery<SocialAccount[]>({
    queryKey: ["social_accounts", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("organization_id", orgId!)
        .order("platform", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SocialAccount[];
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function useConnectSocialAccount() {
  const { data: orgId } = useUserOrgId();

  return (platform: SocialAccount["platform"]) => {
    if (!orgId) {
      toast.error("Organização não identificada. Tente novamente.");
      return;
    }

    if ((platform as string) === "meta" || platform === "instagram" || platform === "facebook") {
      window.location.href = `${SUPABASE_URL}/functions/v1/social-oauth-meta?org_id=${orgId}`;
    } else if (platform === "linkedin") {
      window.location.href = `${SUPABASE_URL}/functions/v1/social-oauth-linkedin?org_id=${orgId}`;
    } else {
      toast.error("Integração não disponível para esta plataforma.");
    }
  };
}

export function useDisconnectSocialAccount() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from("social_accounts")
        .update({ status: "disconnected" })
        .eq("id", accountId)
        .eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social_accounts", orgId] });
      toast.success("Conta desconectada com sucesso.");
    },
    onError: (err: unknown) => {
      reportError(err, { title: 'Erro ao desconectar conta', category: 'social.disconnect' });
    },
  });
}

export interface PublishPostPayload {
  social_post_id: string;
  org_id: string;
  account_id?: string;
}

export function usePublishPost() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  return useMutation({
    mutationFn: async (payload: PublishPostPayload) => {
      const { data, error, requestId } = await invokeEdge("social-publish", {
        body: payload,
      });
      if (error) throw error;
      return data as Record<string, unknown>;
    },
    onSuccess: () => {
      if (orgId) {
        qc.invalidateQueries({ queryKey: ["social_posts", orgId] });
        qc.invalidateQueries({ queryKey: ["social_accounts", orgId] });
      }
    },
    onError: (err: unknown) => {
      const requestId = (err instanceof Object && "requestId" in err) ? String((err as Record<string, unknown>).requestId) : undefined;
      const suffix = requestId ? ` (id: ${requestId.slice(0, 8)})` : "";
      toast.error(
        (err instanceof Error ? err.message : "Erro ao publicar post.") + suffix,
      );
    },
  });
}
