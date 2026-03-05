import { useState, useEffect, useCallback } from "react";
import { CheckSquare, Plus, CheckCircle2, Flame, Settings2, Zap, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useClienteChecklist, useClienteGamification, useClienteContentMutations } from "@/hooks/useClienteContent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CelebrationEffect, triggerCelebration } from "@/components/CelebrationEffect";

const categoryConfig: Record<string, { color: string; icon: string }> = {
  comercial: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: "💼" },
  marketing: { color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: "📣" },
  operacional: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: "⚙️" },
};

const streakMessages = [
  { min: 0, msg: "Comece hoje e construa sua sequência!" },
  { min: 1, msg: "Bom começo! Continue assim." },
  { min: 3, msg: "Estabilidade é a chave. Siga firme!" },
  { min: 7, msg: "Uma semana inteira! Você é consistente. 🔥" },
  { min: 14, msg: "Duas semanas! Hábito formado. 💪" },
  { min: 30, msg: "Maratonista! 30 dias inparáveis! 🏆" },
];

function getStreakMessage(days: number) {
  let msg = streakMessages[0].msg;
  for (const s of streakMessages) {
    if (days >= s.min) msg = s.msg;
  }
  return msg;
}

export default function ClienteChecklist() {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: items, isLoading } = useClienteChecklist(today);
  const { data: gamification } = useClienteGamification();
  const { createChecklistItem, toggleChecklistItem } = useClienteContentMutations();
  const [newTask, setNewTask] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [generating, setGenerating] = useState(false);

  const streakDays = gamification?.streak_days ?? 0;
  const xp = (gamification as any)?.xp ?? 0;

  useEffect(() => {
    if (!isLoading && items && user) {
      const hasSystemTasks = items.some((i: any) => i.source === "system");
      if (!hasSystemTasks) {
        setGenerating(true);
        supabase.functions
          .invoke("generate-daily-checklist")
          .then(() => {
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
      {
        onSuccess: (result) => {
          if (result?.allDone) {
            triggerCelebration();
          }
        },
      }
    );
  }, [toggleChecklistItem]);

  const pendingItems = allItems.filter((i: any) => !i.is_completed);
  const doneItems = allItems.filter((i: any) => i.is_completed);

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
      <div className="w-full space-y-5">
        <PageHeader title="Checklist do Dia" subtitle="Suas tarefas operacionais para hoje" icon={<CheckSquare className="w-5 h-5 text-primary" />} />
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      </div>
    );
  }

  const pendingGroups = groupByCategory(pendingItems);

  return (
    <div className="w-full space-y-5">
      <CelebrationEffect />

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

      {/* Progress + Streak Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <motion.circle
              cx="40" cy="40" r="34" fill="none"
              stroke={progressColor}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - progress / 100) }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{progress}%</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{completed} de {allItems.length} tarefas</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {progress === 100 ? "Tudo concluído! 🎉 +50 XP bônus" : `+10 XP por tarefa concluída`}
          </p>
          {/* Streak */}
          <div className="flex items-center gap-2 mt-2">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 ${streakDays > 7 ? "animate-pulse" : ""}`}>
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[11px] font-bold text-orange-500">{streakDays} dias</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{getStreakMessage(streakDays)}</span>
          </div>
        </div>
      </motion.div>

      {showInput && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <Card>
            <CardContent className="py-3">
              <div className="flex gap-2">
                <Input placeholder="Descreva a tarefa..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} className="text-sm" />
                <Button size="sm" onClick={addTask} disabled={createChecklistItem.isPending}>Criar</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {pendingItems.length === 0 && doneItems.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
          <p className="text-foreground font-medium">Nenhuma tarefa ainda</p>
          <p className="text-sm text-muted-foreground">Suas tarefas automáticas serão geradas em breve.</p>
        </motion.div>
      ) : pendingItems.length === 0 ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: 2, duration: 0.5 }}>
            <Sparkles className="h-12 w-12 mx-auto mb-3 text-primary" />
          </motion.div>
          <p className="text-foreground font-medium text-lg">Tudo concluído! 🎉</p>
          <p className="text-sm text-muted-foreground">Parabéns! Você está em dia com suas atividades.</p>
          <Badge className="mt-2 text-xs" variant="secondary">+50 XP bônus ganhos</Badge>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {Object.entries(pendingGroups).map(([cat, catItems]) => {
            const config = categoryConfig[cat] || categoryConfig.operacional;
            return (
              <div key={cat} className="space-y-1.5">
                <div className="flex items-center gap-2 px-1 mb-1">
                  <span className="text-sm">{config.icon}</span>
                  <Badge variant="outline" className={`text-[10px] capitalize ${config.color}`}>
                    {cat}
                  </Badge>
                  <Badge variant="secondary" className="text-[9px]">{catItems.length}</Badge>
                </div>
                <AnimatePresence mode="popLayout">
                  {catItems.map((item: any, idx: number) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30, scale: 0.9 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                    >
                      <Card className="border bg-muted/5 transition-all duration-200 hover:shadow-sm group">
                        <CardContent className="py-2.5 px-3 flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.3 }}
                            whileTap={{ scale: 0.7 }}
                            onClick={() => handleToggle(item.id, item.is_completed)}
                            className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
                          />
                          <span className="text-[13px] flex-1">{item.title}</span>
                          <div className="flex items-center gap-1.5">
                            {item.source === "system" && (
                              <Badge variant="outline" className="text-[9px] gap-1 border-primary/20 text-primary">
                                <Settings2 className="w-2.5 h-2.5" /> Auto
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">
                              <Zap className="w-2 h-2 mr-0.5" />+10 XP
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Done Items */}
      <AnimatePresence>
        {doneItems.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-2">
              Concluídas ({doneItems.length})
            </p>
            {doneItems.map((item: any) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="opacity-50 transition-all duration-200 cursor-pointer hover:opacity-70" onClick={() => handleToggle(item.id, item.is_completed)}>
                  <CardContent className="py-2 px-3 flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    </motion.div>
                    <span className="text-[13px] flex-1 line-through text-muted-foreground">{item.title}</span>
                    {item.source === "system" && (
                      <Badge variant="outline" className="text-[9px] gap-1 border-primary/20 text-primary opacity-60">
                        <Settings2 className="w-2.5 h-2.5" /> Auto
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
