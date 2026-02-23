import { useState, useEffect } from "react";
import { CheckSquare, Plus, CheckCircle2, Flame, Trophy, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useClienteChecklist, useClienteContentMutations } from "@/hooks/useClienteContent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const categoryBadge = (cat: string) => {
  if (cat === "comercial") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  if (cat === "marketing") return "bg-purple-500/10 text-purple-500 border-purple-500/20";
  return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
};

export default function ClienteChecklist() {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: items, isLoading } = useClienteChecklist(today);
  const { createChecklistItem, toggleChecklistItem } = useClienteContentMutations();
  const [newTask, setNewTask] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Auto-generate daily tasks on first load
  useEffect(() => {
    if (!isLoading && items && user) {
      const hasSystemTasks = items.some((i: any) => i.source === "system");
      if (!hasSystemTasks) {
        setGenerating(true);
        supabase.functions
          .invoke("generate-daily-checklist")
          .then(() => {
            // Refetch after generation
            window.location.reload();
          })
          .catch(() => setGenerating(false));
      }
    }
  }, [isLoading, items?.length, user?.id]);

  const allItems = items ?? [];
  const completed = allItems.filter((i: any) => i.is_completed).length;
  const total = allItems.length || 1;
  const progress = Math.round((completed / total) * 100);

  // Calculate real streak from gamification data
  const streak = 0; // Will be shown from gamification

  const addTask = () => {
    if (!newTask.trim()) return;
    createChecklistItem.mutate({ title: newTask, date: today, source: "manual", category: "operacional" });
    setNewTask("");
    setShowInput(false);
  };

  const handleToggle = (id: string, currentState: boolean) => {
    toggleChecklistItem.mutate({ id, is_completed: !currentState });
  };

  const pendingItems = allItems.filter((i: any) => !i.is_completed);
  const doneItems = allItems.filter((i: any) => i.is_completed);

  // Group by category
  const groupByCategory = (list: any[]) => {
    const groups: Record<string, any[]> = {};
    list.forEach((item) => {
      const cat = item.category || "operacional";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  };

  if (isLoading || generating) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <PageHeader title="Checklist do Dia" subtitle="Suas tarefas operacionais para hoje" icon={<CheckSquare className="w-5 h-5 text-primary" />} />
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      </div>
    );
  }

  const pendingGroups = groupByCategory(pendingItems);

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

      {/* Progress */}
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
          <p className="text-xs text-muted-foreground mt-0.5">
            {progress === 100 ? "Tudo concluído! 🎉 +50 XP" : "Continue assim!"}
          </p>
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
          <p className="text-sm text-muted-foreground">Suas tarefas automáticas serão geradas em breve.</p>
        </div>
      ) : pendingItems.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
          <p className="text-foreground font-medium">Tudo concluído!</p>
          <p className="text-sm text-muted-foreground">Você está em dia com suas atividades. 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(pendingGroups).map(([cat, catItems]) => (
            <div key={cat} className="space-y-1.5">
              <div className="flex items-center gap-2 px-1 mb-1">
                <Badge variant="outline" className={`text-[10px] capitalize ${categoryBadge(cat)}`}>
                  {cat}
                </Badge>
              </div>
              {catItems.map((item: any) => (
                <Card key={item.id} className="border bg-muted/5 transition-all duration-200 hover:shadow-sm">
                  <CardContent className="py-2.5 px-3 flex items-center gap-3">
                    <div
                      onClick={() => handleToggle(item.id, item.is_completed)}
                      className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 hover:border-primary flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                    />
                    <span className="text-[13px] flex-1">{item.title}</span>
                    {item.source === "system" && (
                      <Badge variant="outline" className="text-[9px] gap-1 border-primary/20 text-primary">
                        <Settings2 className="w-2.5 h-2.5" /> Auto
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}

      {doneItems.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-2">Concluídas</p>
          {doneItems.map((item: any) => (
            <Card key={item.id} className="opacity-50 transition-all duration-200 cursor-pointer hover:opacity-70" onClick={() => handleToggle(item.id, item.is_completed)}>
              <CardContent className="py-2 px-3 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-[13px] flex-1 line-through text-muted-foreground">{item.title}</span>
                {item.source === "system" && (
                  <Badge variant="outline" className="text-[9px] gap-1 border-primary/20 text-primary opacity-60">
                    <Settings2 className="w-2.5 h-2.5" /> Auto
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
