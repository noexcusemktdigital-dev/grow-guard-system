import { useState } from "react";
import { ClipboardCheck, Lock, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAcademyModules, useAcademyQuizzes, useAcademyLessons,
  useAcademyProgress, useAcademyQuizAttempts, computeModuleProgress,
  type DbModule, type DbQuiz, type DbQuizAttempt,
} from "@/hooks/useAcademy";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  onStartQuiz: (moduleId: string) => void;
}

type QuizStatus = "locked" | "available" | "passed" | "failed" | "no_quiz";

const statusConfig: Record<Exclude<QuizStatus, "no_quiz">, { label: string; icon: React.ElementType; color: string }> = {
  locked:    { label: "Bloqueada",  icon: Lock,         color: "text-muted-foreground" },
  available: { label: "Disponível", icon: ClipboardCheck, color: "text-orange-500" },
  passed:    { label: "Aprovado",   icon: CheckCircle2, color: "text-emerald-500" },
  failed:    { label: "Reprovado",  icon: XCircle,      color: "text-destructive" },
};

export function AcademyQuizList({ onStartQuiz }: Props) {
  const { data: modules, isLoading: loadingModules } = useAcademyModules();
  const { data: quizzes, isLoading: loadingQuizzes } = useAcademyQuizzes();
  const { data: lessons } = useAcademyLessons();
  const { data: progress } = useAcademyProgress();
  const { data: attempts } = useAcademyQuizAttempts();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  if (loadingModules || loadingQuizzes) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>;
  }

  const published = (modules ?? []).filter(m => m.is_published);
  const allLessons = lessons ?? [];
  const allProgress = progress ?? [];
  const allAttempts = attempts ?? [];
  const allQuizzes = quizzes ?? [];

  const getQuizForModule = (moduleId: string): DbQuiz | undefined =>
    allQuizzes.find(q => q.module_id === moduleId);

  const getAttemptsForQuiz = (quizId: string): DbQuizAttempt[] =>
    allAttempts.filter(a => a.quiz_id === quizId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStatus = (mod: DbModule): QuizStatus => {
    const quiz = getQuizForModule(mod.id);
    if (!quiz) return "no_quiz";
    const prog = computeModuleProgress(mod.id, allLessons, allProgress);
    if (prog < 100) return "locked";
    const att = getAttemptsForQuiz(quiz.id);
    if (att.length === 0) return "available";
    return att[0].passed ? "passed" : "failed";
  };

  const categoryBadge: Record<string, string> = {
    Comercial: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    Estrategia: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    Institucional: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    Produtos: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  };

  if (published.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Nenhum módulo publicado ainda.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {published.map(mod => {
        const quiz = getQuizForModule(mod.id);
        const status = getStatus(mod);
        const modLessons = allLessons.filter(l => l.module_id === mod.id);
        const completedCount = modLessons.filter(l => allProgress.some(p => p.lesson_id === l.id && p.completed_at)).length;
        const prog = modLessons.length > 0 ? Math.round((completedCount / modLessons.length) * 100) : 0;
        const quizAttempts = quiz ? getAttemptsForQuiz(quiz.id) : [];
        const isExpanded = expandedModule === mod.id;

        return (
          <Card key={mod.id} className="overflow-hidden">
            <div className="p-4 flex items-center gap-4">
              {/* Status icon */}
              <div className="flex-shrink-0">
                {status === "no_quiz" ? (
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    status === "passed" ? "bg-emerald-500/15" :
                    status === "failed" ? "bg-destructive/15" :
                    status === "available" ? "bg-orange-500/15" : "bg-muted"
                  }`}>
                    {(() => { const Icon = statusConfig[status].icon; return <Icon className={`w-5 h-5 ${statusConfig[status].color}`} />; })()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold truncate">{mod.title}</span>
                  {mod.category && (
                    <Badge variant="secondary" className={`text-[10px] ${categoryBadge[mod.category] ?? ""}`}>
                      {mod.category}
                    </Badge>
                  )}
                  {status !== "no_quiz" && (
                    <Badge variant="outline" className={`text-[10px] ${statusConfig[status].color}`}>
                      {statusConfig[status].label}
                      {status === "passed" && quizAttempts[0] && ` (${quizAttempts[0].score}%)`}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={prog} className="h-1.5 flex-1 max-w-[200px]" />
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {completedCount}/{modLessons.length} aulas
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {status === "no_quiz" ? (
                  <span className="text-[11px] text-muted-foreground">Sem prova</span>
                ) : status === "locked" ? (
                  <span className="text-[11px] text-muted-foreground">Complete as aulas</span>
                ) : (
                  <Button size="sm" variant={status === "passed" ? "outline" : "default"} onClick={() => onStartQuiz(mod.id)} className="text-xs gap-1.5">
                    <Play className="w-3.5 h-3.5" />
                    {status === "passed" ? "Refazer" : status === "failed" ? "Tentar novamente" : "Iniciar prova"}
                  </Button>
                )}
                {quizAttempts.length > 0 && (
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setExpandedModule(isExpanded ? null : mod.id)} aria-label="Recolher">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </div>

            {/* Attempt history */}
            {isExpanded && quizAttempts.length > 0 && (
              <div className="border-t bg-muted/30 px-4 py-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Histórico de tentativas</p>
                <div className="space-y-1.5">
                  {quizAttempts.map((att, idx) => (
                    <div key={att.id} className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground w-5">#{quizAttempts.length - idx}</span>
                      <span className={att.passed ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-destructive font-medium"}>
                        {att.passed ? "Aprovado" : "Reprovado"}
                      </span>
                      <span className="font-mono">{att.score}%</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(att.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
