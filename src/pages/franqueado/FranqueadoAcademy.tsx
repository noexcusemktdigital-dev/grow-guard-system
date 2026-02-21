import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { KpiCard } from "@/components/KpiCard";
import { toast } from "sonner";
import {
  GraduationCap, PlayCircle, Award, BookOpen, ChevronRight, ChevronLeft,
  ArrowLeft, CheckCircle2, Lock, Play, Download, FileText, ClipboardCheck,
} from "lucide-react";
import {
  mockModules, mockLessons, AcademyModule, AcademyLesson, AcademyModuleCategory,
  getLessonsByModule, getModuleProgress, getLessonProgress,
  getQuizByModule, getQuestionsByQuiz, getQuizAttempts,
  getUserCertificates, markLessonComplete, submitQuizAttempt,
  getTotalProgress, categoryColors,
} from "@/data/academyData";

type View = "modules" | "module-detail" | "lesson" | "quiz";

const categoryFilterOptions: (AcademyModuleCategory | "Todos")[] = ["Todos", "Comercial", "Estrategia", "Institucional", "Produtos"];
const categoryLabels: Record<string, string> = {
  Todos: "Todos",
  Comercial: "Comercial",
  Estrategia: "Estratégia",
  Institucional: "Institucional",
  Produtos: "Produtos",
};

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/20 text-blue-400 border-blue-400/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-400/30",
  emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-400/30",
  orange: "bg-orange-500/20 text-orange-400 border-orange-400/30",
};

