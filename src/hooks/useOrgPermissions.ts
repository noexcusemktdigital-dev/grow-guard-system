import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrgId } from "./useUserOrgId";
import type { Tables, TablesInsert } from "@/integrations/supabase/typed";

type OrgPermissionRow = Tables<"org_user_permissions">;
type OrgPermissionUpsert = TablesInsert<"org_user_permissions">;

export const PERMISSIONS = [
  { key: "crm.view", label: "Ver CRM", group: "CRM" },
  { key: "crm.create_lead", label: "Criar leads", group: "CRM" },
  { key: "crm.edit_lead", label: "Editar leads", group: "CRM" },
  { key: "crm.delete_lead", label: "Excluir leads", group: "CRM" },
  { key: "crm.mark_won", label: "Marcar como ganho", group: "CRM" },
  { key: "crm.mark_lost", label: "Marcar como perdido", group: "CRM" },
  { key: "crm.import", label: "Importar leads de planilha", group: "CRM" },
  { key: "crm.export", label: "Exportar leads", group: "CRM" },
  { key: "financeiro.view", label: "Ver Financeiro", group: "Financeiro" },
  { key: "financeiro.edit", label: "Editar Financeiro", group: "Financeiro" },
  { key: "postagem.view", label: "Ver Postagem", group: "Conteúdo" },
  { key: "postagem.generate", label: "Gerar artes", group: "Conteúdo" },
  { key: "trafego.view", label: "Ver Tráfego Pago", group: "Marketing" },
  { key: "trafego.generate_strategy", label: "Gerar estratégia", group: "Marketing" },
  { key: "configuracoes.view", label: "Ver Configurações", group: "Sistema" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const PERMISSION_GROUPS = Array.from(
  new Set(PERMISSIONS.map((p) => p.group))
);

/**
 * Hook to check the current user's permissions in their org.
 * Admins always pass `can()` checks.
 */
export function useOrgPermissions() {
  const { user, role } = useAuth();
  const { data: orgId } = useUserOrgId();

  const isAdmin =
    role === "cliente_admin" || role === "admin" || role === "super_admin";

  const query = useQuery({
    queryKey: ["org-user-permissions-self", user?.id, orgId],
    queryFn: async (): Promise<Set<string>> => {
      if (!user?.id || !orgId) return new Set();
      const { data, error } = await supabase
        .from("org_user_permissions")
        .select("permission, granted")
        .eq("user_id", user.id)
        .eq("organization_id", orgId);
      if (error) {
        console.warn("useOrgPermissions:", error.message);
        return new Set();
      }
      return new Set(
        (data as Pick<OrgPermissionRow, "permission" | "granted">[] ?? [])
          .filter((r) => r.granted)
          .map((r) => r.permission)
      );
    },
    enabled: !!user?.id && !!orgId && !isAdmin,
    staleTime: 1000 * 60,
  });

  const can = (perm: PermissionKey | string): boolean => {
    if (isAdmin) return true;
    return query.data?.has(perm) ?? false;
  };

  return {
    can,
    isAdmin,
    isLoading: query.isLoading,
    permissions: query.data ?? new Set<string>(),
  };
}

/**
 * Hook for admins to list and manage permissions of all org members.
 */
export function useOrgPermissionsAdmin() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const members = useQuery({
    queryKey: ["org-members-with-perms", orgId],
    queryFn: async () => {
      if (!orgId) return { users: [], permsByUser: {} as Record<string, Set<string>> };

      const { data: usersData, error: e1 } = await supabase.rpc(
        "get_org_members_with_email" as any,
        { _org_id: orgId }
      );
      if (e1) throw e1;

      const { data: permsData, error: e2 } = await supabase
        .from("org_user_permissions")
        .select("user_id, permission, granted")
        .eq("organization_id", orgId);
      if (e2) throw e2;

      const permsByUser: Record<string, Set<string>> = {};
      for (const row of (permsData as Pick<OrgPermissionRow, "user_id" | "permission" | "granted">[] ?? [])) {
        if (!permsByUser[row.user_id]) permsByUser[row.user_id] = new Set();
        if (row.granted) permsByUser[row.user_id].add(row.permission);
      }

      return { users: (usersData ?? []) as Record<string, unknown>[], permsByUser };
    },
    enabled: !!orgId,
  });

  const togglePermission = useMutation({
    mutationFn: async ({
      userId,
      permission,
      granted,
    }: {
      userId: string;
      permission: string;
      granted: boolean;
    }) => {
      if (!orgId) throw new Error("Org não encontrada");
      const { error } = await supabase
        .from("org_user_permissions")
        .upsert(
          {
            organization_id: orgId,
            user_id: userId,
            permission,
            granted,
            granted_by: user?.id ?? null,
          } satisfies OrgPermissionUpsert,
          { onConflict: "organization_id,user_id,permission" }
        );
      if (error) throw error;
    },
    onMutate: async ({ userId, permission, granted }) => {
      await qc.cancelQueries({ queryKey: ["org-members-with-perms", orgId] });
      const prev = qc.getQueryData<{ users: Record<string, unknown>[]; permsByUser: Record<string, Set<string>> }>(["org-members-with-perms", orgId]);
      if (prev) {
        const next = {
          ...prev,
          permsByUser: { ...prev.permsByUser },
        };
        const set = new Set(next.permsByUser[userId] ?? []);
        if (granted) set.add(permission);
        else set.delete(permission);
        next.permsByUser[userId] = set;
        qc.setQueryData(["org-members-with-perms", orgId], next);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["org-members-with-perms", orgId], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["org-members-with-perms", orgId] });
      qc.invalidateQueries({ queryKey: ["org-user-permissions-self"] });
    },
  });

  return { members, togglePermission };
}
