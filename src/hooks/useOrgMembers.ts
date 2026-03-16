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
      // Get memberships
      const { data: memberships, error: mErr } = await supabase
        .from("organization_memberships")
        .select("user_id, created_at")
        .eq("organization_id", orgId!);
      if (mErr) throw mErr;
      if (!memberships || memberships.length === 0) return [];

      const userIds = memberships.map((m) => m.user_id);

      // Get profiles
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, phone, job_title")
        .in("id", userIds);
      if (pErr) throw pErr;

      // Get roles
      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      if (rErr) throw rErr;

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));

      return memberships.map((m): OrgMember => {
        const prof = profileMap.get(m.user_id);
        return {
          user_id: m.user_id,
          role: roleMap.get(m.user_id) ?? "cliente_user",
          full_name: prof?.full_name ?? null,
          email: "", // email comes from auth, not accessible here
          avatar_url: prof?.avatar_url ?? null,
          job_title: prof?.job_title ?? null,
          created_at: m.created_at,
        };
      });
    },
    enabled: !!orgId,
  });
}
