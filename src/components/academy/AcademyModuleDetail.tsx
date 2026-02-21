import { ArrowLeft, CheckCircle2, PlayCircle, Lock, FileText, Trophy, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  type AcademyModule,
  mockModules,
  getLessonsByModule,
  getQuizByModule,
  getModuleProgress,
  getLessonProgress,
  getQuizAttempts,
  getUserCertificates,
  categoryGradients,
} from "@/data/academyData";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-xl bg-gradient-to-br ${gradient} p-6 text-white relative`}>
        <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-3 -ml-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <h2 className="text-2xl font-bold">{mod.title}</h2>
        <p className="text-white/80 mt-1 text-sm max-w-2xl">{mod.description}</p>
        <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
          <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {lessons.length} aulas</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> ~{mod.estimatedHours}h</span>
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

      {/* Lessons list */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Aulas</h3>
        {lessons.map((lesson, i) => {
          const lp = getLessonProgress(lesson.id);
          const isCompleted = lp?.status === "completed";
          const isInProgress = lp?.status === "in_progress";

          return (
            <Card
              key={lesson.id}
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors flex items-center gap-4"
              onClick={() => onSelectLesson(lesson.id)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isCompleted ? "bg-emerald-500/20 text-emerald-600" : isInProgress ? "bg-blue-500/20 text-blue-600" : "bg-muted text-muted-foreground"
              }`}>
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isInProgress ? <PlayCircle className="w-4 h-4" /> : <span className="text-xs font-medium">{i + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isCompleted ? "text-muted-foreground line-through" : ""}`}>{lesson.title}</p>
                <p className="text-xs text-muted-foreground">{lesson.estimatedMinutes} min</p>
              </div>
              {lesson.attachments && lesson.attachments.length > 0 && (
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </Card>
          );
        })}
      </div>

      {/* Quiz section */}
      {quiz && (
        <Card className={`p-5 border-2 ${allLessonsComplete ? "border-orange-500/30 bg-orange-500/5" : "border-border"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${allLessonsComplete ? "bg-orange-500/20" : "bg-muted"}`}>
              {allLessonsComplete ? <Trophy className="w-5 h-5 text-orange-600" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Prova Final</h4>
              <p className="text-xs text-muted-foreground">Nota mínima: {quiz.passingScore}% · {quiz.attemptsAllowed} tentativas · {attempts.length} usadas</p>
            </div>
            {passed && <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Aprovado</Badge>}
          </div>
          <Button
            className="w-full mt-4 gap-2"
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
        <Card className="p-5 border-2 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-500/20">
              <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Certificado Disponível</h4>
              <p className="text-xs text-muted-foreground">ID: {cert.certificateId}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onViewCertificate(cert.id)}>Ver Certificado</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
