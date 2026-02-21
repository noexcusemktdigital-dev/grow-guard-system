import { ArrowLeft, ArrowRight, CheckCircle2, FileDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const handleComplete = () => {
    markLessonComplete(lessonId);
    toast({ title: "Aula concluída!", description: `${lesson.title} marcada como concluída.` });
    forceUpdate((n) => n + 1);
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <button className="hover:text-foreground transition-colors" onClick={onBack}>NOE Academy</button>
        <span>/</span>
        <button className="hover:text-foreground transition-colors" onClick={onBack}>{mod?.title}</button>
        <span>/</span>
        <span className="text-foreground font-medium">{lesson.title}</span>
      </div>

      {/* YouTube embed */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          src={lesson.youtubeUrl}
          title={lesson.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Lesson info */}
      <div className="space-y-3">
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

        {/* Mark complete */}
        <Button
          size="lg"
          className="w-full gap-2"
          variant={isCompleted ? "outline" : "default"}
          disabled={isCompleted}
          onClick={handleComplete}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isCompleted ? "Concluída" : "Marcar como Concluída"}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        {prev ? (
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => onNavigate(prev.id)}>
            <ArrowLeft className="w-4 h-4" /> {prev.title}
          </Button>
        ) : <div />}
        {next ? (
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => onNavigate(next.id)}>
            {next.title} <ArrowRight className="w-4 h-4" />
          </Button>
        ) : allComplete ? (
          <Button size="sm" className="gap-1" onClick={() => {
            const quiz = getQuizByModule(lesson.moduleId);
            if (quiz) onGoToQuiz(quiz.id);
          }}>
            Ir para Prova <ArrowRight className="w-4 h-4" />
          </Button>
        ) : <div />}
      </div>
    </div>
  );
}
