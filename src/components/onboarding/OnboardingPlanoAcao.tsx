import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { OnboardingTask, TaskStatus } from "@/types/onboarding";
import { TASK_STATUS_COLORS } from "@/types/onboarding";

interface OnboardingPlanoAcaoProps {
  tasks: OnboardingTask[];
  onboardingId: string;
  onUpdate: (tasks: OnboardingTask[]) => void;
}

export function OnboardingPlanoAcao({ tasks, onboardingId, onUpdate }: OnboardingPlanoAcaoProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<OnboardingTask | null>(null);
  const [tarefa, setTarefa] = useState("");
  const [responsavel, setResponsavel] = useState("CS");
  const [prazo, setPrazo] = useState("");
  const [observacao, setObservacao] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const getStatus = (task: OnboardingTask): TaskStatus => {
    if (task.status === "Concluída") return "Concluída";
    if (task.prazo < today) return "Atrasada";
    return "Aberta";
  };

  const handleSave = () => {
    if (!tarefa || !prazo) return;
    if (editingTask) {
      onUpdate(tasks.map((t) => t.id === editingTask.id ? { ...t, tarefa, responsavel, prazo, observacao } : t));
    } else {
      const newTask: OnboardingTask = {
        id: `tk-${Date.now()}`,
        onboardingId,
        tarefa,
        responsavel,
        prazo,
        status: "Aberta",
        observacao,
      };
      onUpdate([...tasks, newTask]);
    }
    resetForm();
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingTask(null);
    setTarefa("");
    setResponsavel("CS");
    setPrazo("");
    setObservacao("");
  };

  const handleEdit = (task: OnboardingTask) => {
    setEditingTask(task);
    setTarefa(task.tarefa);
    setResponsavel(task.responsavel);
    setPrazo(task.prazo);
    setObservacao(task.observacao || "");
    setDialogOpen(true);
  };

  const handleToggle = (id: string) => {
    onUpdate(tasks.map((t) => t.id === id ? { ...t, status: t.status === "Concluída" ? "Aberta" : "Concluída" as TaskStatus } : t));
  };

  const handleDelete = (id: string) => {
    onUpdate(tasks.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Nova Tarefa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Tarefa</Label>
                <Input value={tarefa} onChange={(e) => setTarefa(e.target.value)} placeholder="Descreva a tarefa" />
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={responsavel} onValueChange={setResponsavel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CS">CS</SelectItem>
                    <SelectItem value="Franqueado">Franqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Observação</Label>
                <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Opcional" />
              </div>
              <Button onClick={handleSave} className="w-full">{editingTask ? "Salvar" : "Criar Tarefa"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Tarefa</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const displayStatus = getStatus(task);
              const isAtrasada = displayStatus === "Atrasada";
              return (
                <TableRow key={task.id} className={isAtrasada ? "bg-red-50 dark:bg-red-950/20" : ""}>
                  <TableCell>
                    <Checkbox checked={task.status === "Concluída"} onCheckedChange={() => handleToggle(task.id)} />
                  </TableCell>
                  <TableCell className={`text-sm font-medium ${task.status === "Concluída" ? "line-through text-muted-foreground" : ""}`}>
                    {task.tarefa}
                  </TableCell>
                  <TableCell className="text-sm">{task.responsavel}</TableCell>
                  <TableCell className="text-sm">{new Date(task.prazo).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${TASK_STATUS_COLORS[displayStatus]}`}>{displayStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{task.observacao || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleEdit(task)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => handleDelete(task.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma tarefa cadastrada.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
