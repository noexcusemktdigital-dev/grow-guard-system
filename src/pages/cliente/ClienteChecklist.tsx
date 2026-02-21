import { useState } from "react";
import { CheckSquare, Plus, Sparkles, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { getChecklistItems, type ChecklistItem } from "@/data/clienteData";

function getPriority(item: ChecklistItem): "high" | "medium" | "low" {
  if (item.type === "Comercial") return "high";
  if (item.type === "Marketing") return "medium";
  return "low";
}

export default function ClienteChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(() => getChecklistItems());
  const [newTask, setNewTask] = useState("");
  const [showInput, setShowInput] = useState(false);

  const completed = items.filter(i => i.done).length;
  const progress = Math.round((completed / items.length) * 100);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setItems(prev => [...prev, { id: Date.now().toString(), title: newTask, type: "Gestão", origin: "manual", done: false }]);
    setNewTask("");
    setShowInput(false);
  };

  const typeBadgeColor = (type: string) => {
    if (type === "Comercial") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (type === "Marketing") return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  };

  const pendingItems = items.filter(i => !i.done);
  const doneItems = items.filter(i => i.done);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Checklist do Dia"
        subtitle="Suas tarefas operacionais para hoje"
        icon={<CheckSquare className="w-5 h-5 text-primary" />}
        actions={
          <Button size="sm" onClick={() => setShowInput(!showInput)}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        }
      />

      {/* Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso do dia</span>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">{completed} de {items.length} tarefas concluídas</p>
        </CardContent>
      </Card>

      {/* Add input */}
      {showInput && (
        <Card>
          <CardContent className="py-3">
            <div className="flex gap-2">
              <Input placeholder="Descreva a tarefa..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} />
              <Button size="sm" onClick={addTask}>Criar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Tasks */}
      {pendingItems.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
          <p className="text-foreground font-medium">Nenhuma tarefa pendente!</p>
          <p className="text-sm text-muted-foreground">Você está em dia com suas atividades. 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pendingItems.map(item => {
            const priority = getPriority(item);
            return (
              <Card key={item.id} className="transition-all duration-300 hover:shadow-md">
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {priority === "high" ? (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <span className="text-sm flex-1">{item.title}</span>
                  <div className="flex items-center gap-2">
                    {item.origin === "auto" && <Sparkles className="w-3 h-3 text-muted-foreground" />}
                    <Badge variant="outline" className={`text-[9px] ${typeBadgeColor(item.type)}`}>{item.type}</Badge>
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => toggleItem(item.id)}>Fazer</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Done Tasks */}
      {doneItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Concluídas</p>
          {doneItems.map(item => (
            <Card key={item.id} className="opacity-60 transition-all duration-300 cursor-pointer" onClick={() => toggleItem(item.id)}>
              <CardContent className="py-3 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm flex-1 line-through text-muted-foreground">{item.title}</span>
                <Badge variant="outline" className={`text-[9px] ${typeBadgeColor(item.type)}`}>{item.type}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
