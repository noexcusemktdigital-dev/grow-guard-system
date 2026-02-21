import { BookOpen, Trophy, Award, TrendingUp, Play, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  categoryColors,
} from "@/data/academyData";

const badgeStyle: Record<string, string> = {
  blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  purple: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  orange: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
};

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
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Progresso Geral", value: `${totalProgress}%`, icon: TrendingUp, color: "text-blue-600" },
          { label: "Módulos Concluídos", value: `${completedModules}/${publishedModules.length}`, icon: BookOpen, color: "text-purple-600" },
          { label: "Provas Aprovadas", value: `${passedQuizzes}/${publishedModules.length}`, icon: Trophy, color: "text-orange-600" },
          { label: "Certificados", value: String(certs.length), icon: Award, color: "text-yellow-600" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Next recommended */}
      {next && (
        <Card className="p-4 border-2 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Continue de onde parou</p>
              <p className="font-semibold text-sm truncate">{next.module.title} → {next.lesson.title}</p>
            </div>
            <Button size="sm" onClick={() => onSelectLesson(next.lesson.id, next.module.id)}>Continuar</Button>
          </div>
        </Card>
      )}

      {/* Per-module progress */}
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

          return (
            <Card key={mod.id} className="p-4 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onSelectModule(mod.id)}>
              <div className="flex items-center gap-3 mb-3">
                <Badge className={`${badgeStyle[color]} text-[10px]`}>{mod.category}</Badge>
                <h4 className="font-medium text-sm flex-1">{mod.title}</h4>
                {progress === 100 && passed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <Progress value={progress} className="h-1.5 mb-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completedLessons}/{lessons.length} aulas</span>
                <span>
                  Prova: {passed ? <span className="text-emerald-600">Aprovado ({bestScore}%)</span> : quizAttempts.length > 0 ? <span className="text-destructive">Reprovado</span> : "Pendente"}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
