import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Circle, PlayCircle, ClipboardCheck, Award, Loader2 } from "lucide-react";
import {
  useAcademyLessons, useAcademyProgress, useAcademyQuizzes,
  useAcademyQuizQuestions, useAcademyQuizAttempts, useAcademyMutations,
  computeModuleProgress, type DbLesson,
} from "@/hooks/useAcademy";
import { useAcademyModules } from "@/hooks/useAcademy";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

export function AcademyModulePlayer({ moduleId }: { moduleId: string }) {
  const { data: modules } = useAcademyModules();
  const { data: lessons } = useAcademyLessons(moduleId);
  const { data: progress } = useAcademyProgress();
  const { data: quizzes } = useAcademyQuizzes(moduleId);
  const { markLessonComplete, submitQuizAttempt, insertCertificate } = useAcademyMutations();

  const mod = modules?.find((m) => m.id === moduleId);
  const sortedLessons = (lessons ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const allProgress = progress ?? [];
  const modProgress = computeModuleProgress(moduleId, sortedLessons, allProgress);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(sortedLessons[0]?.id || null);
  const [showQuiz, setShowQuiz] = useState(false);

  const activeLesson = sortedLessons.find((l) => l.id === activeLessonId);
  const isLessonComplete = (id: string) => allProgress.some((p) => p.lesson_id === id && p.completed_at);
  const quiz = quizzes?.[0]; // one quiz per module
  const allLessonsComplete = sortedLessons.length > 0 && sortedLessons.every((l) => isLessonComplete(l.id));

  const handleMarkComplete = () => {
    if (!activeLessonId) return;
    markLessonComplete.mutate(activeLessonId, {
      onSuccess: () => {
        toast.success("Aula marcada como concluída!");
        // Auto-advance to next lesson
        const idx = sortedLessons.findIndex((l) => l.id === activeLessonId);
        if (idx < sortedLessons.length - 1) setActiveLessonId(sortedLessons[idx + 1].id);
      },
    });
  };

  if (showQuiz && quiz) {
    return <QuizView quizId={quiz.id} moduleId={moduleId} onBack={() => setShowQuiz(false)} />;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{mod?.title}</h2>
          <p className="text-xs text-muted-foreground">{mod?.description}</p>
        </div>
        <Badge variant="outline">{modProgress}% concluído</Badge>
      </div>
      <Progress value={modProgress} className="h-2" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Lesson list */}
        <div className="lg:col-span-1 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Aulas ({sortedLessons.length})</p>
          {sortedLessons.map((lesson, i) => {
            const done = isLessonComplete(lesson.id);
            const isActive = lesson.id === activeLessonId;
            return (
              <button
                key={lesson.id}
                onClick={() => { setActiveLessonId(lesson.id); setShowQuiz(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs transition-colors
                  ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"}
                `}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                )}
                <span className="truncate">{i + 1}. {lesson.title}</span>
                {lesson.duration_minutes ? (
                  <span className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap">{lesson.duration_minutes}min</span>
                ) : null}
              </button>
            );
          })}

          {quiz && allLessonsComplete && (
            <Button className="w-full mt-3 text-xs" onClick={() => setShowQuiz(true)}>
              <ClipboardCheck className="w-4 h-4 mr-1.5" /> Fazer Prova
            </Button>
          )}
        </div>

        {/* Video player */}
        <div className="lg:col-span-2">
          {activeLesson ? (
            <Card className="glass-card">
              <CardContent className="p-0">
                {activeLesson.video_url ? (
                  <div className="aspect-video rounded-t-lg overflow-hidden bg-black">
                    <iframe
                      src={getYouTubeEmbedUrl(activeLesson.video_url) || ""}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted/10 flex items-center justify-center rounded-t-lg">
                    <PlayCircle className="w-16 h-16 text-muted-foreground/20" />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <h3 className="text-sm font-bold">{activeLesson.title}</h3>
                  {activeLesson.content && (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{activeLesson.content}</p>
                  )}
                  {!isLessonComplete(activeLesson.id) && (
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={handleMarkComplete}
                      disabled={markLessonComplete.isPending}
                    >
                      {markLessonComplete.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                      Marcar como concluída
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              Selecione uma aula
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Quiz View =====
function QuizView({ quizId, moduleId, onBack }: { quizId: string; moduleId: string; onBack: () => void }) {
  const { data: questions } = useAcademyQuizQuestions(quizId);
  const { data: quizzes } = useAcademyQuizzes(moduleId);
  const { submitQuizAttempt, insertCertificate } = useAcademyMutations();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const quiz = quizzes?.find((q) => q.id === quizId);
  const sortedQuestions = (questions ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const handleSubmit = () => {
    if (!sortedQuestions.length) return;
    let correct = 0;
    sortedQuestions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) correct++;
    });
    const score = Math.round((correct / sortedQuestions.length) * 100);
    const passed = score >= (quiz?.passing_score ?? 70);

    submitQuizAttempt.mutate(
      { quizId, score, passed, answers: answers as unknown as Json },
      {
        onSuccess: () => {
          setResult({ score, passed });
          if (passed) {
            insertCertificate.mutate(moduleId);
            toast.success("Parabéns! Certificado emitido!");
          } else {
            toast.error(`Nota: ${score}%. Tente novamente.`);
          }
        },
      }
    );
  };

  if (result) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${result.passed ? "bg-primary/10" : "bg-destructive/10"}`}>
          {result.passed ? <Award className="w-10 h-10 text-primary" /> : <ClipboardCheck className="w-10 h-10 text-destructive" />}
        </div>
        <h3 className="text-lg font-bold">{result.passed ? "Aprovado!" : "Não aprovado"}</h3>
        <p className="text-2xl font-bold">{result.score}%</p>
        <p className="text-xs text-muted-foreground">
          {result.passed ? "Certificado emitido com sucesso." : `Mínimo necessário: ${quiz?.passing_score ?? 70}%`}
        </p>
        <Button variant="outline" onClick={onBack}>Voltar ao módulo</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">{quiz?.title || "Prova"}</h3>
        <Button variant="ghost" size="sm" className="text-xs" onClick={onBack}>← Voltar</Button>
      </div>

      {sortedQuestions.map((q, i) => {
        const options = Array.isArray(q.options) ? (q.options as string[]) : [];
        return (
          <Card key={q.id} className="glass-card">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-bold">{i + 1}. {q.question}</p>
              <RadioGroup
                value={answers[q.id]?.toString()}
                onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: Number(v) }))}
              >
                {options.map((opt, oi) => (
                  <div key={oi} className="flex items-center space-x-2">
                    <RadioGroupItem value={oi.toString()} id={`${q.id}-${oi}`} />
                    <Label htmlFor={`${q.id}-${oi}`} className="text-xs">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        );
      })}

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={submitQuizAttempt.isPending || Object.keys(answers).length < sortedQuestions.length}
      >
        {submitQuizAttempt.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Enviar Respostas
      </Button>
    </div>
  );
}
