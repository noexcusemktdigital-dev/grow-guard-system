// Academy types and constants (extracted from academyData.ts)

export type AcademyModuleCategory = "Comercial" | "Estrategia" | "Institucional" | "Produtos";
export type AcademyModuleStatus = "draft" | "published";
export type AcademyLessonStatus = "not_started" | "in_progress" | "completed";
export type AcademyQuizQuestionType = "mcq" | "truefalse";
export type AcademyAttemptStatus = "passed" | "failed";

export interface AcademyModule {
  id: string;
  title: string;
  category: AcademyModuleCategory;
  description: string;
  coverImage: string;
  status: AcademyModuleStatus;
  order: number;
  lessonsCount: number;
  estimatedHours: number;
  version: string;
}

export interface AcademyLesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  youtubeUrl: string;
  order: number;
  estimatedMinutes: number;
  attachments?: { name: string; url: string }[];
}

export interface AcademyQuiz {
  id: string;
  moduleId: string;
  passingScore: number;
  attemptsAllowed: number;
  timeLimit?: number;
  showFeedback: boolean;
}

export interface AcademyQuizQuestion {
  id: string;
  quizId: string;
  type: AcademyQuizQuestionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
  points: number;
}

export interface AcademyProgress {
  userId: string;
  lessonId: string;
  status: AcademyLessonStatus;
  completedAt?: string;
  lastSeenAt: string;
}

export interface AcademyQuizAttempt {
  userId: string;
  quizId: string;
  attemptNumber: number;
  score: number;
  status: AcademyAttemptStatus;
  submittedAt: string;
}

export interface AcademyCertificate {
  id: string;
  userId: string;
  moduleId: string;
  issuedAt: string;
  certificateId: string;
}

export interface FranchiseReport {
  franchiseId: string;
  franchiseName: string;
  usersCount: number;
  avgCompletion: number;
  quizzesPassed: number;
  certificates: number;
}

// Constants
export const categoryColors: Record<AcademyModuleCategory, string> = {
  Comercial: "blue",
  Estrategia: "purple",
  Institucional: "emerald",
  Produtos: "orange",
};

export const categoryGradients: Record<AcademyModuleCategory, string> = {
  Comercial: "from-blue-500 to-blue-700",
  Estrategia: "from-purple-500 to-purple-700",
  Institucional: "from-emerald-500 to-emerald-700",
  Produtos: "from-orange-500 to-orange-700",
};

export const categoryIcons: Record<AcademyModuleCategory, string> = {
  Comercial: "TrendingUp",
  Estrategia: "Target",
  Institucional: "Building2",
  Produtos: "Package",
};

export const categoryDescriptions: Record<AcademyModuleCategory, string> = {
  Comercial: "Vendas e negociação",
  Estrategia: "Planejamento e gestão",
  Institucional: "Cultura e valores",
  Produtos: "Conhecimento técnico",
};
