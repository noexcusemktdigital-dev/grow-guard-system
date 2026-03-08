import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, PlayCircle, BookOpen, Award, Inbox, ChevronRight, Clock, Trophy, FileQuestion, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  useAcademyModules, useAcademyLessons, useAcademyProgress, useAcademyCertificates,
  useAcademyQuizzes, useAcademyQuizAttempts,
  computeModuleProgress, computeTotalProgress,
} from "@/hooks/useAcademy";
import { AcademyModulePlayer } from "@/components/academy/AcademyModulePlayer";
import { AcademyEvolution } from "@/components/academy/AcademyEvolution";
import { AcademyRanking } from "@/components/academy/AcademyRanking";
import { AcademyQuiz } from "@/components/academy/AcademyQuiz";
import { format } from "date-fns";

export default function FranqueadoAcademy() {
  const { data: modules, isLoading } = useAcademyModules();
  const { data: lessons } = useAcademyLessons();
  const { data: progress } = useAcademyProgress();
  const { data: certificates } = useAcademyCertificates();
  const { data: quizzes } = useAcademyQuizzes();
  const { data: quizAttempts } = useAcademyQuizAttempts();
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const published = (modules ?? []).filter((m) => m.is_published);
  const allLessons = lessons ?? [];
  const allProgress = progress ?? [];
  const allCerts = certificates ?? [];
  const allQuizzes = quizzes ?? [];
  const allAttempts = quizAttempts ?? [];
  const totalProgress = computeTotalProgress(allLessons, allProgress);
  const completedLessons = allLessons.filter((l) => allProgress.some((p) => p.lesson_id === l.id && p.completed_at)).length;
  const completedModules = published.filter((m) => computeModuleProgress(m.id, allLessons, allProgress) === 100).length;

  // Quiz view
  if (activeQuizId) {
    return (
      <div className="w-full">
        <AcademyQuiz quizId={activeQuizId} onBack={() => setActiveQuizId(null)} />
      </div>
    );
  }

  // Module player
  if (selectedModuleId) {
    return (
      <div className="w-full">
        <Button variant="ghost" size="sm" className="mb-4 text-xs" onClick={() => setSelectedModuleId(null)}>
          ← Voltar às trilhas
        </Button>
        <AcademyModulePlayer moduleId={selectedModuleId} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader title="NOE Academy" subtitle="Plataforma de treinamentos e certificações da rede" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Módulos Disponíveis" value={String(published.length)} icon={BookOpen} delay={0} />
        <KpiCard label="Aulas Concluídas" value={`${completedLessons}/${allLessons.length}`} icon={PlayCircle} delay={1} />
        <KpiCard label="Progresso Geral" value={`${totalProgress}%`} icon={GraduationCap} delay={2} variant="accent" />
        <KpiCard label="Certificados" value={String(allCerts.length)} icon={Award} delay={3} />
      </div>

      <Tabs defaultValue="trilhas" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="trilhas">Trilhas</TabsTrigger>
          <TabsTrigger value="provas">Provas</TabsTrigger>
          <TabsTrigger value="evolucao">Minha Evolução</TabsTrigger>
          <TabsTrigger value="certificados">Certificados</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        {/* ===== TRILHAS ===== */}
        <TabsContent value="trilhas" className="mt-6">
          {published.length === 0 ? (
            <div className="text-center py-16">
              <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Nenhum módulo disponível</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {published.map((mod) => {
                const modProgress = computeModuleProgress(mod.id, allLessons, allProgress);
                const modLessons = allLessons.filter((l) => l.module_id === mod.id);
                const totalMin = modLessons.reduce((s, l) => s + (l.duration_minutes || 0), 0);

                return (
                  <Card
                    key={mod.id}
                    className="glass-card hover-lift cursor-pointer group overflow-hidden"
                    onClick={() => setSelectedModuleId(mod.id)}
                  >
                    {mod.thumbnail_url && (
                      <div className="aspect-video bg-muted/10 overflow-hidden">
                        <img src={mod.thumbnail_url} alt={mod.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {mod.category && <Badge variant="outline" className="text-[10px]">{mod.category}</Badge>}
                        {mod.difficulty && <Badge variant="secondary" className="text-[10px]">{mod.difficulty}</Badge>}
                      </div>
                      <h3 className="text-sm font-bold">{mod.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mod.description}</p>

                      <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><PlayCircle className="w-3 h-3" />{modLessons.length} aulas</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{totalMin} min</span>
                      </div>

                      <Progress value={modProgress} className="h-2 mt-3 mb-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{modProgress}% concluído</span>
                        <Button variant="ghost" size="sm" className="text-xs group-hover:text-primary transition-colors">
                          {modProgress === 0 ? "Iniciar" : modProgress === 100 ? "Revisar" : "Continuar"}
                          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== PROVAS ===== */}
        <TabsContent value="provas" className="mt-6">
          {(() => {
            const modulesWithQuiz = published.filter((m) => allQuizzes.some((q) => q.module_id === m.id));
            if (modulesWithQuiz.length === 0) {
              return (
                <div className="text-center py-16">
                  <FileQuestion className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Nenhuma prova disponível</p>
                  <p className="text-xs text-muted-foreground mt-1">As provas serão liberadas conforme seus módulos avançarem.</p>
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modulesWithQuiz.map((mod) => {
                  const quiz = allQuizzes.find((q) => q.module_id === mod.id)!;
                  const modProgress = computeModuleProgress(mod.id, allLessons, allProgress);
                  const attempts = allAttempts.filter((a) => a.quiz_id === quiz.id);
                  const passed = attempts.some((a) => a.passed);
                  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;

                  return (
                    <Card key={mod.id} className={`hover-lift cursor-pointer group overflow-hidden border-2 ${passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"}`} onClick={() => setActiveQuizId(quiz.id)}>
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${passed ? "bg-emerald-500/20" : "bg-orange-500/20"}`}>
                            {passed ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <FileQuestion className="w-6 h-6 text-orange-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold truncate">{mod.title}</h3>
                            <p className="text-[10px] text-muted-foreground">Nota mínima: {quiz.passing_score ?? 70}%</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant={modProgress === 100 ? "default" : "secondary"} className="text-[10px]">
                            {modProgress === 100 ? "Aulas concluídas" : `${modProgress}% das aulas`}
                          </Badge>
                          {passed && <Badge className="text-[10px] bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30">Aprovado</Badge>}
                        </div>

                        {attempts.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {attempts.map((a, i) => (
                              <div key={a.id} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${a.passed ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                                #{i + 1}: {a.score}%
                                {a.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              </div>
                            ))}
                          </div>
                        )}

                        {bestScore !== null && (
                          <div className="text-xs text-muted-foreground">Melhor nota: <strong>{bestScore}%</strong></div>
                        )}

                        <Button variant="ghost" size="sm" className="w-full text-xs group-hover:text-primary">
                          {passed ? "Refazer Prova" : modProgress === 100 ? "Fazer Prova" : "Ver Detalhes"}
                          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </TabsContent>

        {/* ===== EVOLUÇÃO ===== */}
        <TabsContent value="evolucao" className="mt-6">
          <AcademyEvolution
            modules={published}
            lessons={allLessons}
            progress={allProgress}
            certificates={allCerts}
            quizAttempts={allAttempts}
          />
        </TabsContent>

        {/* ===== CERTIFICADOS ===== */}
        <TabsContent value="certificados" className="mt-6">
          {allCerts.length === 0 ? (
            <div className="text-center py-16">
              <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Nenhum certificado obtido</p>
              <p className="text-xs text-muted-foreground mt-1">Complete módulos e passe nas provas para obter certificados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCerts.map((cert) => {
                const mod = published.find((m) => m.id === cert.module_id);
                return (
                  <Card key={cert.id} className="glass-card hover-lift">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">{mod?.title || "Módulo"}</h4>
                          <p className="text-[10px] text-muted-foreground">
                            Emitido em {format(new Date(cert.issued_at), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>
                      {cert.certificate_url && (
                        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => window.open(cert.certificate_url!, "_blank")}>
                          Baixar Certificado
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== RANKING ===== */}
        <TabsContent value="ranking" className="mt-6">
          <AcademyRanking />
        </TabsContent>
      </Tabs>
    </div>
  );
}
