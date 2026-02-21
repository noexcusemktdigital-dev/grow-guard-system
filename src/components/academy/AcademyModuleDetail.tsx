import { ArrowLeft, CheckCircle2, PlayCircle, FileText, Trophy, Lock, Clock, BookOpen, TrendingUp, Target, Building2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  mockModules,
  getLessonsByModule,
  getQuizByModule,
  getModuleProgress,
  getLessonProgress,
  getQuizAttempts,
  getUserCertificates,
  categoryGradients,
} from "@/data/academyData";

const categoryIcons: Record<string, React.ElementType> = {
  Comercial: TrendingUp,
  Estrategia: Target,
  Institucional: Building2,
  Produtos: Package,
};

interface Props {
  moduleId: string;
  onBack: () => void;
  onSelectLesson: (lessonId: string) => void;
  onStartQuiz: (quizId: string) => void;
  onViewCertificate: (certId: string) => void;
}

export function AcademyModuleDetail({ moduleId, onBack, onSelectLesson, onStartQuiz, onViewCertificate }: Props) {
  const mod = mockModules.find((m) => m.id === moduleId);
  if (!mod) return null;

  const lessons = getLessonsByModule(moduleId);
  const quiz = getQuizByModule(moduleId);
  const progress = getModuleProgress(moduleId);
  const completedCount = lessons.filter((l) => getLessonProgress(l.id)?.status === "completed").length;
  const allLessonsComplete = completedCount === lessons.length;
  const attempts = quiz ? getQuizAttempts(quiz.id) : [];
  const passed = attempts.some((a) => a.status === "passed");
  const cert = getUserCertificates().find((c) => c.moduleId === moduleId);
  const gradient = categoryGradients[mod.category];
  const CatIcon = categoryIcons[mod.category] || BookOpen;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white relative overflow-hidden`}>
        {/* Decorative icon */}
        <CatIcon className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5" />

        <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-3 -ml-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <h2 className="text-2xl font-bold">{mod.title}</h2>
        <p className="text-white/80 mt-1 text-sm max-w-2xl">{mod.description}</p>

        {/* Stats cards inline */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> {lessons.length} aulas
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> ~{mod.estimatedHours}h
          </div>
          <Badge className="bg-white/20 text-white border-white/30">{mod.version}</Badge>
        </div>

        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span>{completedCount} de {lessons.length} aulas concluídas</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/20" />
        </div>
      </div>

      {/* Lessons timeline */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Aulas</h3>
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border" />

          {lessons.map((lesson, i) => {
            const lp = getLessonProgress(lesson.id);
            const isCompleted = lp?.status === "completed";
            const isInProgress = lp?.status === "in_progress";

            return (
              <div
                key={lesson.id}
                className={`relative flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all hover:bg-accent/50 ${
                  isInProgress ? "bg-blue-500/5 ring-1 ring-blue-500/20" : ""
                }`}
                onClick={() => onSelectLesson(lesson.id)}
              >
                {/* Status indicator */}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                  isCompleted
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600"
                    : isInProgress
                    ? "bg-blue-500/15 border-blue-500 text-blue-600 animate-pulse"
                    : "bg-card border-border text-muted-foreground"
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isInProgress ? (
                    <PlayCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-xs font-semibold">{i + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{lesson.title}</p>
                    {isCompleted && (
                      <Badge variant="secondary" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Concluída</Badge>
                    )}
                    {isInProgress && (
                      <Badge variant="secondary" className="text-[9px] bg-blue-500/10 text-blue-600 border-blue-500/20">Em andamento</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{lesson.estimatedMinutes} min</p>
                </div>

                {lesson.attachments && lesson.attachments.length > 0 && (
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quiz section */}
      {quiz && (
        <Card className={`relative overflow-hidden p-5 border-2 ${allLessonsComplete ? "border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent" : "border-border"}`}>
          {allLessonsComplete && <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-orange-500/10 blur-xl" />}
          <div className="relative flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${allLessonsComplete ? "bg-orange-500/20" : "bg-muted"}`}>
              {allLessonsComplete ? <Trophy className="w-7 h-7 text-orange-600" /> : <Lock className="w-7 h-7 text-muted-foreground" />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base">Prova Final</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Nota mínima: {quiz.passingScore}% · {quiz.attemptsAllowed} tentativas · {attempts.length} usadas</p>
            </div>
            {passed && <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Aprovado ✓</Badge>}
          </div>
          <Button
            className="w-full mt-4 gap-2"
            size="lg"
            variant={passed ? "outline" : "default"}
            disabled={!allLessonsComplete || (attempts.length >= quiz.attemptsAllowed && !passed)}
            onClick={() => onStartQuiz(quiz.id)}
          >
            {!allLessonsComplete ? "Conclua todas as aulas primeiro" : passed ? "Refazer Prova" : attempts.length > 0 ? "Tentar Novamente" : "Fazer Prova"}
          </Button>
        </Card>
      )}

      {/* Certificate */}
      {cert && (
        <Card className="p-5 border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-yellow-500/20">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Certificado Disponível 🎉</h4>
              <p className="text-xs text-muted-foreground">ID: {cert.certificateId}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onViewCertificate(cert.id)}>Ver Certificado</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
