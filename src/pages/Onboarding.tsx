import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rocket, ArrowLeft, ClipboardList, Users, BarChart3, ListChecks, Inbox, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useOnboardingUnits, useOnboardingChecklist, useOnboardingMeetings, useOnboardingTasks, useOnboardingIndicators } from "@/hooks/useOnboarding";

export default function Onboarding() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: units, isLoading } = useOnboardingUnits();
  const { data: checklist } = useOnboardingChecklist(selectedId || undefined);
  const { data: meetings } = useOnboardingMeetings(selectedId || undefined);
  const { data: tasks } = useOnboardingTasks(selectedId || undefined);
  const { data: indicators } = useOnboardingIndicators(selectedId || undefined);

  const selected = (units ?? []).find(o => o.id === selectedId);

  const getProgress = () => {
    if (!checklist || checklist.length === 0) return 0;
    const done = checklist.filter(c => c.is_completed).length;
    return Math.round((done / checklist.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
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
            <h1 className="page-header-title">Onboarding</h1>
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
        (units ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhuma implantação em andamento</h3>
            <p className="text-sm text-muted-foreground mb-4">Inicie o onboarding de uma nova unidade.</p>
            <Button><Plus className="w-4 h-4 mr-1" /> Nova Implantação</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {units!.map(u => (
              <Card key={u.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedId(u.id)}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{u.name}</h3>
                  <Badge variant={u.status === "completed" ? "default" : "secondary"} className="text-[10px]">{u.status}</Badge>
                </div>
                {u.start_date && <p className="text-xs text-muted-foreground">Início: {new Date(u.start_date).toLocaleDateString("pt-BR")}</p>}
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-lg border border-border bg-card space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-lg font-bold">{selected.name}</h2>
              <Badge className="text-xs">{selected.status}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={getProgress()} className="h-2.5 flex-1" />
              <span className="text-sm font-medium">{getProgress()}%</span>
            </div>
          </div>

          <Tabs defaultValue="etapas">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="etapas" className="gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Etapas ({(checklist ?? []).length})</TabsTrigger>
              <TabsTrigger value="reunioes" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Reuniões ({(meetings ?? []).length})</TabsTrigger>
              <TabsTrigger value="indicadores" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Indicadores</TabsTrigger>
              <TabsTrigger value="plano" className="gap-1.5"><ListChecks className="w-3.5 h-3.5" /> Plano de Ação ({(tasks ?? []).length})</TabsTrigger>
            </TabsList>
            <TabsContent value="etapas" className="mt-4">
              {(checklist ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma etapa configurada para esta implantação.</p>
              ) : (
                <div className="space-y-2">
                  {checklist!.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <input type="checkbox" checked={c.is_completed} readOnly className="rounded" />
                      <span className={`text-sm ${c.is_completed ? "line-through text-muted-foreground" : ""}`}>{c.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="reunioes" className="mt-4">
              {(meetings ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma reunião agendada.</p>
              ) : (
                <div className="space-y-2">
                  {meetings!.map(m => (
                    <Card key={m.id} className="p-3">
                      <h4 className="font-medium text-sm">{m.title}</h4>
                      {m.date && <p className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString("pt-BR")}</p>}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="indicadores" className="mt-4">
              {(indicators ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum indicador configurado.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {indicators!.map(ind => (
                    <Card key={ind.id} className="p-4">
                      <p className="text-sm font-medium">{ind.name}</p>
                      <p className="text-2xl font-bold">{ind.current_value}{ind.unit}</p>
                      {ind.target_value && <p className="text-xs text-muted-foreground">Meta: {ind.target_value}{ind.unit}</p>}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="plano" className="mt-4">
              {(tasks ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa no plano de ação.</p>
              ) : (
                <div className="space-y-2">
                  {tasks!.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <input type="checkbox" checked={t.is_completed} readOnly className="rounded" />
                      <span className="text-sm">{t.title}</span>
                      {t.due_date && <span className="text-xs text-muted-foreground ml-auto">{new Date(t.due_date).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
