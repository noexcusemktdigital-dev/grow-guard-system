import type { 
  AcademyModule, AcademyLesson, AcademyQuiz, AcademyQuizQuestion, 
  AcademyProgress, AcademyQuizAttempt, AcademyCertificate, AcademyModuleCategory 
} from "@/types/academy";
import { mockLessons, mockQuizzes, mockQuizQuestions, mockProgress, mockModules, mockCertificates, mockQuizAttempts } from "@/mocks/academy";

export function getLessonsByModule(moduleId: string): AcademyLesson[] {
  return mockLessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order);
}

export function getQuizByModule(moduleId: string): AcademyQuiz | undefined {
  return mockQuizzes.find((q) => q.moduleId === moduleId);
}

export function getQuestionsByQuiz(quizId: string): AcademyQuizQuestion[] {
  return mockQuizQuestions.filter((q) => q.quizId === quizId);
}

export function getModuleProgress(moduleId: string, userId = "user-1"): number {
  const lessons = getLessonsByModule(moduleId);
  if (lessons.length === 0) return 0;
  const completed = lessons.filter((l) =>
    mockProgress.some((p) => p.userId === userId && p.lessonId === l.id && p.status === "completed")
  ).length;
  return Math.round((completed / lessons.length) * 100);
}

export function getLessonProgress(lessonId: string, userId = "user-1"): AcademyProgress | undefined {
  return mockProgress.find((p) => p.userId === userId && p.lessonId === lessonId);
}

export function getModulesByCategory(cat: AcademyModuleCategory | "Todos"): AcademyModule[] {
  if (cat === "Todos") return mockModules;
  return mockModules.filter((m) => m.category === cat);
}

export function getUserCertificates(userId = "user-1"): AcademyCertificate[] {
  return mockCertificates.filter((c) => c.userId === userId);
}

export function getQuizAttempts(quizId: string, userId = "user-1"): AcademyQuizAttempt[] {
  return mockQuizAttempts.filter((a) => a.userId === userId && a.quizId === quizId);
}

export function getTotalProgress(userId = "user-1"): number {
  const totalLessons = mockLessons.length;
  if (totalLessons === 0) return 0;
  const completed = mockLessons.filter((l) =>
    mockProgress.some((p) => p.userId === userId && p.lessonId === l.id && p.status === "completed")
  ).length;
  return Math.round((completed / totalLessons) * 100);
}

export function getNextRecommendedLesson(userId = "user-1"): { module: AcademyModule; lesson: AcademyLesson } | null {
  for (const mod of mockModules) {
    const lessons = getLessonsByModule(mod.id);
    for (const lesson of lessons) {
      const progress = getLessonProgress(lesson.id, userId);
      if (!progress || progress.status !== "completed") {
        return { module: mod, lesson };
      }
    }
  }
  return null;
}

// NOTE: This modifies in-memory mock data. It won't persist across reloads.
export function markLessonComplete(lessonId: string, userId = "user-1") {
  const existingIndex = mockProgress.findIndex((p) => p.userId === userId && p.lessonId === lessonId);
  const now = new Date().toISOString();
  if (existingIndex >= 0) {
    mockProgress[existingIndex] = { ...mockProgress[existingIndex], status: "completed", completedAt: now, lastSeenAt: now };
  } else {
    mockProgress.push({ userId, lessonId, status: "completed", completedAt: now, lastSeenAt: now });
  }
}

// NOTE: This modifies in-memory mock data.
export function submitQuizAttempt(quizId: string, score: number, userId = "user-1"): AcademyQuizAttempt {
  const existing = getQuizAttempts(quizId, userId);
  const quiz = mockQuizzes.find((q) => q.id === quizId)!;
  const attempt: AcademyQuizAttempt = {
    userId,
    quizId,
    attemptNumber: existing.length + 1,
    score,
    status: score >= quiz.passingScore ? "passed" : "failed",
    submittedAt: new Date().toISOString(),
  };
  mockQuizAttempts.push(attempt);

  // Auto-generate certificate if passed and all lessons completed
  if (attempt.status === "passed") {
    const moduleId = quiz.moduleId;
    const progress = getModuleProgress(moduleId, userId);
    const alreadyHasCert = mockCertificates.some((c) => c.userId === userId && c.moduleId === moduleId);
    if (progress === 100 && !alreadyHasCert) {
      const cert: AcademyCertificate = {
        id: `cert-${Date.now()}`,
        userId,
        moduleId,
        issuedAt: new Date().toISOString(),
        certificateId: `NOE-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      };
      mockCertificates.push(cert);
    }
  }

  return attempt;
}

export function getCategoryModuleCount(cat: AcademyModuleCategory): number {
  return mockModules.filter(m => m.category === cat && m.status === "published").length;
}