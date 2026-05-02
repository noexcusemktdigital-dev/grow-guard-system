import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { playSound } from "@/lib/sounds";
import { toast } from "sonner";
import type { TablesInsert } from "@/integrations/supabase/typed";

const NOTIFICATIONS_PAGE_SIZE = 50;

export function useClienteContent() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["client-content", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_content").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useClienteCampaigns() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["client-campaigns", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_campaigns").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

// NOTE: useClienteScripts and useClienteDispatches are defined in their own
// dedicated files (useClienteScripts.ts, useClienteDispatches.ts) with richer
// APIs. Import from those files directly.

export function useClienteSites() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["client-sites", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_sites").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useClienteNotifications() {
  const { user } = useAuth();
  return useInfiniteQuery({
    queryKey: ["client-notifications", user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * NOTIFICATIONS_PAGE_SIZE;
      const to = from + NOTIFICATIONS_PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("client_notifications")
        .select("*")
        .eq("user_id", user?.id ?? "")
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data: data ?? [], page: pageParam };
    },
    getNextPageParam: (lastPage) =>
      lastPage?.data?.length === NOTIFICATIONS_PAGE_SIZE ? lastPage.page + 1 : undefined,
    initialPageParam: 0,
    enabled: !!user,
  });
}

export function useClienteChecklist(date?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["client-checklist", user?.id, date],
    queryFn: async () => {
      let q = supabase.from("client_checklist_items").select("*").eq("user_id", user?.id ?? "").order("created_at");
      if (date) q = q.eq("date", date);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}

export function useClienteGamification() {
  const { user } = useAuth();
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["client-gamification", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_gamification").select("*").eq("user_id", user?.id ?? "").eq("organization_id", orgId ?? "").maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!orgId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useClienteContentMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createContent = useMutation({
    mutationFn: async (content: { title: string; body?: string; type?: string; platform?: string; scheduled_at?: string }) => {
      const { data, error } = await supabase.from("client_content").insert({ ...content, organization_id: orgId!, created_by: user?.id } satisfies TablesInsert<"client_content">).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-content"] }),
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: { name: string; type?: string; budget?: number; start_date?: string; end_date?: string }) => {
      const { data, error } = await supabase.from("client_campaigns").insert({ ...campaign, organization_id: orgId!, created_by: user?.id } satisfies TablesInsert<"client_campaigns">).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-campaigns"] }),
  });

  const createScript = useMutation({
    mutationFn: async (script: { title: string; content?: string; category?: string; tags?: string[] }) => {
      const { data, error } = await supabase.from("client_scripts").insert({ ...script, organization_id: orgId!, created_by: user?.id } satisfies TablesInsert<"client_scripts">).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-scripts"] }),
  });

  const createDispatch = useMutation({
    mutationFn: async (dispatch: { title: string; channel?: string; message?: string; scheduled_at?: string }) => {
      const { data, error } = await supabase.from("client_dispatches").insert({ ...dispatch, organization_id: orgId!, created_by: user?.id } satisfies TablesInsert<"client_dispatches">).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-dispatches"] }),
  });

  const createSite = useMutation({
    mutationFn: async (site: { name: string; type?: string; content?: Record<string, unknown> }) => {
      const { data, error } = await supabase.from("client_sites").insert({ ...site, organization_id: orgId!, created_by: user?.id } satisfies TablesInsert<"client_sites">).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-sites"] }),
  });

  const createChecklistItem = useMutation({
    mutationFn: async (item: { title: string; date?: string; source?: string; category?: string }) => {
      if (!orgId || !user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase.from("client_checklist_items").insert({ ...item, organization_id: orgId, user_id: user.id } satisfies TablesInsert<"client_checklist_items">).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-checklist"] }),
  });

  const toggleChecklistItem = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase.from("client_checklist_items").update({ is_completed }).eq("id", id);
      if (error) throw error;

      // If completing, add XP (+10 per task, +50 bonus if all done)
      if (is_completed && user && orgId) {
        const { data: gamData } = await supabase
          .from("client_gamification")
          .select("*")
          .eq("user_id", user.id)
          .eq("organization_id", orgId)
          .maybeSingle();

        if (gamData) {
          // Always give +10 XP per task
          let xpGain = 10;

          // Check if all items for today are now completed for bonus
          const today = new Date().toISOString().split("T")[0];
          const { data: todayItems } = await supabase
            .from("client_checklist_items")
            .select("id, is_completed")
            .eq("user_id", user.id)
            .eq("date", today);

          const allDone = todayItems && todayItems.every((i: { is_completed: boolean; id: string }) => i.is_completed || i.id === id);
          if (allDone && todayItems && todayItems.length > 1) {
            xpGain += 50; // Bonus for completing all
          }

          const currentXp = (gamData.xp as number) || 0;
          const newXp = currentXp + xpGain;
          let title = "Novato";
          if (newXp >= 12000) title = "Lenda";
          else if (newXp >= 7000) title = "Mestre";
          else if (newXp >= 3500) title = "Especialista";
          else if (newXp >= 1500) title = "Profissional";
          else if (newXp >= 500) title = "Aprendiz";

          await supabase
            .from("client_gamification")
            .update({ xp: newXp, title, points: (gamData.points || 0) + xpGain, last_activity_at: new Date().toISOString() })
            .eq("id", gamData.id);

          return { xpGain, allDone, newXp };
        }
      }
      return { xpGain: 0, allDone: false };
    },
    onSuccess: (result, variables) => {
      qc.invalidateQueries({ queryKey: ["client-checklist"] });
      qc.invalidateQueries({ queryKey: ["client-gamification"] });
      if (variables.is_completed && result) {
        playSound("success");
        if (result.xpGain > 0) {
          if (result.allDone) {
            toast.success(`+${result.xpGain} XP 🎉 Todas concluídas! Bônus de 50 XP!`, { duration: 4000 });
          } else {
            toast.success(`+10 XP ⚡`, { duration: 2000 });
          }
        }
      }
    },
  });

  const markNotificationRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-notifications"] }),
  });

  const markAllNotificationsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("client_notifications")
        .update({ is_read: true })
        .eq("user_id", user?.id ?? "")
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-notifications"] }),
  });

  return { createContent, createCampaign, createScript, createDispatch, createSite, createChecklistItem, toggleChecklistItem, markNotificationRead, markAllNotificationsRead };
}
