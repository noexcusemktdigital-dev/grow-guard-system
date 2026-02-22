import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "./useUserOrgId";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

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

export function useAcademyQuizzes(moduleId?: string) {
  const { data: orgId } = useUserOrgId();
  return useQuery({
    queryKey: ["academy-quizzes", orgId, moduleId],
    queryFn: async () => {
      let q = supabase.from("academy_quizzes").select("*").eq("organization_id", orgId!);
      if (moduleId) q = q.eq("module_id", moduleId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useAcademyQuizQuestions(quizId?: string) {
  return useQuery({
    queryKey: ["academy-quiz-questions", quizId],
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_quiz_questions").select("*").eq("quiz_id", quizId!).order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!quizId,
  });
}

export function useAcademyQuizAttempts(quizId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["academy-quiz-attempts", user?.id, quizId],
    queryFn: async () => {
      let q = supabase.from("academy_quiz_attempts").select("*").eq("user_id", user!.id);
      if (quizId) q = q.eq("quiz_id", quizId);
      const { data, error } = await q.order("created_at");
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

  const updateModule = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; is_published?: boolean; title?: string; description?: string; category?: string }) => {
      const { data, error } = await supabase.from("academy_modules").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academy-modules"] }),
  });

  const createLesson = useMutation({
    mutationFn: async (lesson: { title: string; module_id: string; content?: string; video_url?: string; duration_minutes?: number; sort_order?: number }) => {
      const { data, error } = await supabase.from("academy_lessons").insert({ ...lesson, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academy-lessons"] }),
  });

  const markLessonComplete = useMutation({
    mutationFn: async (lessonId: string) => {
      // Check if progress exists
      const { data: existing } = await supabase
        .from("academy_progress")
        .select("id")
        .eq("user_id", user!.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("academy_progress")
          .update({ completed_at: new Date().toISOString(), progress_percent: 100 })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("academy_progress")
          .insert({ user_id: user!.id, lesson_id: lessonId, completed_at: new Date().toISOString(), progress_percent: 100 })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academy-progress"] }),
  });

  const submitQuizAttempt = useMutation({
    mutationFn: async ({ quizId, score, passed, answers }: { quizId: string; score: number; passed: boolean; answers?: Json }) => {
      const { data, error } = await supabase.from("academy_quiz_attempts").insert({
        user_id: user!.id,
        quiz_id: quizId,
        score,
        passed,
        answers,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academy-quiz-attempts"] }),
  });

  const insertCertificate = useMutation({
    mutationFn: async (moduleId: string) => {
      const { data, error } = await supabase.from("academy_certificates").insert({
        user_id: user!.id,
        module_id: moduleId,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academy-certificates"] }),
  });

  return { createModule, updateModule, createLesson, markLessonComplete, submitQuizAttempt, insertCertificate };
}

// ===== Computed helpers (work with data from hooks) =====

export type DbModule = NonNullable<ReturnType<typeof useAcademyModules>["data"]>[number];
export type DbLesson = NonNullable<ReturnType<typeof useAcademyLessons>["data"]>[number];
export type DbProgress = NonNullable<ReturnType<typeof useAcademyProgress>["data"]>[number];
export type DbQuiz = NonNullable<ReturnType<typeof useAcademyQuizzes>["data"]>[number];
export type DbQuizQuestion = NonNullable<ReturnType<typeof useAcademyQuizQuestions>["data"]>[number];
export type DbQuizAttempt = NonNullable<ReturnType<typeof useAcademyQuizAttempts>["data"]>[number];
export type DbCertificate = NonNullable<ReturnType<typeof useAcademyCertificates>["data"]>[number];

export function computeModuleProgress(moduleId: string, allLessons: DbLesson[], progress: DbProgress[]): number {
  const lessons = allLessons.filter(l => l.module_id === moduleId);
  if (lessons.length === 0) return 0;
  const completed = lessons.filter(l => progress.some(p => p.lesson_id === l.id && p.completed_at)).length;
  return Math.round((completed / lessons.length) * 100);
}

export function computeTotalProgress(allLessons: DbLesson[], progress: DbProgress[]): number {
  if (allLessons.length === 0) return 0;
  const completed = allLessons.filter(l => progress.some(p => p.lesson_id === l.id && p.completed_at)).length;
  return Math.round((completed / allLessons.length) * 100);
}
