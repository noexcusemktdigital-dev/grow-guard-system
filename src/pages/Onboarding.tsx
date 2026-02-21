import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rocket, ArrowLeft, ClipboardList, Users, BarChart3, ListChecks } from "lucide-react";
import { OnboardingList } from "@/components/onboarding/OnboardingList";
import { OnboardingEtapas } from "@/components/onboarding/OnboardingEtapas";
import { OnboardingReunioes } from "@/components/onboarding/OnboardingReunioes";
import { OnboardingIndicadoresView } from "@/components/onboarding/OnboardingIndicadores";
import { OnboardingPlanoAcao } from "@/components/onboarding/OnboardingPlanoAcao";
import {
  mockOnboardings, mockMeetings, mockIndicators, mockTasks,
  getOnboardingProgress, STATUS_COLORS,
  type OnboardingUnit, type OnboardingMeeting, type OnboardingTask, type ChecklistItem,
} from "@/data/onboardingData";

export default function Onboarding() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [onboardings, setOnboardings] = useState<OnboardingUnit[]>(mockOnboardings);
  const [meetings, setMeetings] = useState<OnboardingMeeting[]>(mockMeetings);
  const [tasks, setTasks] = useState<OnboardingTask[]>(mockTasks);

  const selected = onboardings.find((o) => o.id === selectedId);

  const handleChecklistChange = (updated: ChecklistItem[]) => {
    setOnboardings((prev) =>
      prev.map((o) => (o.id === selectedId ? { ...o, checklist: updated } : o))
    );
  };

  const handleAddMeeting = (meeting: OnboardingMeeting) => {
    setMeetings((prev) => [...prev, meeting]);
  };

  const handleUpdateTasks = (updatedTasks: OnboardingTask[]) => {
    const otherTasks = tasks.filter((t) => t.onboardingId !== selectedId);
    setTasks([...otherTasks, ...updatedTasks.filter((t) => t.onboardingId === selectedId)]);
  };

  const handleAddOnboarding = (ob: OnboardingUnit) => {
    setOnboardings((prev) => [...prev, ob]);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {selected && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Onboarding</h1>
            <Badge variant="outline" className="text-xs">Franqueadora</Badge>
          </div>
        </div>
        {!selected && (
          <p className="text-sm text-muted-foreground w-full">
            Implantação e acompanhamento das franquias da rede
          </p>
        )}
      </div>

      {!selected ? (
        <OnboardingList
          onboardings={onboardings}
          meetings={meetings}
          tasks={tasks}
          onSelect={setSelectedId}
          onAddOnboarding={handleAddOnboarding}
        />
      ) : (
        <div className="space-y-6">
          {/* Unit header */}
          <div className="p-4 rounded-lg border border-border bg-card space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-lg font-bold">{selected.unidadeNome}</h2>
              <Badge className={`text-xs ${STATUS_COLORS[selected.status]}`}>{selected.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Início: {new Date(selected.dataInicio).toLocaleDateString("pt-BR")}</span>
              <span>CS: {selected.responsavelCS}</span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={getOnboardingProgress(selected.checklist)} className="h-2.5 flex-1" />
              <span className="text-sm font-medium">{getOnboardingProgress(selected.checklist)}%</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="etapas">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="etapas" className="gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Etapas</TabsTrigger>
              <TabsTrigger value="reunioes" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Reuniões</TabsTrigger>
              <TabsTrigger value="indicadores" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Indicadores</TabsTrigger>
              <TabsTrigger value="plano" className="gap-1.5"><ListChecks className="w-3.5 h-3.5" /> Plano de Ação</TabsTrigger>
            </TabsList>
            <TabsContent value="etapas" className="mt-4">
              <OnboardingEtapas checklist={selected.checklist} onChange={handleChecklistChange} />
            </TabsContent>
            <TabsContent value="reunioes" className="mt-4">
              <OnboardingReunioes
                meetings={meetings.filter((m) => m.onboardingId === selectedId)}
                onboardingId={selectedId!}
                onAdd={handleAddMeeting}
              />
            </TabsContent>
            <TabsContent value="indicadores" className="mt-4">
              <OnboardingIndicadoresView indicators={mockIndicators.find((i) => i.onboardingId === selectedId)} />
            </TabsContent>
            <TabsContent value="plano" className="mt-4">
              <OnboardingPlanoAcao
                tasks={tasks.filter((t) => t.onboardingId === selectedId)}
                onboardingId={selectedId!}
                onUpdate={handleUpdateTasks}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
