import { useState, useCallback, useMemo } from "react";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import {
  CheckSquare, Plus, CheckCircle2, Flame, Settings2, Zap, Sparkles,
  Calendar, Users, Filter, Trash2, Clock, AlertTriangle, ChevronDown,
  Wand2, Edit2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  useClienteChecklist, useClienteGamification, useClienteContentMutations,
} from "@/hooks/useClienteContent";
import { useClienteTasks, useClienteTaskMutations, ClientTask } from "@/hooks/useClienteTasks";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { format, isToday, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { triggerCelebration } from "@/components/CelebrationEffect";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { playSound } from "@/lib/sounds";

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: "Alta", color: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "Média", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  low: { label: "Baixa", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
};

const sourceConfig: Record<string, { label: string; color: string }> = {
  manual: { label: "Manual", color: "text-foreground" },
  admin: { label: "Admin", color: "text-primary" },
  system: { label: "Sistema", color: "text-amber-500" },
};

/* ─── DAILY CHECKLIST TAB ─── */
function DailyChecklistTab() {
  const { user } = useAuth();
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0]; // UTC date to match edge function
  const { data: items, isLoading } = useClienteChecklist(today);
  const { data: gamification } = useClienteGamification();
  const { createChecklistItem, toggleChecklistItem } = useClienteContentMutations();
  const [newTask, setNewTask] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [generating, setGenerating] = useState(false);

  const streakDays = gamification?.streak_days ?? 0;
  const allItems = items ?? [];
  const completed = allItems.filter((i: any) => i.is_completed).length;
  const total = allItems.length || 1;
  const progress = Math.round((completed / total) * 100);
  const progressColor = progress >= 70 ? "hsl(142, 71%, 45%)" : progress >= 30 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)";

  const addTask = () => {
    if (!newTask.trim()) return;
    createChecklistItem.mutate({ title: newTask, date: today, source: "manual", category: "operacional" });
    setNewTask("");
    setShowInput(false);
  };

  const handleToggle = useCallback((id: string, currentState: boolean) => {
    toggleChecklistItem.mutate(
      { id, is_completed: !currentState },
      { onSuccess: (result) => { if (result?.allDone) triggerCelebration(); } }
    );
  }, [toggleChecklistItem]);

  const handleGenerateChecklist = async () => {
    if (!orgId) return;
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("generate-daily-checklist", {
        body: { organization_id: orgId },
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["client-checklist"] });
      toast.success("Checklist gerado com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar checklist");
    } finally {
      setGenerating(false);
    }
  };

  const pendingItems = allItems.filter((i: any) => !i.is_completed);
  const doneItems = allItems.filter((i: any) => i.is_completed);

  if (isLoading || generating) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <motion.circle cx="40" cy="40" r="34" fill="none" stroke={progressColor} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - progress / 100) }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold">{progress}%</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{completed} de {allItems.length} tarefas</p>
          <p className="text-xs text-muted-foreground">{progress === 100 ? "Tudo concluído! 🎉" : "+10 XP por tarefa"}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 ${streakDays > 7 ? "animate-pulse" : ""}`}>
              <Flame className="w-3 h-3 text-orange-500" />
              <span className="text-[11px] font-bold text-orange-500">{streakDays} dias</span>
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowInput(!showInput)}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>

      {showInput && (
        <Card>
          <CardContent className="py-3">
            <div className="flex gap-2">
              <Input placeholder="Descreva a tarefa..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} className="text-sm" />
              <Button size="sm" onClick={addTask} disabled={createChecklistItem.isPending}>Criar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {pendingItems.length === 0 && doneItems.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
          <p className="text-sm text-muted-foreground">Nenhuma tarefa hoje</p>
          <Button variant="outline" size="sm" onClick={handleGenerateChecklist} disabled={generating}>
            <Wand2 className="w-4 h-4 mr-1" /> Gerar Checklist com IA (5 créditos)
          </Button>
        </div>
      ) : (
        <>
          <AnimatePresence mode="popLayout">
            {pendingItems.map((item: any, idx: number) => (
              <motion.div key={item.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ delay: idx * 0.03 }}>
                <Card className="border bg-muted/5 hover:shadow-sm group">
                  <CardContent className="py-2.5 px-3 flex items-center gap-3">
                    <motion.div whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.7 }} onClick={() => handleToggle(item.id, item.is_completed)}
                      className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10 flex items-center justify-center cursor-pointer flex-shrink-0" />
                    <span className="text-[13px] flex-1">{item.title}</span>
                    {item.source === "system" && (
                      <Badge variant="outline" className="text-[9px] gap-1 border-primary/20 text-primary"><Settings2 className="w-2.5 h-2.5" /> Auto</Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {doneItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Concluídas ({doneItems.length})</p>
              {doneItems.map((item: any) => (
                <Card key={item.id} className="opacity-50 cursor-pointer hover:opacity-70" onClick={() => handleToggle(item.id, item.is_completed)}>
                  <CardContent className="py-2 px-3 flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-[13px] flex-1 line-through text-muted-foreground">{item.title}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── TASK FORM DIALOG ─── */
interface TaskFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: ClientTask | null;
  members?: any[];
  isAdmin: boolean;
  onSubmit: (data: any) => void;
  isPending: boolean;
}

function TaskFormDialog({ open, onOpenChange, task, members, isAdmin, onSubmit, isPending }: TaskFormProps) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    due_date: task?.due_date ?? "",
    priority: task?.priority ?? "medium",
    assigned_to: task?.assigned_to ?? "__none__",
    assigned_team: task?.assigned_team ?? "",
  });

  // Reset form when task changes
  const key = task?.id ?? "new";
  useState(() => {
    setForm({
      title: task?.title ?? "",
      description: task?.description ?? "",
      due_date: task?.due_date ?? "",
      priority: task?.priority ?? "medium",
      assigned_to: task?.assigned_to ?? "__none__",
      assigned_team: task?.assigned_team ?? "",
    });
  });

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onSubmit({
      ...form,
      assigned_to: form.assigned_to === "__none__" ? undefined : form.assigned_to,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={key}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="O que precisa ser feito?" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalhes opcionais..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {isAdmin && members && members.length > 1 && (
            <div className="space-y-2">
              <Label>Atribuir a</Label>
              <Select value={form.assigned_to} onValueChange={v => setForm({ ...form, assigned_to: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar membro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Ninguém (eu)</SelectItem>
                  {members.map(m => (
                    <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || "Sem nome"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.title.trim()}>
            {isPending ? (isEdit ? "Salvando..." : "Criando...") : (isEdit ? "Salvar" : "Criar Tarefa")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── TASKS TAB ─── */
function TasksTab({ filterMyTasks }: { filterMyTasks: boolean }) {
  const { user } = useAuth();
  const { isAdmin } = useRoleAccess();
  const { data: allTasks, isLoading } = useClienteTasks();
  const { data: members } = useOrgMembers();
  const { createTask, updateTask, toggleTask, deleteTask } = useClienteTaskMutations();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ClientTask | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showAllDone, setShowAllDone] = useState(false);

  const tasks = useMemo(() => {
    let list = allTasks ?? [];
    if (filterMyTasks) list = list.filter(t => t.assigned_to === user?.id || (!t.assigned_to && t.created_by === user?.id));
    if (priorityFilter !== "all") list = list.filter(t => t.priority === priorityFilter);
    return list;
  }, [allTasks, filterMyTasks, user?.id, priorityFilter]);

  const pending = tasks.filter(t => t.status === "pending");
  const done = tasks.filter(t => t.status === "done");
  const overdue = pending.filter(t => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)));
  const completedToday = done.filter(t => t.completed_at && isToday(parseISO(t.completed_at)));

  const handleCreate = (data: any) => {
    createTask.mutate({
      title: data.title,
      description: data.description || undefined,
      due_date: data.due_date || undefined,
      priority: data.priority,
      source: isAdmin ? "admin" : "manual",
      assigned_to: data.assigned_to,
      assigned_team: data.assigned_team || undefined,
    }, {
      onSuccess: () => {
        setCreateOpen(false);
        toast.success("Tarefa criada!");
      },
    });
  };

  const handleEdit = (data: any) => {
    if (!editingTask) return;
    updateTask.mutate({
      id: editingTask.id,
      title: data.title,
      description: data.description || null,
      due_date: data.due_date || null,
      priority: data.priority,
      assigned_to: data.assigned_to || null,
      assigned_team: data.assigned_team || null,
    }, {
      onSuccess: () => {
        setEditingTask(null);
        toast.success("Tarefa atualizada!");
      },
    });
  };

  const handleToggle = (id: string, done: boolean) => {
    toggleTask.mutate({ id, done }, {
      onSuccess: (result) => {
        if (done && result?.xpAwarded) {
          playSound("success");
          toast.success("+10 XP ⚡", { duration: 2000 });
        }
      },
    });
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    deleteTask.mutate(deletingId, {
      onSuccess: () => {
        setDeletingId(null);
        toast.success("Tarefa excluída");
      },
    });
  };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;

  const getMemberName = (id: string | null) => members?.find(m => m.user_id === id)?.full_name || "";
  const visibleDone = showAllDone ? done : done.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Mini-KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border">
          <CardContent className="py-3 px-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-lg font-bold">{pending.length}</p>
              <p className="text-[10px] text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`border ${overdue.length > 0 ? "border-destructive/30" : ""}`}>
          <CardContent className="py-3 px-4 flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${overdue.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            <div>
              <p className="text-lg font-bold">{overdue.length}</p>
              <p className="text-[10px] text-muted-foreground">Atrasadas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="py-3 px-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-lg font-bold">{completedToday.length}</p>
              <p className="text-[10px] text-muted-foreground">Hoje</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 h-8 text-xs"><Filter className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-1" /> Nova Tarefa</Button>
      </div>

      {pending.length === 0 && done.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary/40" />
          <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada</p>
        </div>
      ) : (
        <>
          {pending.map((task) => {
            const prio = priorityConfig[task.priority] || priorityConfig.medium;
            const src = sourceConfig[task.source] || sourceConfig.manual;
            const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
            return (
              <Card key={task.id} className={`border transition-all hover:shadow-sm ${isOverdue ? "border-destructive/30" : ""}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <motion.div whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.7 }}
                      onClick={() => handleToggle(task.id, true)}
                      className="w-5 h-5 mt-0.5 rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10 cursor-pointer flex-shrink-0" />
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingTask(task)}>
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <Badge variant="outline" className={`text-[9px] ${prio.color}`}>{prio.label}</Badge>
                        <Badge variant="outline" className={`text-[9px] ${src.color}`}>{src.label}</Badge>
                        {task.due_date && (
                          <Badge variant="outline" className={`text-[9px] gap-0.5 ${isOverdue ? "text-destructive border-destructive/30" : ""}`}>
                            <Calendar className="w-2.5 h-2.5" />
                            {format(parseISO(task.due_date), "dd/MM")}
                          </Badge>
                        )}
                        {task.assigned_to && task.assigned_to !== user?.id && (
                          <Badge variant="secondary" className="text-[9px]">{getMemberName(task.assigned_to) || "Membro"}</Badge>
                        )}
                        {task.assigned_team && (
                          <Badge variant="secondary" className="text-[9px] gap-0.5"><Users className="w-2.5 h-2.5" />{task.assigned_team}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setEditingTask(task)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeletingId(task.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {done.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Concluídas ({done.length})</p>
              {visibleDone.map((task) => (
                <Card key={task.id} className="opacity-50 cursor-pointer hover:opacity-70" onClick={() => handleToggle(task.id, false)}>
                  <CardContent className="py-2 px-3 flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-[13px] flex-1 line-through text-muted-foreground">{task.title}</span>
                    {task.completed_at && <span className="text-[9px] text-muted-foreground">{format(parseISO(task.completed_at), "dd/MM")}</span>}
                  </CardContent>
                </Card>
              ))}
              {done.length > 5 && !showAllDone && (
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setShowAllDone(true)}>
                  <ChevronDown className="w-3 h-3 mr-1" /> Ver todas ({done.length})
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <TaskFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        members={members}
        isAdmin={isAdmin}
        onSubmit={handleCreate}
        isPending={createTask.isPending}
      />

      {/* Edit Dialog */}
      {editingTask && (
        <TaskFormDialog
          open={!!editingTask}
          onOpenChange={(v) => !v && setEditingTask(null)}
          task={editingTask}
          members={members}
          isAdmin={isAdmin}
          onSubmit={handleEdit}
          isPending={updateTask.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function ClienteChecklist() {
  const { isAdmin } = useRoleAccess();

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="Tarefas"
        subtitle="Gerencie suas tarefas diárias e atribuições"
        icon={<CheckSquare className="w-5 h-5 text-primary" />}
        actions={<FeatureTutorialButton slug="checklist" />}
      />

      <Tabs defaultValue="hoje">
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
          <TabsTrigger value="hoje" className="text-xs gap-1"><Zap className="w-3.5 h-3.5" /> Hoje</TabsTrigger>
          <TabsTrigger value="minhas" className="text-xs gap-1"><CheckSquare className="w-3.5 h-3.5" /> Minhas Tarefas</TabsTrigger>
          {isAdmin && <TabsTrigger value="time" className="text-xs gap-1"><Users className="w-3.5 h-3.5" /> Time</TabsTrigger>}
        </TabsList>
        <TabsContent value="hoje"><DailyChecklistTab /></TabsContent>
        <TabsContent value="minhas"><TasksTab filterMyTasks /></TabsContent>
        {isAdmin && <TabsContent value="time"><TasksTab filterMyTasks={false} /></TabsContent>}
      </Tabs>
    </div>
  );
}
