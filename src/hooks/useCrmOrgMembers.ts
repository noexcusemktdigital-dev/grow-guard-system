import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import type { Tables } from "@/integrations/supabase/typed";

type OrgMembershipRow = Tables<"organization_memberships"> & {
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

export interface CrmOrgMember {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

/**
 * Lista de membros da organização para uso em campos de "Responsável" no CRM.
 */
export function useCrmOrgMembers() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["org-members-crm", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_memberships")
        .select("user_id, profiles(full_name, avatar_url)")
        .eq("organization_id", orgId!)
        .in("role", ["cliente_admin", "cliente_user"])
        .is("deleted_at", null); // LGPD-002: exclui membros soft-deleted
      if (error) throw error;
      return (data as OrgMembershipRow[] ?? []).map((m) => ({
        user_id: m.user_id,
        full_name: m.profiles?.full_name || "Usuário",
        avatar_url: m.profiles?.avatar_url ?? null,
      })) as CrmOrgMember[];
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Mapa de user_id → { name, avatar } para renderização rápida em listas/kanban.
 */
export function useCrmOrgMembersMap() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["org-members-map", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_memberships")
        .select("user_id, profiles(full_name, avatar_url)")
        .eq("organization_id", orgId!)
        .is("deleted_at", null); // LGPD-002: exclui membros soft-deleted
      if (error) throw error;
      const map: Record<string, { name: string; avatar?: string | null }> = {};
      (data as OrgMembershipRow[] ?? []).forEach((m) => {
        map[m.user_id] = {
          name: m.profiles?.full_name || "Usuário",
          avatar: m.profiles?.avatar_url ?? null,
        };
      });
      return map;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}
