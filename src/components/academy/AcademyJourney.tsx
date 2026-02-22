import { BookOpen, Trophy, Award, TrendingUp, Play, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { categoryColors, categoryGradients } from "@/types/academy";
import {
  mockModules,
  getTotalProgress,
  getModuleProgress,
  getUserCertificates,
  getNextRecommendedLesson,
  getQuizByModule,
  getQuizAttempts,
  getLessonsByModule,
  getLessonProgress,
} from "@/mocks/academyData";

interface Props {
  onSelectModule: (moduleId: string) => void;
  onSelectLesson: (lessonId: string, moduleId: string) => void;
}

export function AcademyJourney({ onSelectModule, onSelectLesson }: Props) {
  const totalProgress = getTotalProgress();
  const certs = getUserCertificates();
  const next = getNextRecommendedLesson();
  const publishedModules = mockModules.filter(m => m.status === "published");
  const completedModules = publishedModules.filter(m => getModuleProgress(m.id) === 100).length;
  const passedQuizzes = publishedModules.filter(m => {
    const q = getQuizByModule(m.id);
    return q && getQuizAttempts(q.id).some(a => a.status === "passed");
  }).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI cards — large icons, vibrant */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Progresso Geral", value: `${totalProgress}%`, icon: TrendingUp, gradient: "from-blue-500/15 to-blue-500/5", iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-500/20" },
          { label: "Módulos Concluídos", value: `${completedModules}/${publishedModules.length}`, icon: BookOpen, gradient: "from-purple-500/15 to-purple-500/5", iconColor: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-500/20" },
          { label: "Provas Aprovadas", value: `${passedQuizzes}/${publishedModules.length}`, icon: Trophy, gradient: "from-orange-500/15 to-orange-500/5", iconColor: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-500/20" },
          { label: "Certificados", value: String(certs.length), icon: Award, gradient: "from-yellow-500/15 to-yellow-500/5", iconColor: "text-yellow-600 dark:text-yellow-400", iconBg: "bg-yellow-500/20" },
        ].map((kpi) => (
          <Card key={kpi.label} className={`p-4 bg-gradient-to-br ${kpi.gradient} border-0`}>
            <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center mb-3`}>
              <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
            <span className="text-xs text-muted-foreground">{kpi.label}</span>
          </Card>
        ))}
      </div>

      {/* Next recommended — CTA card */}
      {next && (
        <Card className="relative overflow-hidden p-5 border-2 border-primary/20 bg-gradient-to-br from-primary/8 to-transparent">
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Play className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Continue de onde parou</p>
              <p className="font-bold text-base mt-0.5">{next.module.title}</p>
              <p className="text-sm text-muted-foreground truncate">{next.lesson.title}</p>
            </div>
            <Button size="lg" className="gap-2 flex-shrink-0" onClick={() => onSelectLesson(next.lesson.id, next.module.id)}>
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Per-module progress — visual cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Por Módulo</h3>
        {publishedModules.map((mod) => {
          const progress = getModuleProgress(mod.id);
          const lessons = getLessonsByModule(mod.id);
          const completedLessons = lessons.filter(l => getLessonProgress(l.id)?.status === "completed").length;
          const quiz = getQuizByModule(mod.id);
          const quizAttempts = quiz ? getQuizAttempts(quiz.id) : [];
          const passed = quizAttempts.some(a => a.status === "passed");
          const bestScore = quizAttempts.length > 0 ? Math.max(...quizAttempts.map(a => a.score)) : null;
          const color = categoryColors[mod.category];
          const gradient = categoryGradients[mod.category];
          const isComplete = progress === 100 && passed;

          // Find next incomplete lesson
          const nextLesson = lessons.find(l => getLessonProgress(l.id)?.status !== "completed");

          return (
            <Card key={mod.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-all" onClick={() => onSelectModule(mod.id)}>
              {/* Mini gradient strip */}
              <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-sm flex-1">{mod.title}</h4>
                  {isComplete && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Completo</span>
                    </div>
                  )}
                  {!isComplete && progress > 0 && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span className="text-xs font-medium">Em andamento</span>
                    </div>
                  )}
                </div>

                <Progress value={progress} className="h-2" />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{completedLessons}/{lessons.length} aulas</span>
                  <span>
                    Prova: {passed ? <span className="text-emerald-600 font-medium">Aprovado ({bestScore}%)</span> : quizAttempts.length > 0 ? <span className="text-destructive">Reprovado</span> : "Pendente"}
                  </span>
                </div>

                {nextLesson && !isComplete && (
                  <button
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    onClick={(e) => { e.stopPropagation(); onSelectLesson(nextLesson.id, mod.id); }}
                  >
                    <ArrowRight className="w-3 h-3" /> Próxima: {nextLesson.title}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
