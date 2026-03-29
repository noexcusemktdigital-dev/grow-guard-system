// @ts-nocheck
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
}

export function useOrgMembers() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["org-members", orgId],
    queryFn: async () => {
      // Use the SECURITY DEFINER RPC that joins with auth.users for emails
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
      }));
    },
    enabled: !!orgId,
  });
}
