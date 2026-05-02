import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

export interface OrgMember {
  user_id: string;
  role: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  job_title: string | null;
  created_at: string;
  status?: "active" | "pending";
}

export interface PendingInvitation {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  team_ids: string[];
  created_at: string;
  expires_at: string;
}

export function useOrgMembers() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["org-members", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_org_members_with_email", {
        _org_id: orgId!,
      });
      if (error) throw error;

      return (data ?? []).map((m: Record<string, unknown>): OrgMember => ({
        user_id: m.user_id,
        role: m.role ?? "cliente_user",
        full_name: m.full_name ?? null,
        email: m.email ?? "",
        avatar_url: m.avatar_url ?? null,
        job_title: m.job_title ?? null,
        created_at: m.created_at,
        status: "active",
      }));
    },
    enabled: !!orgId,
  });
}

export function usePendingInvitations() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["pending-invitations", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_invitations")
        .select("*")
        .eq("organization_id", orgId!)
        .is("accepted_at", null)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((inv: Record<string, unknown>): PendingInvitation => ({
        id: inv.id as string,
        email: inv.email as string,
        full_name: (inv.full_name as string) ?? null,
        role: (inv.role as string) ?? "cliente_user",
        team_ids: (inv.team_ids as string[]) ?? [],
        created_at: inv.created_at as string,
        expires_at: inv.expires_at as string,
      }));
    },
    enabled: !!orgId,
  });
}
