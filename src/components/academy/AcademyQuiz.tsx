import { useState } from "react";
import { ArrowLeft, ArrowRight, Clock, Trophy, XCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  mockModules,
  mockQuizzes,
  getQuestionsByQuiz,
  getQuizAttempts,
  submitQuizAttempt,
  getModuleProgress,
  getLessonsByModule,
  getLessonProgress,
} from "@/data/academyData";

type Phase = "pre" | "active" | "result";

interface Props {
  quizId: string;
  onBack: () => void;
  onViewCertificate?: () => void;
}

export function AcademyQuiz({ quizId, onBack, onViewCertificate }: Props) {
  const quiz = mockQuizzes.find((q) => q.id === quizId);
  if (!quiz) return null;

  const mod = mockModules.find((m) => m.id === quiz.moduleId);
  const questions = getQuestionsByQuiz(quizId);
  const [phase, setPhase] = useState<Phase>("pre");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lastResult, setLastResult] = useState<{ score: number; status: "passed" | "failed" } | null>(null);
  const [, forceUpdate] = useState(0);

  const attempts = getQuizAttempts(quizId);
  const allLessonsComplete = getModuleProgress(quiz.moduleId) === 100;
  const canAttempt = allLessonsComplete && attempts.length < quiz.attemptsAllowed;
  const alreadyPassed = attempts.some((a) => a.status === "passed");

  const handleStart = () => {
    setAnswers({});
    setCurrentQ(0);
    setLastResult(null);
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
      toast({ title: "Parabéns! 🎉", description: `Você foi aprovado com ${score}%!` });
    }
  };

  // PRE-QUIZ
  if (phase === "pre") {
    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Prova: {mod?.title}</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Nota mínima:</span> <strong>{quiz.passingScore}%</strong></div>
            <div><span className="text-muted-foreground">Tentativas:</span> <strong>{attempts.length}/{quiz.attemptsAllowed}</strong></div>
            <div><span className="text-muted-foreground">Questões:</span> <strong>{questions.length}</strong></div>
            {quiz.timeLimit && <div><span className="text-muted-foreground">Tempo:</span> <strong>{quiz.timeLimit} min</strong></div>}
          </div>

          {attempts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Histórico</h4>
              {attempts.map((a) => (
                <div key={a.attemptNumber} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                  <span>Tentativa {a.attemptNumber}</span>
                  <span className="font-medium">{a.score}%</span>
                  <Badge variant={a.status === "passed" ? "default" : "destructive"} className="text-[10px]">
                    {a.status === "passed" ? "Aprovado" : "Reprovado"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <Button className="w-full" disabled={!canAttempt && !alreadyPassed} onClick={handleStart}>
            {!allLessonsComplete ? "Conclua todas as aulas primeiro" : alreadyPassed ? "Refazer Prova" : canAttempt ? "Iniciar Prova" : "Sem tentativas restantes"}
          </Button>
        </Card>
      </div>
    );
  }

  // ACTIVE QUIZ
  if (phase === "active") {
    const q = questions[currentQ];
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Questão {currentQ + 1} de {questions.length}</h3>
          <Badge variant="secondary">{q.points} pts</Badge>
        </div>
        <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1.5" />

        <Card className="p-6">
          <p className="font-medium mb-4">{q.prompt}</p>
          <RadioGroup value={answers[q.id] || ""} onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}>
            {q.options.map((opt, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
                <Label htmlFor={`${q.id}-${i}`} className="cursor-pointer flex-1">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
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
            <Button onClick={handleSubmit} disabled={Object.keys(answers).length < questions.length}>
              Finalizar Prova
            </Button>
          )}
        </div>
      </div>
    );
  }

  // RESULT
  return (
    <div className="space-y-5">
      <Card className={`p-8 text-center space-y-4 border-2 ${lastResult?.status === "passed" ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${lastResult?.status === "passed" ? "bg-emerald-500/20" : "bg-destructive/20"}`}>
          {lastResult?.status === "passed" ? <Trophy className="w-8 h-8 text-emerald-600" /> : <XCircle className="w-8 h-8 text-destructive" />}
        </div>
        <h2 className="text-2xl font-bold">{lastResult?.status === "passed" ? "Aprovado! 🎉" : "Reprovado"}</h2>
        <p className="text-4xl font-bold">{lastResult?.score}%</p>
        <p className="text-sm text-muted-foreground">
          {lastResult?.status === "passed" ? "Parabéns! Você atingiu a nota mínima." : `Nota mínima: ${quiz.passingScore}%. Tente novamente.`}
        </p>

        {quiz.showFeedback && (
          <div className="text-left space-y-2 mt-4">
            <h4 className="font-semibold text-sm">Detalhamento</h4>
            {questions.map((q) => {
              const correct = answers[q.id] === q.correctAnswer;
              return (
                <div key={q.id} className={`p-3 rounded-lg text-sm ${correct ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                  <div className="flex items-center gap-2">
                    {correct ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-destructive" />}
                    <span className="font-medium">{q.prompt}</span>
                  </div>
                  {!correct && <p className="text-xs text-muted-foreground mt-1 ml-6">Resposta correta: {q.correctAnswer}</p>}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>Voltar ao Módulo</Button>
        {lastResult?.status === "passed" && onViewCertificate && (
          <Button className="flex-1" onClick={onViewCertificate}>Ver Certificado</Button>
        )}
      </div>
    </div>
  );
}
