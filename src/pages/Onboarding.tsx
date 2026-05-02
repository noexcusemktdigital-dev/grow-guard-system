// @ts-nocheck
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rocket, ArrowLeft, ClipboardList, Users, BarChart3, ListChecks, Inbox, Plus, Calendar, CheckCircle2, AlertTriangle, Pause } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useOnboardingUnits, useOnboardingChecklist, useOnboardingMeetings, useOnboardingTasks, useOnboardingIndicators, useOnboardingMutations } from "@/hooks/useOnboarding";
import { useUnits } from "@/hooks/useUnits";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  in_progress: { label: "Em implantação", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: <Rocket className="w-3 h-3" /> },
  completed: { label: "Concluído", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  paused: { label: "Pausado", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: <Pause className="w-3 h-3" /> },
  at_risk: { label: "Atrasado", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: <AlertTriangle className="w-3 h-3" /> },
  pending: { label: "Não iniciado", color: "bg-muted text-muted-foreground", icon: null },
};

export default function Onboarding() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showNewStep, setShowNewStep] = useState(false);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);

  const { data: units, isLoading } = useOnboardingUnits();
  const { data: allChecklist } = useOnboardingChecklist();
  const { data: checklist } = useOnboardingChecklist(selectedId || undefined);
  const { data: meetings } = useOnboardingMeetings(selectedId || undefined);
  const { data: tasks } = useOnboardingTasks(selectedId || undefined);
  const { data: indicators } = useOnboardingIndicators(selectedId || undefined);
  const { data: dbUnits } = useUnits();
  const { createUnit, updateUnit, toggleChecklistItem, createChecklistItem, createMeeting, updateMeeting, createTask, toggleTask } = useOnboardingMutations();

  // New unit form — unit selection drives name & responsible
  const [newUnitId, setNewUnitId] = useState("");
  const [newStartDate, setNewStartDate] = useState("");

  // Derived from selected unit
  const selectedDbUnit = (dbUnits ?? []).find(u => u.id === newUnitId);

  // New step form
  const [stepTitle, setStepTitle] = useState("");
  // New meeting form
  const [meetTitle, setMeetTitle] = useState("");
  const [meetDate, setMeetDate] = useState("");
  const [meetNotes, setMeetNotes] = useState("");
  // New task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");

  const selected = (units ?? []).find(o => o.id === selectedId);

  const getProgress = (unitId: string) => {
    const items = (allChecklist ?? []).filter(c => c.onboarding_unit_id === unitId);
    if (items.length === 0) return 0;
    return Math.round((items.filter(c => c.is_completed).length / items.length) * 100);
  };

  const getUnitProgress = () => {
    if (!checklist || checklist.length === 0) return 0;
    return Math.round((checklist.filter(c => c.is_completed).length / checklist.length) * 100);
  };

  // Filter out units that already have an active onboarding
  const existingUnitOrgIds = new Set((units ?? []).map(u => (u as unknown as { unit_org_id?: string }).unit_org_id).filter(Boolean));
  const availableUnits = (dbUnits ?? []).filter(u => !existingUnitOrgIds.has(u.id));

  const getDaysRemaining = (targetDate: string | null) => {
    if (!targetDate) return null;
    const diff = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleCreateUnit = () => {
    if (!newUnitId) { reportError(new Error("Selecione uma unidade"), { title: "Selecione uma unidade", category: "onboarding.validation" }); return; }
    const unitName = selectedDbUnit?.name || "Implantação";
    const responsible = (selectedDbUnit as unknown as { manager_name?: string } | null)?.manager_name || undefined;
    const startDate = newStartDate || new Date().toISOString().slice(0, 10);
    const targetDate = new Date(new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    createUnit.mutate({
      name: unitName,
      unit_org_id: newUnitId,
      start_date: startDate,
      target_date: targetDate,
      responsible,
    });
    setShowNewDialog(false);
    setNewUnitId(""); setNewStartDate("");
    toast.success("Implantação criada");
  };

  const handleCreateStep = () => {
    if (!stepTitle.trim() || !selectedId) return;
    createChecklistItem.mutate({ title: stepTitle, onboarding_unit_id: selectedId });
    setShowNewStep(false); setStepTitle("");
    toast.success("Etapa adicionada");
  };

  const handleCreateMeeting = () => {
    if (!meetTitle.trim() || !selectedId) return;
    createMeeting.mutate({ title: meetTitle, onboarding_unit_id: selectedId, date: meetDate || undefined, notes: meetNotes || undefined });
    setShowNewMeeting(false); setMeetTitle(""); setMeetDate(""); setMeetNotes("");
    toast.success("Reunião criada");
  };

  const handleCreateTask = () => {
    if (!taskTitle.trim() || !selectedId) return;
    createTask.mutate({ title: taskTitle, onboarding_unit_id: selectedId, due_date: taskDue || undefined });
    setShowNewTask(false); setTaskTitle(""); setTaskDue("");
    toast.success("Tarefa criada");
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {selected && <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Voltar</Button>}
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            <h1 className="page-header-title">Onboarding</h1>
            <Badge variant="outline" className="text-xs">Franqueadora</Badge>
          </div>
        </div>
        {!selected && (
          <Button onClick={() => setShowNewDialog(true)}><Plus className="w-4 h-4 mr-1" /> Nova Implantação</Button>
        )}
      </div>
      {!selected && <p className="text-sm text-muted-foreground">Implantação e acompanhamento das franquias da rede</p>}

      {!selected ? (
        (units ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhuma implantação em andamento</h3>
            <p className="text-sm text-muted-foreground mb-4">Inicie o onboarding de uma nova unidade.</p>
            <Button onClick={() => setShowNewDialog(true)}><Plus className="w-4 h-4 mr-1" /> Nova Implantação</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {units?.map(u => {
              const progress = getProgress(u.id);
              const st = STATUS_MAP[u.status] || STATUS_MAP.pending;
              return (
                <Card key={u.id} className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedId(u.id)}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-base">{u.name}</h3>
                    <Badge className={`${st.color} border-0 text-xs gap-1`}>{st.icon}{st.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <Progress value={progress} className="h-2.5 flex-1" />
                    <span className="text-sm font-medium tabular-nums">{progress}%</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {u.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Início: {new Date(u.start_date).toLocaleDateString("pt-BR")}</span>}
                    {(u as unknown as { target_date?: string }).target_date && (() => {
                      const days = getDaysRemaining((u as unknown as { target_date?: string }).target_date);
                      if (days === null) return null;
                      return (
                        <span className={`flex items-center gap-1 font-medium ${days < 0 ? "text-destructive" : days <= 7 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                          <AlertTriangle className="w-3 h-3" />
                          {days < 0 ? `${Math.abs(days)}d atrasado` : `${days}d restantes`}
                        </span>
                      );
                    })()}
                    {(u as unknown as { responsible?: string }).responsible && <span>Resp: {(u as unknown as { responsible?: string }).responsible}</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-lg border border-border bg-card space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-lg font-bold">{selected.name}</h2>
              <div className="flex items-center gap-2">
                <Select value={selected.status} onValueChange={(v) => updateUnit.mutate({ id: selected.id, status: v })}>
                  <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending" className="text-xs">Não iniciado</SelectItem>
                    <SelectItem value="in_progress" className="text-xs">Em implantação</SelectItem>
                    <SelectItem value="completed" className="text-xs">Concluído</SelectItem>
                    <SelectItem value="paused" className="text-xs">Pausado</SelectItem>
                    <SelectItem value="at_risk" className="text-xs">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={getUnitProgress()} className="h-2.5 flex-1" />
              <span className="text-sm font-medium">{getUnitProgress()}%</span>
            </div>
            {selected.start_date && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Início: {new Date(selected.start_date).toLocaleDateString("pt-BR")}
                {(selected as unknown as { target_date?: string }).target_date && (
                  <span className="ml-3">
                    Prazo: {new Date((selected as unknown as { target_date?: string }).target_date).toLocaleDateString("pt-BR")}
                    {(() => {
                      const days = getDaysRemaining((selected as unknown as { target_date?: string }).target_date);
                      if (days === null) return null;
                      return (
                        <span className={`ml-1 font-medium ${days < 0 ? "text-destructive" : days <= 7 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                          ({days < 0 ? `${Math.abs(days)}d atrasado` : `${days}d restantes`})
                        </span>
                      );
                    })()}
                  </span>
                )}
              </p>
            )}
          </div>

          <Tabs defaultValue="etapas">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="etapas" className="gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Etapas ({(checklist ?? []).length})</TabsTrigger>
              <TabsTrigger value="reunioes" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Reuniões ({(meetings ?? []).length})</TabsTrigger>
              <TabsTrigger value="indicadores" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Indicadores</TabsTrigger>
              <TabsTrigger value="plano" className="gap-1.5"><ListChecks className="w-3.5 h-3.5" /> Plano de Ação ({(tasks ?? []).length})</TabsTrigger>
            </TabsList>

            <TabsContent value="etapas" className="mt-4 space-y-3">
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setShowNewStep(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Nova Etapa</Button>
              </div>
              {(checklist ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma etapa configurada.</p>
              ) : (
                <div className="space-y-2">
                  {checklist?.map(c => (
                    <div key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border ${c.is_completed ? "bg-muted/30" : ""}`}>
                      <Checkbox checked={c.is_completed} onCheckedChange={(v) => toggleChecklistItem.mutate({ id: c.id, is_completed: !!v })} />
                      <span className={`text-sm flex-1 ${c.is_completed ? "line-through text-muted-foreground" : ""}`}>{c.title}</span>
                      {c.completed_at && <span className="text-[10px] text-muted-foreground">{new Date(c.completed_at).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reunioes" className="mt-4 space-y-3">
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setShowNewMeeting(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Nova Reunião</Button>
              </div>
              {(meetings ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma reunião agendada.</p>
              ) : (
                <div className="space-y-2">
                  {meetings?.map(m => (
                    <Card key={m.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{m.title}</h4>
                        <div className="flex items-center gap-2">
                          {m.date && <span className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString("pt-BR")}</span>}
                          <Select value={m.status || "scheduled"} onValueChange={(v) => updateMeeting.mutate({ id: m.id, status: v })}>
                            <SelectTrigger className="h-6 w-24 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled" className="text-xs">Agendada</SelectItem>
                              <SelectItem value="done" className="text-xs">Realizada</SelectItem>
                              <SelectItem value="cancelled" className="text-xs">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
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
                  {indicators?.map(ind => (
                    <Card key={ind.id} className="p-4">
                      <p className="text-sm font-medium">{ind.name}</p>
                      <p className="text-2xl font-bold">{ind.current_value}{ind.unit}</p>
                      {ind.target_value && <p className="text-xs text-muted-foreground">Meta: {ind.target_value}{ind.unit}</p>}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="plano" className="mt-4 space-y-3">
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setShowNewTask(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Nova Tarefa</Button>
              </div>
              {(tasks ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa no plano de ação.</p>
              ) : (
                <div className="space-y-2">
                  {tasks?.map(t => (
                    <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border ${t.is_completed ? "bg-muted/30" : ""}`}>
                      <Checkbox checked={t.is_completed} onCheckedChange={(v) => toggleTask.mutate({ id: t.id, is_completed: !!v })} />
                      <span className={`text-sm flex-1 ${t.is_completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                      {t.due_date && <span className="text-[10px] text-muted-foreground">{new Date(t.due_date).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* New Unit Dialog — unit-driven */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Implantação</DialogTitle>
            <DialogDescription>Selecione a unidade para iniciar o processo de implantação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Unidade *</Label>
              <Select value={newUnitId} onValueChange={setNewUnitId}>
                <SelectTrigger><SelectValue placeholder="Selecionar unidade" /></SelectTrigger>
                <SelectContent>
                  {availableUnits.length === 0 ? (
                    <SelectItem value="__none" disabled>Todas as unidades já têm onboarding</SelectItem>
                  ) : availableUnits.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedDbUnit && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1">
                <p className="text-xs text-muted-foreground">Nome da implantação:</p>
                <p className="text-sm font-medium">{selectedDbUnit.name}</p>
                {(selectedDbUnit as unknown as { manager_name?: string } | null)?.manager_name && (
                  <>
                    <p className="text-xs text-muted-foreground mt-1">Responsável:</p>
                    <p className="text-sm">{(selectedDbUnit as unknown as { manager_name?: string }).manager_name}</p>
                  </>
                )}
              </div>
            )}
            <div>
              <Label>Data de início</Label>
              <Input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateUnit} disabled={!newUnitId}>Criar Implantação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Step Dialog */}
      <Dialog open={showNewStep} onOpenChange={setShowNewStep}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nova Etapa</DialogTitle></DialogHeader>
          <div><Label>Descrição *</Label><Input value={stepTitle} onChange={e => setStepTitle(e.target.value)} placeholder="Ex: Configurar CRM" /></div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNewStep(false)}>Cancelar</Button><Button onClick={handleCreateStep}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Meeting Dialog */}
      <Dialog open={showNewMeeting} onOpenChange={setShowNewMeeting}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Reunião</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={meetTitle} onChange={e => setMeetTitle(e.target.value)} placeholder="Ex: Kickoff" /></div>
            <div><Label>Data</Label><Input type="datetime-local" value={meetDate} onChange={e => setMeetDate(e.target.value)} /></div>
            <div><Label>Ata / Notas</Label><Textarea value={meetNotes} onChange={e => setMeetNotes(e.target.value)} placeholder="Notas da reunião..." rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNewMeeting(false)}>Cancelar</Button><Button onClick={handleCreateMeeting}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Task Dialog */}
      <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Ex: Enviar kit de boas-vindas" /></div>
            <div><Label>Prazo</Label><Input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNewTask(false)}>Cancelar</Button><Button onClick={handleCreateTask}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
