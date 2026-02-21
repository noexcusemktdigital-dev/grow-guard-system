import { useState, useMemo } from "react";
import { CheckSquare, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { getChecklistItems, type ChecklistItem } from "@/data/clienteData";

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

      {/* Tasks */}
      <div className="space-y-2">
        {items.map(item => (
          <Card key={item.id} className={`transition-all duration-300 cursor-pointer hover:shadow-md ${item.done ? "opacity-60" : ""}`} onClick={() => toggleItem(item.id)}>
            <CardContent className="py-3 flex items-center gap-4">
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${item.done ? "bg-primary border-primary scale-110" : "border-muted-foreground/30 hover:border-primary/50"}`}>
                {item.done && <CheckSquare className="w-4 h-4 text-primary-foreground" />}
              </div>
              <span className={`text-sm flex-1 ${item.done ? "line-through text-muted-foreground" : ""}`}>{item.title}</span>
              <div className="flex items-center gap-2">
                {item.origin === "auto" && <Sparkles className="w-3 h-3 text-muted-foreground" />}
                <Badge variant="outline" className={`text-[9px] ${typeBadgeColor(item.type)}`}>{item.type}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
