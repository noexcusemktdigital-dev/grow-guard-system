// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, ChevronRight, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  title: string;
  is_completed: boolean | null;
}

interface ClienteInicioTasksProps {
  pendingTasks: Task[];
  completedTasks: Task[];
  taskProgress: number;
  handleToggleTask: (id: string, currentState: boolean) => void;
}

export function ClienteInicioTasks({
  pendingTasks,
  completedTasks,
  taskProgress,
  handleToggleTask,
}: ClienteInicioTasksProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-3 px-5 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckSquare className="w-3.5 h-3.5 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold">Tarefas do Dia</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">{Math.round(taskProgress)}%</span>
            <div className="w-8 h-8 relative">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none"
                  stroke={taskProgress >= 70 ? "hsl(142, 71%, 45%)" : taskProgress >= 30 ? "hsl(38, 92%, 50%)" : "hsl(var(--destructive))"}
                  strokeWidth="3"
                  strokeDasharray={`${taskProgress * 0.942} 100`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {pendingTasks.slice(0, 5).map((t, i) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-all duration-200 cursor-pointer"
                onClick={() => handleToggleTask(t.id, !!t.is_completed)}
              >
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary transition-colors flex-shrink-0"
                />
                <span className="text-[13px] flex-1 text-foreground/80 group-hover:text-foreground transition-colors">{t.title}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {completedTasks.length > 0 && (
            <div className="pt-2 border-t border-border/50 mt-2">
              {completedTasks.slice(0, 3).map(t => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-2 rounded-lg opacity-50 hover:opacity-70 cursor-pointer transition-all"
                  onClick={() => handleToggleTask(t.id, !!t.is_completed)}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-[13px] flex-1 line-through text-muted-foreground">{t.title}</span>
                </div>
              ))}
            </div>
          )}
          {pendingTasks.length === 0 && completedTasks.length === 0 && (
            <div className="flex flex-col items-center py-4">
              <CheckSquare className="w-6 h-6 text-muted-foreground/30 mb-1.5" />
              <p className="text-xs text-muted-foreground mb-2">Nenhuma tarefa para hoje</p>
              <Button variant="outline" size="sm" className="text-xs h-7 rounded-lg" onClick={() => navigate("/cliente/checklist")}>
                Gerar Checklist <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-3 text-xs h-8 text-muted-foreground hover:text-foreground" onClick={() => navigate("/cliente/checklist")}>
          Ver checklist completo <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
