import { useState } from "react";
import { CheckSquare, Plus, Sparkles, CheckCircle2, AlertCircle, Clock, Flame, Trophy, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useClienteChecklist, useClienteContentMutations } from "@/hooks/useClienteContent";
import { format } from "date-fns";

const typeBadgeColor = (type: string) => {
  if (type === "Comercial") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  if (type === "Marketing") return "bg-purple-500/10 text-purple-500 border-purple-500/20";
  return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
};

export default function ClienteChecklist() {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: items, isLoading } = useClienteChecklist(today);
  const { createChecklistItem } = useClienteContentMutations();
  const [newTask, setNewTask] = useState("");
  const [showInput, setShowInput] = useState(false);

  const allItems = items ?? [];
  const completed = allItems.filter(i => i.is_completed).length;
  const total = allItems.length || 1;
  const progress = Math.round((completed / total) * 100);
  const streak = 5; // TODO: calculate from DB

  const addTask = () => {
    if (!newTask.trim()) return;
    createChecklistItem.mutate({ title: newTask, date: today });
    setNewTask("");
    setShowInput(false);
  };

  const pendingItems = allItems.filter(i => !i.is_completed);
  const doneItems = allItems.filter(i => i.is_completed);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <PageHeader title="Checklist do Dia" subtitle="Suas tarefas operacionais para hoje" icon={<CheckSquare className="w-5 h-5 text-primary" />} />
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      </div>
    );
  }

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
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 34}`} strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`} className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{progress}%</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{completed} de {allItems.length} tarefas</p>
          <p className="text-xs text-muted-foreground mt-0.5">Continue assim!</p>
          <div className="flex items-center gap-1.5 mt-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-500">{streak} dias seguidos</span>
            <Trophy className="w-3.5 h-3.5 text-muted-foreground ml-2" />
            <span className="text-[10px] text-muted-foreground">Recorde: 12 dias</span>
          </div>
        </div>
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
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
          <p className="text-foreground font-medium">Nenhuma tarefa ainda</p>
          <p className="text-sm text-muted-foreground">Adicione tarefas ao seu checklist diário.</p>
        </div>
      ) : pendingItems.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
          <p className="text-foreground font-medium">Tudo concluído!</p>
          <p className="text-sm text-muted-foreground">Você está em dia com suas atividades. 🎉</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {pendingItems.map(item => (
            <Card key={item.id} className="border bg-muted/5 transition-all duration-200 hover:shadow-sm">
              <CardContent className="py-2.5 px-3 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 hover:border-primary flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer" />
                <span className="text-[13px] flex-1">{item.title}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {doneItems.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-2">Concluídas</p>
          {doneItems.map(item => (
            <Card key={item.id} className="opacity-50 transition-all duration-200 cursor-pointer hover:opacity-70">
              <CardContent className="py-2 px-3 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-[13px] flex-1 line-through text-muted-foreground">{item.title}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
