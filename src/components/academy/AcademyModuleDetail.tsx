import { ArrowLeft, CheckCircle2, PlayCircle, FileText, Trophy, Lock, Clock, BookOpen, TrendingUp, Target, Building2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { categoryGradients } from "@/types/academy";
import type { AcademyModuleCategory } from "@/types/academy";
import {
  useAcademyModules, useAcademyLessons, useAcademyProgress,
  useAcademyQuizzes, useAcademyQuizAttempts, useAcademyCertificates,
  computeModuleProgress,
} from "@/hooks/useAcademy";

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
  const { data: modules = [] } = useAcademyModules();
  const { data: allLessons = [] } = useAcademyLessons();
  const { data: progress = [] } = useAcademyProgress();
  const { data: quizzes = [] } = useAcademyQuizzes();
  const { data: allAttempts = [] } = useAcademyQuizAttempts();
  const { data: certs = [] } = useAcademyCertificates();

  const mod = modules.find(m => m.id === moduleId);
  if (!mod) return null;

  const lessons = allLessons.filter(l => l.module_id === moduleId).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const quiz = quizzes.find(q => q.module_id === moduleId);
  const modProgress = computeModuleProgress(moduleId, allLessons, progress);
  const completedCount = lessons.filter(l => progress.some(p => p.lesson_id === l.id && p.completed_at)).length;
  const allLessonsComplete = completedCount === lessons.length && lessons.length > 0;
  const attempts = quiz ? allAttempts.filter(a => a.quiz_id === quiz.id) : [];
  const passed = attempts.some(a => a.passed);
  const cert = certs.find(c => c.module_id === moduleId);
  const gradient = categoryGradients[(mod.category as AcademyModuleCategory) ?? "Comercial"];
  const CatIcon = categoryIcons[mod.category ?? ""] || BookOpen;
  const estimatedHours = Math.round(lessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0) / 60 * 10) / 10;
  const maxAttempts = quiz?.passing_score ? 3 : 3; // Default 3 attempts

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white relative overflow-hidden`}>
        <CatIcon className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5" />
        <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-3 -ml-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <h2 className="text-2xl font-bold">{mod.title}</h2>
        <p className="text-white/80 mt-1 text-sm max-w-2xl">{mod.description}</p>
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> {lessons.length} aulas
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> ~{estimatedHours}h
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span>{completedCount} de {lessons.length} aulas concluídas</span>
            <span className="font-semibold">{modProgress}%</span>
          </div>
          <Progress value={modProgress} className="h-2 bg-white/20" />
        </div>
      </div>

      {/* Lessons timeline */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Aulas</h3>
        <div className="relative">
          <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border" />
          {lessons.map((lesson, i) => {
            const isCompleted = progress.some(p => p.lesson_id === lesson.id && p.completed_at);
            const isInProgress = progress.some(p => p.lesson_id === lesson.id && !p.completed_at);
            return (
              <div
                key={lesson.id}
                className={`relative flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all hover:bg-accent/50 ${isInProgress ? "bg-blue-500/5 ring-1 ring-blue-500/20" : ""}`}
                onClick={() => onSelectLesson(lesson.id)}
              >
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                  isCompleted ? "bg-emerald-500/15 border-emerald-500 text-emerald-600"
                    : isInProgress ? "bg-blue-500/15 border-blue-500 text-blue-600 animate-pulse"
                    : "bg-card border-border text-muted-foreground"
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isInProgress ? <PlayCircle className="w-5 h-5" /> : <span className="text-xs font-semibold">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{lesson.title}</p>
                    {isCompleted && <Badge variant="secondary" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Concluída</Badge>}
                    {isInProgress && <Badge variant="secondary" className="text-[9px] bg-blue-500/10 text-blue-600 border-blue-500/20">Em andamento</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{lesson.duration_minutes ?? 0} min</p>
                </div>
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
              <p className="text-xs text-muted-foreground mt-0.5">Nota mínima: {quiz.passing_score ?? 70}% · {maxAttempts} tentativas · {attempts.length} usadas</p>
            </div>
            {passed && <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Aprovado ✓</Badge>}
          </div>
          <Button
            className="w-full mt-4 gap-2"
            size="lg"
            variant={passed ? "outline" : "default"}
            disabled={!allLessonsComplete || (attempts.length >= maxAttempts && !passed)}
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
              <h4 className="font-semibold text-sm">Certificado Disponível</h4>
              <p className="text-xs text-muted-foreground">ID: {cert.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onViewCertificate(cert.id)}>Ver Certificado</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
