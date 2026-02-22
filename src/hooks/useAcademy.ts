import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";

export function useAcademyModules() {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["academy-modules", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_modules").select("*").eq("organization_id", orgId!).order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useAcademyLessons(moduleId?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["academy-lessons", orgId, moduleId],
    queryFn: async () => {
      let q = supabase.from("academy_lessons").select("*").eq("organization_id", orgId!).order("sort_order");
      if (moduleId) q = q.eq("module_id", moduleId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useAcademyProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["academy-progress", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_progress").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAcademyCertificates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["academy-certificates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_certificates").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAcademyMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();
  const { user } = useAuth();

  const createModule = useMutation({
    mutationFn: async (mod: { title: string; description?: string; category?: string; difficulty?: string }) => {
      const { data, error } = await supabase.from("academy_modules").insert({ ...mod, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academy-modules"] }),
  });

  const markLessonComplete = useMutation({
    mutationFn: async (lessonId: string) => {
      const { data, error } = await supabase.from("academy_progress").upsert({ user_id: user!.id, lesson_id: lessonId, completed_at: new Date().toISOString(), progress_percent: 100 }, { onConflict: "user_id,lesson_id" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academy-progress"] }),
  });

  return { createModule, markLessonComplete };
}
