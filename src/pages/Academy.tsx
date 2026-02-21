import { useState } from "react";
import { GraduationCap, BookOpen, Route, ClipboardCheck, Award, Settings, BarChart3, TrendingUp, Target, Building2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getTotalProgress, getUserCertificates, mockModules, getModuleProgress, getQuizByModule, getQuizAttempts, getCategoryModuleCount } from "@/data/academyData";
import { AcademyModules } from "@/components/academy/AcademyModules";
import { AcademyModuleDetail } from "@/components/academy/AcademyModuleDetail";
import { AcademyLesson } from "@/components/academy/AcademyLesson";
import { AcademyJourney } from "@/components/academy/AcademyJourney";
import { AcademyQuiz } from "@/components/academy/AcademyQuiz";
import { AcademyCertificates } from "@/components/academy/AcademyCertificates";
import { AcademyAdmin } from "@/components/academy/AcademyAdmin";
import { AcademyReports } from "@/components/academy/AcademyReports";

type Tab = "modulos" | "jornada" | "provas" | "certificados" | "admin" | "relatorios";

const tabs: { id: Tab; label: string; description: string; icon: React.ElementType; color: string; admin?: boolean; countFn?: () => string }[] = [
  { id: "modulos", label: "Trilhas", description: "Módulos e aulas disponíveis", icon: BookOpen, color: "blue", countFn: () => `${mockModules.filter(m => m.status === "published").length} trilhas` },
  { id: "jornada", label: "Minha Jornada", description: "Seu progresso pessoal", icon: Route, color: "emerald" },
  { id: "provas", label: "Provas", description: "Avaliações por módulo", icon: ClipboardCheck, color: "orange" },
  { id: "certificados", label: "Certificados", description: "Conquistas obtidas", icon: Award, color: "yellow", countFn: () => `${getUserCertificates().length} obtidos` },
  { id: "admin", label: "Gestão", description: "Cadastrar e editar conteúdo", icon: Settings, color: "purple", admin: true },
  { id: "relatorios", label: "Relatórios", description: "Métricas e alertas", icon: BarChart3, color: "rose", admin: true },
];

