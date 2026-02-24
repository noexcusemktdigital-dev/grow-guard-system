import { useState } from "react";
import { GraduationCap, BookOpen, Route, ClipboardCheck, Award, Settings, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAcademyModules, useAcademyProgress, useAcademyCertificates } from "@/hooks/useAcademy";
import { AcademyAdmin } from "@/components/academy/AcademyAdmin";
import { AcademyModules } from "@/components/academy/AcademyModules";
import { AcademyJourney } from "@/components/academy/AcademyJourney";
import { AcademyCertificates } from "@/components/academy/AcademyCertificates";
import { AcademyReports } from "@/components/academy/AcademyReports";
import { AcademyModulePlayer } from "@/components/academy/AcademyModulePlayer";

type Tab = "modulos" | "jornada" | "provas" | "certificados" | "admin" | "relatorios";

const tabs: { id: Tab; label: string; description: string; icon: React.ElementType; color: string; admin?: boolean }[] = [
  { id: "modulos", label: "Trilhas", description: "Módulos e aulas disponíveis", icon: BookOpen, color: "blue" },
  { id: "jornada", label: "Minha Jornada", description: "Seu progresso pessoal", icon: Route, color: "emerald" },
  { id: "provas", label: "Provas", description: "Avaliações por módulo", icon: ClipboardCheck, color: "orange" },
  { id: "certificados", label: "Certificados", description: "Conquistas obtidas", icon: Award, color: "yellow" },
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
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const { data: modules, isLoading: loadingModules } = useAcademyModules();
  const { data: progress } = useAcademyProgress();
  const { data: certs } = useAcademyCertificates();

  if (loadingModules) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  const publishedModules = (modules ?? []).filter(m => m.is_published);

  // If viewing a module player
  if (selectedModuleId) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedModuleId(null)} className="text-sm text-primary hover:underline">← Voltar</button>
        <AcademyModulePlayer moduleId={selectedModuleId} />
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "modulos":
        return <AcademyModules onSelectModule={(id) => setSelectedModuleId(id)} />;
      case "jornada":
        return <AcademyJourney onSelectModule={(id) => setSelectedModuleId(id)} onSelectLesson={(_, moduleId) => setSelectedModuleId(moduleId)} />;
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
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6">
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
              <p className="text-sm text-muted-foreground">Plataforma de treinamento e capacitação da rede</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex flex-col gap-1 text-xs text-muted-foreground">
              <span><strong className="text-foreground">{publishedModules.length}</strong> módulos disponíveis</span>
              <span><strong className="text-foreground">{(certs ?? []).length}</strong> certificados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tabs.filter(t => !t.admin).map((tab) => {
          const Icon = tab.icon;
          const c = tabColorMap[tab.color];
          const isActive = activeTab === tab.id;
          return (
            <Card key={tab.id} className={`relative cursor-pointer transition-all duration-200 p-4 hover:shadow-md hover:scale-[1.02] border-l-4 ${isActive ? `${c.activeBg} ${c.ring} ring-1 border-l-current ${c.text}` : `${c.bg} ${c.border} border-l-transparent hover:border-l-current`}`} onClick={() => setActiveTab(tab.id)}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.iconBg}`}>
                  <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold leading-tight ${isActive ? c.text : "text-foreground"}`}>{tab.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{tab.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

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
            <Card key={tab.id} className={`relative cursor-pointer transition-all duration-200 p-4 hover:shadow-md hover:scale-[1.02] border-l-4 ${isActive ? `${c.activeBg} ${c.ring} ring-1 border-l-current ${c.text}` : `${c.bg} ${c.border} border-l-transparent hover:border-l-current`}`} onClick={() => setActiveTab(tab.id)}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.iconBg}`}>
                  <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-semibold leading-tight ${isActive ? c.text : "text-foreground"}`}>{tab.label}</p>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Admin</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{tab.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {renderTabContent()}
      </div>
    </div>
  );
}
