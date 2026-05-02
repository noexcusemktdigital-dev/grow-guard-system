// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export function useAnnouncements(filterByRole?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["announcements", orgId, filterByRole],
    queryFn: async () => {
      // Use the DB function that also returns parent org announcements
      const { data, error } = await supabase.rpc("get_announcements_with_parent", {
        _org_id: orgId!,
      });
      if (error) throw error;
      // Filter by target_roles if specified: show announcements with no role restriction OR that include this role
      if (filterByRole && data) {
        return data.filter((a) => !a.target_roles || a.target_roles.length === 0 || a.target_roles.includes(filterByRole));
      }
      return data;
    },
    enabled: !!orgId,
    // PERF: anúncios raramente mudam
    staleTime: 1000 * 60 * 60, // 1h
    refetchOnWindowFocus: false,
  });
}

export function useAnnouncementMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createAnnouncement = useMutation({
    mutationFn: async (ann: { title: string; content?: string; type?: string; priority?: string; target_roles?: string[]; target_unit_ids?: string[]; published_at?: string; expires_at?: string }) => {
      const { data, error } = await supabase.from("announcements").insert({ ...ann, organization_id: orgId!, created_by: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  const updateAnnouncement = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("announcements").update(updates).eq("id", id).eq("organization_id", orgId!).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id).eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  return { createAnnouncement, updateAnnouncement, deleteAnnouncement };
}
