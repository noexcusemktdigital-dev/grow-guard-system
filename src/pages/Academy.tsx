import { useState } from "react";
import { GraduationCap, BookOpen, Route, ClipboardCheck, Award, Settings, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getTotalProgress } from "@/data/academyData";
import { AcademyModules } from "@/components/academy/AcademyModules";
import { AcademyModuleDetail } from "@/components/academy/AcademyModuleDetail";
import { AcademyLesson } from "@/components/academy/AcademyLesson";
import { AcademyJourney } from "@/components/academy/AcademyJourney";
import { AcademyQuiz } from "@/components/academy/AcademyQuiz";
import { AcademyCertificates } from "@/components/academy/AcademyCertificates";
import { AcademyAdmin } from "@/components/academy/AcademyAdmin";
import { AcademyReports } from "@/components/academy/AcademyReports";

type Tab = "modulos" | "jornada" | "provas" | "certificados" | "admin" | "relatorios";

const tabs: { id: Tab; label: string; icon: React.ElementType; color: string; admin?: boolean }[] = [
  { id: "modulos", label: "Trilhas / Módulos", icon: BookOpen, color: "blue" },
  { id: "jornada", label: "Minha Jornada", icon: Route, color: "emerald" },
  { id: "provas", label: "Provas", icon: ClipboardCheck, color: "orange" },
  { id: "certificados", label: "Certificados", icon: Award, color: "yellow" },
  { id: "admin", label: "Gestão do Conteúdo", icon: Settings, color: "purple", admin: true },
  { id: "relatorios", label: "Relatórios", icon: BarChart3, color: "rose", admin: true },
];

const tabColors: Record<string, { bg: string; border: string; text: string; iconBg: string; activeBg: string; activeBorder: string }> = {
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-500/20", activeBg: "bg-blue-500/20", activeBorder: "border-blue-500" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-500/20", activeBg: "bg-emerald-500/20", activeBorder: "border-emerald-500" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-500/20", activeBg: "bg-orange-500/20", activeBorder: "border-orange-500" },
  yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-600 dark:text-yellow-400", iconBg: "bg-yellow-500/20", activeBg: "bg-yellow-500/20", activeBorder: "border-yellow-500" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-500/20", activeBg: "bg-purple-500/20", activeBorder: "border-purple-500" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-500/20", activeBg: "bg-rose-500/20", activeBorder: "border-rose-500" },
};

export default function Academy() {
  const [activeTab, setActiveTab] = useState<Tab>("modulos");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);

  const totalProgress = getTotalProgress();

  // Determine what to render based on drill-down state
  const renderContent = () => {
    // Lesson view
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

    // Quiz view
    if (activeQuiz) {
      return (
        <AcademyQuiz
          quizId={activeQuiz}
          onBack={() => { setActiveQuiz(null); }}
          onViewCertificate={() => { setActiveQuiz(null); setSelectedModule(null); setActiveTab("certificados"); }}
        />
      );
    }

    // Module detail view
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

    // Tab content
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <GraduationCap className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">NOE Academy</h1>
            <Badge variant="secondary" className="text-xs font-medium">Franqueadora</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Plataforma de treinamento e capacitação da rede
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Progresso geral</p>
            <p className="text-lg font-bold">{totalProgress}%</p>
          </div>
          <Progress value={totalProgress} className="w-24 h-2" />
        </div>
      </div>

      {/* Tab cards */}
      {!selectedModule && !selectedLesson && !activeQuiz && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const style = tabColors[tab.color];
            const isActive = activeTab === tab.id;

            return (
              <Card
                key={tab.id}
                className={`relative cursor-pointer transition-all duration-200 border-2 p-4 hover:shadow-md hover:scale-[1.02] ${
                  isActive ? `${style.activeBg} ${style.activeBorder} shadow-md` : `${style.bg} ${style.border}`
                }`}
                onClick={() => { setActiveTab(tab.id); setSelectedModule(null); setSelectedLesson(null); setActiveQuiz(null); }}
              >
                <div className="flex flex-col items-center text-center gap-2.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${style.iconBg}`}>
                    <Icon className={`w-5 h-5 ${style.text}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold leading-tight ${isActive ? style.text : "text-foreground"}`}>
                      {tab.label}
                    </p>
                    {tab.admin && <Badge variant="secondary" className="text-[9px] mt-1">Admin</Badge>}
                  </div>
                </div>
                {isActive && (
                  <div className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${
                    tab.color === "blue" ? "bg-blue-500" :
                    tab.color === "emerald" ? "bg-emerald-500" :
                    tab.color === "orange" ? "bg-orange-500" :
                    tab.color === "yellow" ? "bg-yellow-500" :
                    tab.color === "purple" ? "bg-purple-500" :
                    "bg-rose-500"
                  }`} />
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Content */}
      {renderContent()}
    </div>
  );
}
