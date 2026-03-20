import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export function useAnnouncementViews() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["announcement-views", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcement_views")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAnnouncementViewMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const markViewed = useMutation({
    mutationFn: async (announcementId: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase
        .from("announcement_views")
        .upsert({ announcement_id: announcementId, user_id: user.id, viewed_at: new Date().toISOString() }, { onConflict: "announcement_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcement-views"] }),
  });

  const confirmRead = useMutation({
    mutationFn: async (announcementId: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      // First ensure viewed
      await supabase
        .from("announcement_views")
        .upsert({ announcement_id: announcementId, user_id: user.id, viewed_at: new Date().toISOString() }, { onConflict: "announcement_id,user_id" });
      // Then confirm
      const { error } = await supabase
        .from("announcement_views")
        .update({ confirmed_at: new Date().toISOString() })
        .eq("announcement_id", announcementId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcement-views"] }),
  });

  return { markViewed, confirmRead };
}