const tabColorMap: Record<string, { ring: string; bg: string; text: string; iconBg: string; border: string; activeBg: string }> = {
  blue:    { ring: "ring-blue-500/40",    bg: "bg-blue-500/5",    text: "text-blue-600 dark:text-blue-400",    iconBg: "bg-blue-500/15",    border: "border-blue-500/20",    activeBg: "bg-blue-500/10" },
  emerald: { ring: "ring-emerald-500/40", bg: "bg-emerald-500/5", text: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-500/15", border: "border-emerald-500/20", activeBg: "bg-emerald-500/10" },
  orange:  { ring: "ring-orange-500/40",  bg: "bg-orange-500/5",  text: "text-orange-600 dark:text-orange-400",  iconBg: "bg-orange-500/15",  border: "border-orange-500/20",  activeBg: "bg-orange-500/10" },
  yellow:  { ring: "ring-yellow-500/40",  bg: "bg-yellow-500/5",  text: "text-yellow-600 dark:text-yellow-400",  iconBg: "bg-yellow-500/15",  border: "border-yellow-500/20",  activeBg: "bg-yellow-500/10" },
  purple:  { ring: "ring-purple-500/40",  bg: "bg-purple-500/5",  text: "text-purple-600 dark:text-purple-400",  iconBg: "bg-purple-500/15",  border: "border-purple-500/20",  activeBg: "bg-purple-500/10" },
  rose:    { ring: "ring-rose-500/40",    bg: "bg-rose-500/5",    text: "text-rose-600 dark:text-rose-400",    iconBg: "bg-rose-500/15",    border: "border-rose-500/20",    activeBg: "bg-rose-500/10" },
};

export default function Academy() {
  const [activeTab, setActiveTab] = useState<Tab>("modulos");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);

  const totalProgress = getTotalProgress();
  const certs = getUserCertificates();
  const publishedModules = mockModules.filter(m => m.status === "published");
  const completedModules = publishedModules.filter(m => getModuleProgress(m.id) === 100).length;

  const isSubView = !!(selectedModule || selectedLesson || activeQuiz);

  const renderContent = () => {
    if (selectedLesson && selectedModule) {
      return (
        <AcademyLesson
          lessonId={selectedLesson}
          onBack={() => setSelectedLesson(null)}
          onNavigate={(id) => setSelectedLesson(id)}
          onGoToQuiz={(quizId) => { setSelectedLesson(null); setActiveQuiz(quizId); }}
        />
      );
    }
    if (activeQuiz) {
      return (
        <AcademyQuiz
          quizId={activeQuiz}
          onBack={() => { setActiveQuiz(null); }}
          onViewCertificate={() => { setActiveQuiz(null); setSelectedModule(null); setActiveTab("certificados"); }}
        />
      );
    }
    if (selectedModule) {
      return (
        <AcademyModuleDetail
          moduleId={selectedModule}
          onBack={() => setSelectedModule(null)}
          onSelectLesson={(id) => setSelectedLesson(id)}
          onStartQuiz={(quizId) => setActiveQuiz(quizId)}
          onViewCertificate={() => { setSelectedModule(null); setActiveTab("certificados"); }}
        />
      );
    }
    switch (activeTab) {
      case "modulos":
        return <AcademyModules onSelectModule={(id) => setSelectedModule(id)} />;
      case "jornada":
        return (
          <AcademyJourney
            onSelectModule={(id) => { setActiveTab("modulos"); setSelectedModule(id); }}
            onSelectLesson={(lessonId, moduleId) => { setSelectedModule(moduleId); setSelectedLesson(lessonId); }}
          />
        );
      case "provas":
        return <AcademyModules onSelectModule={(id) => setSelectedModule(id)} />;
      case "certificados":
        return <AcademyCertificates />;
      case "admin":
        return <AcademyAdmin />;
      case "relatorios":
        return <AcademyReports />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header — contextual */}
      {!isSubView ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6">
          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/5 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />

          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="page-header-title">NOE Academy</h1>
                  <Badge variant="secondary" className="text-[10px] font-semibold">Franqueadora</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Plataforma de treinamento e capacitação da rede
                </p>
              </div>
            </div>

            {/* Progress ring */}
            <div className="flex items-center gap-5">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(totalProgress / 100) * 175.9} 175.9`} className="transition-all duration-700" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{totalProgress}%</span>
              </div>
              <div className="hidden sm:flex flex-col gap-1 text-xs text-muted-foreground">
                <span><strong className="text-foreground">{completedModules}</strong> módulos concluídos</span>
                <span><strong className="text-foreground">{certs.length}</strong> certificados</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab navigation — only on main view */}
      {!isSubView && (
        <>
          {/* User tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tabs.filter(t => !t.admin).map((tab) => {
              const Icon = tab.icon;
              const c = tabColorMap[tab.color];
              const isActive = activeTab === tab.id;

              return (
                <Card
                  key={tab.id}
                  className={`relative cursor-pointer transition-all duration-200 p-4 hover:shadow-md hover:scale-[1.02] border-l-4 ${
                    isActive ? `${c.activeBg} ${c.ring} ring-1 border-l-current ${c.text}` : `${c.bg} ${c.border} border-l-transparent hover:border-l-current`
                  }`}
                  onClick={() => { setActiveTab(tab.id); setSelectedModule(null); setSelectedLesson(null); setActiveQuiz(null); }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.iconBg}`}>
                      <Icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${isActive ? c.text : "text-foreground"}`}>
                        {tab.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{tab.description}</p>
                      {tab.countFn && (
                        <p className={`text-[10px] font-medium mt-1 ${c.text}`}>{tab.countFn()}</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Admin divider + tabs */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Administração</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tabs.filter(t => t.admin).map((tab) => {
              const Icon = tab.icon;
              const c = tabColorMap[tab.color];
              const isActive = activeTab === tab.id;

              return (
                <Card
                  key={tab.id}
                  className={`relative cursor-pointer transition-all duration-200 p-4 hover:shadow-md hover:scale-[1.02] border-l-4 ${
                    isActive ? `${c.activeBg} ${c.ring} ring-1 border-l-current ${c.text}` : `${c.bg} ${c.border} border-l-transparent hover:border-l-current`
                  }`}
                  onClick={() => { setActiveTab(tab.id); setSelectedModule(null); setSelectedLesson(null); setActiveQuiz(null); }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.iconBg}`}>
                      <Icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-semibold leading-tight ${isActive ? c.text : "text-foreground"}`}>
                          {tab.label}
                        </p>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Admin</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{tab.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Content */}
      <div className="animate-fade-in">
        {renderContent()}
      </div>
    </div>
  );
}
