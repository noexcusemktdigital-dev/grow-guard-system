import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";

export function usePermissionProfiles() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["permission-profiles", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("permission_profiles").select("*").eq("organization_id", orgId!).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useModulePermissions(profileId?: string) {
  return useQuery({
    queryKey: ["module-permissions", profileId],
    queryFn: async () => {
      const { data, error } = await supabase.from("module_permissions").select("*").eq("profile_id", profileId!);
      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });
}

export function usePermissionMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createProfile = useMutation({
    mutationFn: async (profile: { name: string; description?: string }) => {
      const { data, error } = await supabase.from("permission_profiles").insert({ ...profile, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permission-profiles"] }),
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("permission_profiles").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permission-profiles"] }),
  });

  return { createProfile, updateProfile };
}
