// @ts-nocheck
import { useState, useCallback, useMemo, useEffect } from "react";
import { useCrmTasks } from "@/hooks/useCrmTasks";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import {
  CheckSquare, Plus, CheckCircle2,
  Calendar, Users, Filter, Trash2, Clock, AlertTriangle, ChevronDown,
  Edit2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { useClienteTasks, useClienteTaskMutations, ClientTask } from "@/hooks/useClienteTasks";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { format, isToday, isPast, isBefore, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { triggerCelebration } from "@/components/CelebrationEffect";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { playSound } from "@/lib/sounds";

const priorityConfig: Record<string, { label: string; color: string; order: number }> = {
  high: { label: "Alta", color: "bg-destructive/10 text-destructive border-destructive/20", order: 0 },
  medium: { label: "Média", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", order: 1 },
  low: { label: "Baixa", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", order: 2 },
};

const sourceConfig: Record<string, { label: string; color: string }> = {
  manual: { label: "Manual", color: "text-foreground" },
  admin: { label: "Admin", color: "text-primary" },
  system: { label: "Checklist IA", color: "text-violet-500" },
  crm: { label: "CRM", color: "text-amber-500" },
};

/* ─── TASK FORM DIALOG ─── */
interface TaskFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: ClientTask | null;
  members?: { user_id: string; full_name: string | null }[];
  isAdmin: boolean;
  onSubmit: (data: Record<string, unknown>) => void;
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

  useEffect(() => {
    setForm({
      title: task?.title ?? "",
      description: task?.description ?? "",
      due_date: task?.due_date ?? "",
      priority: task?.priority ?? "medium",
      assigned_to: task?.assigned_to ?? "__none__",
      assigned_team: task?.assigned_team ?? "",
    });
  }, [task?.id]);

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onSubmit({
      ...form,
      assigned_to: form.assigned_to === "__none__" ? undefined : form.assigned_to,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={task?.id ?? "new"}>
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

/* ─── TASK CARD ─── */
function TaskCard({
  task,
  user,
  onToggle,
  onEdit,
  onDelete,
  getMemberName,
}: {
  task: ClientTask;
  user: { id: string } | null;
  onToggle: (id: string, done: boolean) => void;
  onEdit: (t: ClientTask) => void;
  onDelete: (id: string) => void;
  getMemberName: (id: string | null) => string;
}) {
  const prio = priorityConfig[task.priority] || priorityConfig.medium;
  const src = sourceConfig[task.source] || sourceConfig.manual;
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
  const isDone = task.status === "done";

  if (isDone) {
    return (
      <Card className="opacity-50 cursor-pointer hover:opacity-70" onClick={() => onToggle(task.id, false)}>
        <CardContent className="py-2 px-3 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span className="text-[13px] flex-1 line-through text-muted-foreground">{task.title}</span>
          {task.completed_at && <span className="text-[9px] text-muted-foreground">{format(parseISO(task.completed_at), "dd/MM")}</span>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border transition-all hover:shadow-sm ${isOverdue ? "border-destructive/30 bg-destructive/5" : ""}`}>
      <CardContent className="py-3 px-4">
        <div className="flex items-start gap-3">
          <motion.div whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.7 }}
            onClick={() => onToggle(task.id, true)}
            className="w-5 h-5 mt-0.5 rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10 cursor-pointer flex-shrink-0" />
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(task)}>
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
            </div>
          </div>
          {task.source !== "crm" && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(task)} aria-label="Editar tarefa">
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(task.id)} aria-label="Excluir tarefa">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── MAIN PAGE ─── */
export default function ClienteChecklist() {
  const { user } = useAuth();
  const { isAdmin } = useRoleAccess();
  const qc = useQueryClient();
  const { data: allTasksRaw, isLoading } = useClienteTasks();
  const { data: members } = useOrgMembers();
  const { createTask, updateTask, toggleTask, deleteTask } = useClienteTaskMutations();
  const { data: crmTasksResult } = useCrmTasks();
  const crmTasks = useMemo(() => {
    return (crmTasksResult?.data ?? [])
      .filter(t => !t.completed_at)
      .map(t => ({
        id: `crm-${t.id}`,
        organization_id: t.organization_id,
        title: t.title,
        description: t.description || null,
        due_date: t.due_date || null,
        priority: t.priority || "medium",
        source: "crm" as const,
        status: t.completed_at ? "done" : "pending",
        created_by: null,
        assigned_to: t.assigned_to || null,
        assigned_team: null,
        completed_at: t.completed_at || null,
        completed_by: null,
        created_at: t.created_at,
        updated_at: t.updated_at || t.created_at,
      }));
  }, [crmTasksResult]);
  const allTasks = useMemo(() => [
    ...(allTasksRaw ?? []),
    ...crmTasks,
  ], [allTasksRaw, crmTasks]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ClientTask | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [showDone, setShowDone] = useState(false);

  const today = startOfDay(new Date());

  const tasks = useMemo(() => {
    let list = allTasks ?? [];
    if (!isAdmin) {
      list = list.filter(t => t.assigned_to === user?.id || (!t.assigned_to && t.created_by === user?.id));
    }
    if (isAdmin && memberFilter !== "all") {
      list = list.filter(t => t.assigned_to === memberFilter || t.created_by === memberFilter);
    }
    if (priorityFilter !== "all") {
      list = list.filter(t => t.priority === priorityFilter);
    }
    return list;
  }, [allTasks, isAdmin, user?.id, memberFilter, priorityFilter]);

  const overdue = useMemo(() =>
    tasks.filter(t => t.status === "pending" && t.due_date && isBefore(parseISO(t.due_date), today))
      .sort((a, b) => (priorityConfig[a.priority]?.order ?? 1) - (priorityConfig[b.priority]?.order ?? 1)),
    [tasks, today]
  );

  const pending = useMemo(() =>
    tasks.filter(t => t.status === "pending" && (!t.due_date || !isBefore(parseISO(t.due_date), today)))
      .sort((a, b) => (priorityConfig[a.priority]?.order ?? 1) - (priorityConfig[b.priority]?.order ?? 1)),
    [tasks, today]
  );

  const done = useMemo(() =>
    tasks.filter(t => t.status === "done")
      .sort((a, b) => new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime()),
    [tasks]
  );

  const completedToday = done.filter(t => t.completed_at && isToday(parseISO(t.completed_at)));

  const getMemberName = (id: string | null) => members?.find(m => m.user_id === id)?.full_name || "";

  const handleCreate = (data: Record<string, unknown>) => {
    createTask.mutate({
      title: data.title as string,
      description: (data.description as string) || undefined,
      due_date: (data.due_date as string) || undefined,
      priority: (data.priority as string) || undefined,
      source: isAdmin && data.assigned_to ? "admin" : "manual",
      assigned_to: (data.assigned_to as string) || undefined,
      assigned_team: (data.assigned_team as string) || undefined,
    }, {
      onSuccess: () => { setCreateOpen(false); toast.success("Tarefa criada!"); },
    });
  };

  const handleEdit = (data: Record<string, unknown>) => {
    if (!editingTask) return;
    updateTask.mutate({
      id: editingTask.id,
      title: data.title as string,
      description: (data.description as string) || null,
      due_date: (data.due_date as string) || null,
      priority: data.priority as string,
      assigned_to: (data.assigned_to as string) || null,
      assigned_team: (data.assigned_team as string) || null,
    }, {
      onSuccess: () => { setEditingTask(null); toast.success("Tarefa atualizada!"); },
    });
  };

  const handleToggle = useCallback((id: string, markDone: boolean) => {
    toggleTask.mutate({ id, done: markDone }, {
      onSuccess: (result) => {
        if (markDone && result?.xpAwarded) {
          playSound("success");
          toast.success("+10 XP ⚡", { duration: 2000 });
        }
      },
    });
  }, [toggleTask]);

  const confirmDelete = () => {
    if (!deletingId) return;
    deleteTask.mutate(deletingId, {
      onSuccess: () => { setDeletingId(null); toast.success("Tarefa excluída"); },
    });
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-5">
        <PageHeader title="Tarefas" subtitle="Gerencie suas tarefas" icon={<CheckSquare className="w-5 h-5 text-primary" />} />
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="Tarefas"
        subtitle="Gerencie suas tarefas diárias e atribuições"
        icon={<CheckSquare className="w-5 h-5 text-primary" />}
        actions={<FeatureTutorialButton slug="checklist" />}
      />

      {/* KPI Header */}
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

      {/* Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32 h-8 text-xs"><Filter className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && members && members.length > 1 && (
            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="w-40 h-8 text-xs"><Users className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {members.map(m => (
                  <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || m.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nova Tarefa
        </Button>
      </div>

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <p className="text-xs font-bold uppercase tracking-wider text-destructive">Atrasadas ({overdue.length})</p>
          </div>
          <AnimatePresence mode="popLayout">
            {overdue.map((task, idx) => (
              <motion.div key={task.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ delay: idx * 0.03 }}>
                <TaskCard task={task} user={user} onToggle={handleToggle} onEdit={setEditingTask} onDelete={setDeletingId} getMemberName={getMemberName} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pending Section */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pendentes ({pending.length})</p>
          </div>
          <AnimatePresence mode="popLayout">
            {pending.map((task, idx) => (
              <motion.div key={task.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ delay: idx * 0.03 }}>
                <TaskCard task={task} user={user} onToggle={handleToggle} onEdit={setEditingTask} onDelete={setDeletingId} getMemberName={getMemberName} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {overdue.length === 0 && pending.length === 0 && done.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <CheckSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente no momento.</p>
          <p className="text-xs text-muted-foreground">Novas demandas do CRM aparecerão aqui automaticamente.</p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova Tarefa
          </Button>
        </div>
      )}

      {/* Completed Section (Collapsible) */}
      {done.length > 0 && (
        <Collapsible open={showDone} onOpenChange={setShowDone}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Concluídas ({done.length})
              <ChevronDown className={`w-3 h-3 transition-transform ${showDone ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1.5 mt-2">
            {done.map((task) => (
              <TaskCard key={task.id} task={task} user={user} onToggle={handleToggle} onEdit={setEditingTask} onDelete={setDeletingId} getMemberName={getMemberName} />
            ))}
          </CollapsibleContent>
        </Collapsible>
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
