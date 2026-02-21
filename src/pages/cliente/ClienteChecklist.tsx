import { useState } from "react";
import { CheckSquare, Plus, Sparkles, CheckCircle2, AlertCircle, Clock, Flame, Trophy } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChecklistItems, type ChecklistItem } from "@/data/clienteData";

function getPriority(item: ChecklistItem): "urgent" | "today" | "optional" {
  if (item.type === "Comercial") return "urgent";
  if (item.type === "Marketing") return "today";
  return "optional";
}

const priorityConfig = {
  urgent: { label: "Urgente", icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/5 border-destructive/10" },
  today: { label: "Hoje", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/5 border-amber-500/10" },
  optional: { label: "Opcional", icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/5 border-blue-500/10" },
};

const typeBadgeColor = (type: string) => {
  if (type === "Comercial") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  if (type === "Marketing") return "bg-purple-500/10 text-purple-500 border-purple-500/20";
  return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
};

export default function ClienteChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(() => getChecklistItems());
  const [newTask, setNewTask] = useState("");
  const [showInput, setShowInput] = useState(false);

  const completed = items.filter(i => i.done).length;
  const total = items.length;
  const progress = Math.round((completed / total) * 100);
  const streak = 5; // mock streak

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setItems(prev => [...prev, { id: Date.now().toString(), title: newTask, type: "Gestão", origin: "manual", done: false }]);
    setNewTask("");
    setShowInput(false);
  };

  const pendingItems = items.filter(i => !i.done);
  const doneItems = items.filter(i => i.done);

  // Group by priority
  const grouped = {
    urgent: pendingItems.filter(i => getPriority(i) === "urgent"),
    today: pendingItems.filter(i => getPriority(i) === "today"),
    optional: pendingItems.filter(i => getPriority(i) === "optional"),
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader
        title="Checklist do Dia"
        subtitle="Suas tarefas operacionais para hoje"
        icon={<CheckSquare className="w-5 h-5 text-primary" />}
        actions={
          <Button size="sm" variant="outline" onClick={() => setShowInput(!showInput)}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        }
      />

      {/* Progress + Streak */}
      <div className="flex items-center gap-4">
        {/* Circular progress */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{progress}%</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{completed} de {total} tarefas</p>
          <p className="text-xs text-muted-foreground mt-0.5">Continue assim!</p>
          <div className="flex items-center gap-1.5 mt-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-500">{streak} dias seguidos</span>
            <Trophy className="w-3.5 h-3.5 text-muted-foreground ml-2" />
            <span className="text-[10px] text-muted-foreground">Recorde: 12 dias</span>
          </div>
        </div>
      </div>

      {/* Add input */}
      {showInput && (
        <Card>
          <CardContent className="py-3">
            <div className="flex gap-2">
              <Input placeholder="Descreva a tarefa..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} className="text-sm" />
              <Button size="sm" onClick={addTask}>Criar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped pending tasks */}
      {pendingItems.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
          <p className="text-foreground font-medium">Tudo concluído!</p>
          <p className="text-sm text-muted-foreground">Você está em dia com suas atividades. 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(["urgent", "today", "optional"] as const).map(priority => {
            const group = grouped[priority];
            if (group.length === 0) return null;
            const config = priorityConfig[priority];
            const PriorityIcon = config.icon;
            return (
              <div key={priority}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <PriorityIcon className={`w-3.5 h-3.5 ${config.color}`} />
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${config.color}`}>{config.label}</span>
                  <Badge variant="outline" className="text-[9px] h-4">{group.length}</Badge>
                </div>
                <div className="space-y-1.5">
                  {group.map(item => (
                    <Card key={item.id} className={`border ${config.bg} transition-all duration-200 hover:shadow-sm`}>
                      <CardContent className="py-2.5 px-3 flex items-center gap-3">
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 hover:border-primary flex items-center justify-center transition-colors flex-shrink-0"
                        >
                        </button>
                        <span className="text-[13px] flex-1">{item.title}</span>
                        <div className="flex items-center gap-1.5">
                          {item.origin === "auto" && <Sparkles className="w-3 h-3 text-muted-foreground" />}
                          <Badge variant="outline" className={`text-[8px] ${typeBadgeColor(item.type)}`}>{item.type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Done Tasks */}
      {doneItems.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-2">Concluídas</p>
          {doneItems.map(item => (
            <Card key={item.id} className="opacity-50 transition-all duration-200 cursor-pointer hover:opacity-70" onClick={() => toggleItem(item.id)}>
              <CardContent className="py-2 px-3 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-[13px] flex-1 line-through text-muted-foreground">{item.title}</span>
                <Badge variant="outline" className={`text-[8px] ${typeBadgeColor(item.type)}`}>{item.type}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
