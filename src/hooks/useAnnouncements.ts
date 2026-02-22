import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export function useAnnouncements() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["announcements", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useAnnouncementMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createAnnouncement = useMutation({
    mutationFn: async (ann: { title: string; content?: string; type?: string; priority?: string; target_roles?: string[] }) => {
      const { data, error } = await supabase.from("announcements").insert({ ...ann, organization_id: orgId!, created_by: user?.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  const updateAnnouncement = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("announcements").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  return { createAnnouncement, updateAnnouncement, deleteAnnouncement };
}