function getStatusLabel(progress: number) {
  if (progress === 0) return { label: "Não iniciado", className: "bg-muted/20 text-muted-foreground" };
  if (progress === 100) return { label: "Concluído", className: "bg-green-500/20 text-green-400 border-green-400/30" };
  return { label: "Em andamento", className: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30" };
}

export default function FranqueadoAcademy() {
  const [view, setView] = useState<View>("modules");
  const [categoryFilter, setCategoryFilter] = useState<AcademyModuleCategory | "Todos">("Todos");
  const [selectedModule, setSelectedModule] = useState<AcademyModule | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<AcademyLesson | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [, forceUpdate] = useState(0);

  const refresh = () => forceUpdate((n) => n + 1);

  const publishedModules = mockModules.filter((m) => m.status === "published");
  const filteredModules = categoryFilter === "Todos"
    ? publishedModules
    : publishedModules.filter((m) => m.category === categoryFilter);

  const totalLessons = mockLessons.length;
  const completedLessons = mockLessons.filter((l) => {
    const p = getLessonProgress(l.id);
    return p?.status === "completed";
  }).length;
  const totalProgress = getTotalProgress();
  const certificates = getUserCertificates();

  // Module detail helpers
  const moduleLessons = selectedModule ? getLessonsByModule(selectedModule.id) : [];
  const moduleProgress = selectedModule ? getModuleProgress(selectedModule.id) : 0;
  const moduleQuiz = selectedModule ? getQuizByModule(selectedModule.id) : undefined;
  const quizQuestions = moduleQuiz ? getQuestionsByQuiz(moduleQuiz.id) : [];
  const quizAttempts = moduleQuiz ? getQuizAttempts(moduleQuiz.id) : [];
  const quizPassed = quizAttempts.some((a) => a.status === "passed");
  const allLessonsComplete = moduleLessons.every((l) => getLessonProgress(l.id)?.status === "completed");

  // Lesson navigation
  const lessonIndex = selectedLesson ? moduleLessons.findIndex((l) => l.id === selectedLesson.id) : -1;

  const openModule = (mod: AcademyModule) => {
    setSelectedModule(mod);
    setView("module-detail");
    setQuizResult(null);
    setQuizAnswers({});
  };

  const openLesson = (lesson: AcademyLesson) => {
    setSelectedLesson(lesson);
    setView("lesson");
  };

  const openQuiz = () => {
    setQuizAnswers({});
    setQuizResult(null);
    setView("quiz");
  };

  const goBackToModules = () => {
    setView("modules");
    setSelectedModule(null);
    setSelectedLesson(null);
  };

  const goBackToDetail = () => {
    setView("module-detail");
    setSelectedLesson(null);
  };

  const handleMarkComplete = () => {
    if (!selectedLesson) return;
    markLessonComplete(selectedLesson.id);
    toast.success("Aula marcada como concluída!");
    refresh();
  };

  const handleSubmitQuiz = () => {
    if (!moduleQuiz) return;
    let score = 0;
    const totalPoints = quizQuestions.reduce((s, q) => s + q.points, 0);
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctAnswer) score += q.points;
    });
    const finalScore = Math.round((score / totalPoints) * 100);
    const result = submitQuizAttempt(moduleQuiz.id, finalScore);
    setQuizResult({ score: finalScore, passed: result.status === "passed" });
    if (result.status === "passed") {
      toast.success("Parabéns! Você foi aprovado!");
    } else {
      toast.error("Não atingiu a nota mínima. Tente novamente.");
    }
    refresh();
  };

  // ─── MODULES LIST ──────────────────────────────────
  if (view === "modules") {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title="Academy e Treinamentos" subtitle="Trilhas de aprendizado e certificações da rede" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Módulos Disponíveis" value={String(publishedModules.length)} icon={BookOpen} delay={0} />
          <KpiCard label="Aulas Concluídas" value={`${completedLessons}/${totalLessons}`} icon={PlayCircle} delay={1} />
          <KpiCard label="Progresso Geral" value={`${totalProgress}%`} icon={GraduationCap} delay={2} variant="accent" />
          <KpiCard label="Certificados" value={String(certificates.length)} icon={Award} delay={3} />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {categoryFilterOptions.map((cat) => (
            <Badge
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              className="cursor-pointer text-xs px-3 py-1"
              onClick={() => setCategoryFilter(cat)}
            >
              {categoryLabels[cat]}
            </Badge>
          ))}
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModules.map((mod) => {
            const progress = getModuleProgress(mod.id);
            const status = getStatusLabel(progress);
            const color = categoryColors[mod.category];
            return (
              <Card key={mod.id} className="glass-card hover-lift cursor-pointer group" onClick={() => openModule(mod)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={colorMap[color] || ""}>{categoryLabels[mod.category]}</Badge>
                        <Badge className={status.className}>{status.label}</Badge>
                      </div>
                      <h3 className="text-sm font-bold">{mod.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
                    <span>{mod.lessonsCount} aulas</span>
                    <span>·</span>
                    <span>{mod.estimatedHours}h estimadas</span>
                  </div>
                  <Progress value={progress} className="h-2 mb-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{progress}% concluído</span>
                    <Button variant="ghost" size="sm" className="text-xs group-hover:text-primary transition-colors">
                      {progress === 0 ? "Iniciar" : progress === 100 ? "Revisar" : "Continuar"}
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Certificates */}
        {certificates.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" /> Meus Certificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {certificates.map((c) => {
                  const mod = mockModules.find((m) => m.id === c.moduleId);
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
                      <div>
                        <p className="text-sm font-medium">{mod?.title || c.moduleId}</p>
                        <p className="text-xs text-muted-foreground">
                          Emitido em {new Date(c.issuedAt).toLocaleDateString("pt-BR")} · {c.certificateId}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-3.5 h-3.5 mr-1" /> PDF
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ─── MODULE DETAIL ─────────────────────────────────
  if (view === "module-detail" && selectedModule) {
    const color = categoryColors[selectedModule.category];
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={goBackToModules} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={colorMap[color] || ""}>{categoryLabels[selectedModule.category]}</Badge>
            {quizPassed && <Badge className="bg-green-500/20 text-green-400 border-green-400/30">Aprovado</Badge>}
          </div>
          <h1 className="text-xl font-bold">{selectedModule.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{selectedModule.description}</p>
          <div className="flex items-center gap-2 mt-3">
            <Progress value={moduleProgress} className="h-2 flex-1" />
            <span className="text-xs font-medium">{moduleProgress}%</span>
          </div>
        </div>

        {/* Lesson List */}
        <div className="space-y-2">
          {moduleLessons.map((lesson, i) => {
            const lp = getLessonProgress(lesson.id);
            const isComplete = lp?.status === "completed";
            return (
              <Card key={lesson.id} className="glass-card hover-lift cursor-pointer" onClick={() => openLesson(lesson)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isComplete ? "bg-green-500/20" : "bg-muted/20"
                  }`}>
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <Play className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {i + 1}. {lesson.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{lesson.estimatedMinutes} min</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    {isComplete ? "Revisar" : "Assistir"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          {/* Quiz entry */}
          <Card className={`glass-card ${!allLessonsComplete ? "opacity-50" : "hover-lift cursor-pointer"}`}
            onClick={allLessonsComplete && !quizPassed ? openQuiz : undefined}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                quizPassed ? "bg-green-500/20" : !allLessonsComplete ? "bg-muted/10" : "bg-primary/20"
              }`}>
                {quizPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : !allLessonsComplete ? (
                  <Lock className="w-4 h-4 text-muted-foreground/50" />
                ) : (
                  <ClipboardCheck className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Prova Final</p>
                <p className="text-xs text-muted-foreground">
                  {quizPassed
                    ? `Aprovado · Nota: ${quizAttempts.find((a) => a.status === "passed")?.score}%`
                    : !allLessonsComplete
                      ? "Complete todas as aulas para desbloquear"
                      : `Nota mínima: ${moduleQuiz?.passingScore}% · ${moduleQuiz?.attemptsAllowed} tentativas`}
                </p>
              </div>
              {quizPassed && (
                <Badge className="bg-green-500/20 text-green-400 border-green-400/30">Aprovado</Badge>
              )}
              {allLessonsComplete && !quizPassed && (
                <Button variant="default" size="sm" className="text-xs">Fazer Prova</Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── LESSON VIEW ───────────────────────────────────
  if (view === "lesson" && selectedLesson && selectedModule) {
    const lp = getLessonProgress(selectedLesson.id);
    const isComplete = lp?.status === "completed";

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={goBackToDetail} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao módulo
        </Button>

        <div>
          <p className="text-xs text-muted-foreground mb-1">{selectedModule.title}</p>
          <h1 className="text-xl font-bold">{selectedLesson.title}</h1>
        </div>

        {/* Video */}
        <div className="aspect-video rounded-xl overflow-hidden bg-black">
          <iframe
            src={selectedLesson.youtubeUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={selectedLesson.title}
          />
        </div>

        <p className="text-sm text-muted-foreground">{selectedLesson.description}</p>

        {/* Attachments */}
        {selectedLesson.attachments && selectedLesson.attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Anexos</p>
            {selectedLesson.attachments.map((att, i) => (
              <Button key={i} variant="outline" size="sm" className="mr-2">
                <FileText className="w-3.5 h-3.5 mr-1" /> {att.name}
              </Button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {lessonIndex > 0 && (
              <Button variant="outline" size="sm" onClick={() => openLesson(moduleLessons[lessonIndex - 1])}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Anterior
              </Button>
            )}
            {lessonIndex < moduleLessons.length - 1 && (
              <Button variant="outline" size="sm" onClick={() => openLesson(moduleLessons[lessonIndex + 1])}>
                Próxima <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
          {!isComplete && (
            <Button onClick={handleMarkComplete}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar como Concluída
            </Button>
          )}
          {isComplete && (
            <Badge className="bg-green-500/20 text-green-400 border-green-400/30">Concluída</Badge>
          )}
        </div>
      </div>
    );
  }

  // ─── QUIZ VIEW ─────────────────────────────────────
  if (view === "quiz" && selectedModule && moduleQuiz) {
    const remainingAttempts = moduleQuiz.attemptsAllowed - quizAttempts.length;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={goBackToDetail} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao módulo
        </Button>

        <div>
          <h1 className="text-xl font-bold">Prova Final – {selectedModule.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Nota mínima: {moduleQuiz.passingScore}% · Tentativas restantes: {remainingAttempts}
            {moduleQuiz.timeLimit && ` · Tempo: ${moduleQuiz.timeLimit} min`}
          </p>
        </div>

        {quizResult ? (
          <Card className="glass-card">
            <CardContent className="p-6 text-center space-y-4">
              <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
                quizResult.passed ? "bg-green-500/20" : "bg-red-500/20"
              }`}>
                {quizResult.passed ? (
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                ) : (
                  <ClipboardCheck className="w-10 h-10 text-red-400" />
                )}
              </div>
              <h2 className="text-2xl font-bold">{quizResult.score}%</h2>
              <p className="text-sm font-medium">
                {quizResult.passed ? "Parabéns! Você foi aprovado!" : "Não atingiu a nota mínima."}
              </p>
              {!quizResult.passed && remainingAttempts > 0 && (
                <Button onClick={() => { setQuizResult(null); setQuizAnswers({}); }}>
                  Tentar Novamente
                </Button>
              )}
              {quizResult.passed && (
                <Button variant="outline" onClick={goBackToDetail}>
                  Ver Certificado
                </Button>
              )}
              {!quizResult.passed && remainingAttempts <= 0 && (
                <p className="text-xs text-muted-foreground">Sem tentativas restantes.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-6">
              {quizQuestions.map((q, i) => (
                <Card key={q.id} className="glass-card">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium mb-3">
                      {i + 1}. {q.prompt}
                    </p>
                    <RadioGroup
                      value={quizAnswers[q.id] || ""}
                      onValueChange={(val) => setQuizAnswers((prev) => ({ ...prev, [q.id]: val }))}
                    >
                      {q.options.map((opt) => (
                        <div key={opt} className="flex items-center space-x-2 py-1">
                          <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                          <Label htmlFor={`${q.id}-${opt}`} className="text-sm cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              className="w-full"
              disabled={Object.keys(quizAnswers).length < quizQuestions.length}
              onClick={handleSubmitQuiz}
            >
              Enviar Respostas
            </Button>
          </>
        )}
      </div>
    );
  }

  return null;
}
