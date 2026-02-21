import { useState } from "react";
import { ArrowLeft, ArrowRight, Clock, Trophy, XCircle, CheckCircle2, Target, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  mockModules,
  mockQuizzes,
  getQuestionsByQuiz,
  getQuizAttempts,
  submitQuizAttempt,
  getModuleProgress,
} from "@/data/academyData";

type Phase = "pre" | "active" | "result";

interface Props {
  quizId: string;
  onBack: () => void;
  onViewCertificate?: () => void;
}

export function AcademyQuiz({ quizId, onBack, onViewCertificate }: Props) {
  const [phase, setPhase] = useState<Phase>("pre");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lastResult, setLastResult] = useState<{ score: number; status: "passed" | "failed" } | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [, forceUpdate] = useState(0);

  const quiz = mockQuizzes.find((q) => q.id === quizId);
  if (!quiz) return null;

  const mod = mockModules.find((m) => m.id === quiz.moduleId);
  const questions = getQuestionsByQuiz(quizId);
  const attempts = getQuizAttempts(quizId);
  const allLessonsComplete = getModuleProgress(quiz.moduleId) === 100;
  const canAttempt = allLessonsComplete && attempts.length < quiz.attemptsAllowed;
  const alreadyPassed = attempts.some((a) => a.status === "passed");

  const handleStart = () => {
    setAnswers({});
    setCurrentQ(0);
    setLastResult(null);
    setShowFeedback(false);
    setPhase("active");
  };

  const handleSubmit = () => {
    let total = 0;
    let earned = 0;
    questions.forEach((q) => {
      total += q.points;
      if (answers[q.id] === q.correctAnswer) earned += q.points;
    });
    const score = Math.round((earned / total) * 100);
    const attempt = submitQuizAttempt(quizId, score);
    setLastResult({ score, status: attempt.status });
    setPhase("result");
    forceUpdate((n) => n + 1);
    if (attempt.status === "passed") {
      toast({ title: "Parabéns! Aprovado!", description: `Você foi aprovado com ${score}%!` });
    }
  };

  // PRE-QUIZ
  if (phase === "pre") {
    return (
      <div className="space-y-5 animate-fade-in">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        {/* Visual header card */}
        <Card className="relative overflow-hidden border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent p-6 space-y-5">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-orange-500/10 blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Prova: {mod?.title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Teste seus conhecimentos</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Nota mínima", value: `${quiz.passingScore}%` },
              { label: "Tentativas", value: `${attempts.length}/${quiz.attemptsAllowed}` },
              { label: "Questões", value: `${questions.length}` },
              ...(quiz.timeLimit ? [{ label: "Tempo", value: `${quiz.timeLimit} min` }] : []),
            ].map((item) => (
              <div key={item.label} className="bg-card/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold">{item.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Attempts timeline */}
          {attempts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Histórico</h4>
              <div className="flex gap-2 flex-wrap">
                {attempts.map((a) => (
                  <div key={a.attemptNumber} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                    a.status === "passed" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                  }`}>
                    <span className="font-semibold">#{a.attemptNumber}</span>
                    <span className="font-bold">{a.score}%</span>
                    {a.status === "passed" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button className="w-full" size="lg" disabled={!canAttempt && !alreadyPassed} onClick={handleStart}>
            {!allLessonsComplete ? "Conclua todas as aulas primeiro" : alreadyPassed ? "Refazer Prova" : canAttempt ? "Iniciar Prova" : "Sem tentativas restantes"}
          </Button>
        </Card>
      </div>
    );
  }

  // ACTIVE QUIZ
  if (phase === "active") {
    const q = questions[currentQ];
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Questão {currentQ + 1} de {questions.length}</span>
          </div>
          <Badge variant="secondary">{q.points} pts</Badge>
        </div>

        {/* Question indicators */}
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i === currentQ ? "bg-primary" : answers[questions[i].id] ? "bg-primary/40" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Question card */}
        <Card className="p-6">
          <p className="text-lg font-semibold mb-5">{q.prompt}</p>

          {/* Options as clickable cards */}
          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              const isSelected = answers[q.id] === opt;
              return (
                <button
                  key={i}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                      : "border-border hover:border-primary/30 hover:bg-accent/50"
                  }`}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    {opt}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="flex justify-between">
          <Button variant="ghost" disabled={currentQ === 0} onClick={() => setCurrentQ(currentQ - 1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          {currentQ < questions.length - 1 ? (
            <Button onClick={() => setCurrentQ(currentQ + 1)} disabled={!answers[q.id]}>
              Próxima <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={answeredCount < questions.length} size="lg" className="gap-2">
              Finalizar Prova <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // RESULT
  const isPassed = lastResult?.status === "passed";

  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto">
      <Card className={`p-8 text-center space-y-5 border-2 ${isPassed ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent" : "border-destructive/30 bg-gradient-to-br from-destructive/10 to-transparent"}`}>
        {/* Score circle */}
        <div className="flex justify-center">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="48" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle cx="56" cy="56" r="48" fill="none" stroke={isPassed ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${((lastResult?.score ?? 0) / 100) * 301.6} 301.6`} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{lastResult?.score}%</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold">{isPassed ? "Aprovado!" : "Reprovado"}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isPassed ? "Parabéns! Você atingiu a nota mínima." : `Nota mínima: ${quiz.passingScore}%. Tente novamente.`}
          </p>
        </div>

        {/* Feedback toggle */}
        {quiz.showFeedback && (
          <Button variant="outline" size="sm" onClick={() => setShowFeedback(!showFeedback)}>
            {showFeedback ? "Ocultar detalhes" : "Ver detalhamento"}
          </Button>
        )}
      </Card>

      {/* Feedback details in collapsible section */}
      {showFeedback && quiz.showFeedback && (
        <div className="space-y-2 animate-fade-in">
          {questions.map((q) => {
            const correct = answers[q.id] === q.correctAnswer;
            return (
              <Card key={q.id} className={`p-4 text-sm border-l-4 ${correct ? "border-l-emerald-500 bg-emerald-500/5" : "border-l-destructive bg-destructive/5"}`}>
                <div className="flex items-start gap-2">
                  {correct ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />}
                  <div>
                    <span className="font-medium">{q.prompt}</span>
                    {!correct && <p className="text-xs text-muted-foreground mt-1">Resposta correta: {q.correctAnswer}</p>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>Voltar ao Módulo</Button>
        {isPassed && onViewCertificate && (
          <Button className="flex-1 gap-2" onClick={onViewCertificate}>
            <Award className="w-4 h-4" /> Ver Certificado
          </Button>
        )}
      </div>
    </div>
  );
}
