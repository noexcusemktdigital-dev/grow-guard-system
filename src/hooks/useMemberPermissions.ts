// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrgId } from "./useUserOrgId";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface MemberPermissions {
  crm_visibility: "all" | "team" | "own";
  can_generate_content: boolean;
  can_generate_posts: boolean;
  can_generate_scripts: boolean;
  can_use_whatsapp: boolean;
  can_manage_crm: boolean;
}

export interface PermissionProfile {
  id: string;
  organization_id: string;
  name: string;
  crm_visibility: "all" | "team" | "own";
  can_generate_content: boolean;
  can_generate_posts: boolean;
  can_generate_scripts: boolean;
  can_use_whatsapp: boolean;
  can_manage_crm: boolean;
  created_at: string;
}

// Padrão seguro para cliente_user sem permissões definidas
const DEFAULT_USER_PERMISSIONS: MemberPermissions = {
  crm_visibility: "own",
  can_generate_content: false,
  can_generate_posts: false,
  can_generate_scripts: false,
  can_use_whatsapp: true,
  can_manage_crm: false,
};

// Admin sempre tem tudo liberado
const ADMIN_PERMISSIONS: MemberPermissions = {
  crm_visibility: "all",
  can_generate_content: true,
  can_generate_posts: true,
  can_generate_scripts: true,
  can_use_whatsapp: true,
  can_manage_crm: true,
};

// ─── Hook principal — permissões do usuário logado ────────────────────────────

export function useMemberPermissions() {
  const { user, role } = useAuth();
  const { data: orgId } = useUserOrgId();

  const isAdmin =
    role === "cliente_admin" ||
    role === "admin" ||
    role === "super_admin";

  const query = useQuery({
    queryKey: ["member-permissions", user?.id, orgId],
    queryFn: async (): Promise<MemberPermissions> => {
      if (!user?.id || !orgId) return DEFAULT_USER_PERMISSIONS;

      const { data, error } = await supabase.rpc("get_member_permissions", {
        _user_id: user.id,
        _org_id: orgId,
      });

      if (error) {
        console.warn("useMemberPermissions: RPC error", error.message);
        return DEFAULT_USER_PERMISSIONS;
      }

      return (data as MemberPermissions) ?? DEFAULT_USER_PERMISSIONS;
    },
    enabled: !!user?.id && !!orgId && !isAdmin,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  // Admin sempre retorna permissões completas sem bater no banco
  if (isAdmin) {
    return {
      permissions: ADMIN_PERMISSIONS,
      isAdmin: true,
      isLoading: false,
    };
  }

  return {
    permissions: query.data ?? DEFAULT_USER_PERMISSIONS,
    isAdmin: false,
    isLoading: query.isLoading,
  };
}

// ─── Hook para listar perfis de permissão da org ──────────────────────────────

export function usePermissionProfiles() {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["permission-profiles", orgId],
    queryFn: async (): Promise<PermissionProfile[]> => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("permission_profiles")
        .select("*")
        .eq("organization_id", orgId)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });
}

// ─── Hook para criar/editar perfis ───────────────────────────────────────────

export function usePermissionProfileMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createProfile = useMutation({
    mutationFn: async (
      payload: Omit<PermissionProfile, "id" | "organization_id" | "created_at">
    ) => {
      if (!orgId) throw new Error("Org not found");
      const { data, error } = await supabase
        .from("permission_profiles")
        .insert({ ...payload, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permission-profiles"] }),
  });

  const updateProfile = useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<PermissionProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from("permission_profiles")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permission-profiles"] });
      qc.invalidateQueries({ queryKey: ["member-permissions"] });
    },
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("permission_profiles")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permission-profiles"] });
      qc.invalidateQueries({ queryKey: ["member-permissions"] });
    },
  });

  return { createProfile, updateProfile, deleteProfile };
}

// ─── Hook para ler/editar permissões de um membro específico ─────────────────

export function useMemberPermissionById(targetUserId: string | undefined) {
  const { data: orgId } = useUserOrgId();

  return useQuery({
    queryKey: ["member-permission-by-id", targetUserId, orgId],
    queryFn: async () => {
      if (!targetUserId || !orgId) return null;
      const { data } = await supabase
        .from("member_permissions")
        .select("*, permission_profiles(*)")
        .eq("user_id", targetUserId)
        .eq("organization_id", orgId)
        .maybeSingle();
      return data;
    },
    enabled: !!targetUserId && !!orgId,
  });
}

export function useSaveMemberPermission() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      user_id: string;
      profile_id?: string | null;
      crm_visibility?: "all" | "team" | "own" | null;
      can_generate_content?: boolean | null;
      can_generate_posts?: boolean | null;
      can_generate_scripts?: boolean | null;
      can_use_whatsapp?: boolean | null;
      can_manage_crm?: boolean | null;
    }) => {
      if (!orgId) throw new Error("Org not found");
      if (!user?.id) throw new Error("Not authenticated");

      // Usa função SECURITY DEFINER que bypassa RLS
      const { error } = await supabase.rpc("save_member_permissions" as any, {
        _caller_id: user.id,
        _user_id: payload.user_id,
        _org_id: orgId,
        _profile_id: payload.profile_id ?? null,
        _crm_visibility: payload.crm_visibility ?? "own",
        _can_generate_content: payload.can_generate_content ?? false,
        _can_generate_posts: payload.can_generate_posts ?? false,
        _can_generate_scripts: payload.can_generate_scripts ?? false,
        _can_use_whatsapp: payload.can_use_whatsapp ?? true,
        _can_manage_crm: payload.can_manage_crm ?? false,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["member-permissions"] });
      qc.invalidateQueries({ queryKey: ["member-permission-by-id", variables.user_id] });
    },
  });
}
