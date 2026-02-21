import { ArrowLeft, ArrowRight, CheckCircle2, FileDown, Clock, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  mockModules,
  mockLessons,
  getLessonsByModule,
  getLessonProgress,
  markLessonComplete,
  getModuleProgress,
  getQuizByModule,
} from "@/data/academyData";
import { useState } from "react";

interface Props {
  lessonId: string;
  onBack: () => void;
  onNavigate: (lessonId: string) => void;
  onGoToQuiz: (quizId: string) => void;
}

export function AcademyLesson({ lessonId, onBack, onNavigate, onGoToQuiz }: Props) {
  const [, forceUpdate] = useState(0);
  const lesson = mockLessons.find((l) => l.id === lessonId);
  if (!lesson) return null;

  const mod = mockModules.find((m) => m.id === lesson.moduleId);
  const lessons = getLessonsByModule(lesson.moduleId);
  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  const prev = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const next = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const lp = getLessonProgress(lessonId);
  const isCompleted = lp?.status === "completed";
  const allComplete = getModuleProgress(lesson.moduleId) === 100;
  const moduleProgress = getModuleProgress(lesson.moduleId);

  const handleComplete = () => {
    markLessonComplete(lessonId);
    toast({ title: "Aula concluída!", description: `${lesson.title} marcada como concluída.` });
    forceUpdate((n) => n + 1);
  };

  return (
    <div className="animate-fade-in">
      {/* Mini progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <Progress value={moduleProgress} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground font-medium">{moduleProgress}%</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Main content — 70% */}
        <div className="flex-1 space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <button className="hover:text-foreground transition-colors" onClick={onBack}>NOE Academy</button>
            <span>/</span>
            <button className="hover:text-foreground transition-colors" onClick={onBack}>{mod?.title}</button>
            <span>/</span>
            <span className="text-foreground font-medium">{lesson.title}</span>
          </div>

          {/* YouTube embed with shadow */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-xl ring-1 ring-white/10">
            <iframe
              src={lesson.youtubeUrl}
              title={lesson.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Lesson info card */}
          <Card className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-bold">{lesson.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
                <Clock className="w-3 h-3" /> {lesson.estimatedMinutes} min
              </Badge>
            </div>

            {/* Attachments */}
            {lesson.attachments && lesson.attachments.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {lesson.attachments.map((att, i) => (
                  <Button key={i} variant="outline" size="sm" className="gap-2 text-xs">
                    <FileDown className="w-3.5 h-3.5" /> {att.name}
                  </Button>
                ))}
              </div>
            )}

            {/* Mark complete — prominent green button */}
            <Button
              size="lg"
              className={`w-full gap-2 text-base font-semibold transition-all ${
                isCompleted
                  ? ""
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25"
              }`}
              variant={isCompleted ? "outline" : "default"}
              disabled={isCompleted}
              onClick={handleComplete}
            >
              <CheckCircle2 className="w-5 h-5" />
              {isCompleted ? "✓ Concluída" : "Marcar como Concluída"}
            </Button>
          </Card>

          {/* Navigation — cards */}
          <div className="flex items-center justify-between pt-2 gap-3">
            {prev ? (
              <Card className="flex-1 p-3 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onNavigate(prev.id)}>
                <p className="text-[10px] text-muted-foreground">← Anterior</p>
                <p className="text-sm font-medium truncate">{prev.title}</p>
              </Card>
            ) : <div className="flex-1" />}
            {next ? (
              <Card className="flex-1 p-3 cursor-pointer hover:bg-accent/50 transition-colors text-right" onClick={() => onNavigate(next.id)}>
                <p className="text-[10px] text-muted-foreground">Próxima →</p>
                <p className="text-sm font-medium truncate">{next.title}</p>
              </Card>
            ) : allComplete ? (
              <Button size="sm" className="gap-1" onClick={() => {
                const quiz = getQuizByModule(lesson.moduleId);
                if (quiz) onGoToQuiz(quiz.id);
              }}>
                Ir para Prova <ArrowRight className="w-4 h-4" />
              </Button>
            ) : <div className="flex-1" />}
          </div>
        </div>

        {/* Sidebar — 30% lesson list */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <Card className="p-3 space-y-1 sticky top-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-2">Aulas do módulo</h4>
            {lessons.map((l, i) => {
              const lProgress = getLessonProgress(l.id);
              const completed = lProgress?.status === "completed";
              const isCurrent = l.id === lessonId;

              return (
                <button
                  key={l.id}
                  className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-sm ${
                    isCurrent
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                  onClick={() => onNavigate(l.id)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                    completed
                      ? "bg-emerald-500/15 text-emerald-600"
                      : isCurrent
                      ? "bg-primary/20 text-primary"
                      : "bg-muted"
                  }`}>
                    {completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className="truncate">{l.title}</span>
                </button>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
}
