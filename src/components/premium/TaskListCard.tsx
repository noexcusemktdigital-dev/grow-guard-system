// @ts-nocheck
import { useState } from "react";
import { Zap, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  time: string;
  done?: boolean;
}

interface TaskListCardProps {
  title?: string;
  tasks: TaskItem[];
  onTaskClick?: (task: TaskItem) => void;
}

export function TaskListCard({ title = "TAREFAS OPERACIONAIS", tasks, onTaskClick }: TaskListCardProps) {
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(tasks.filter(t => t.done).map(t => t.id))
  );

  const toggleTask = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hoje = format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR }).toUpperCase();

  return (
    <div className="glass-card p-6 lg:p-8 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="page-header-title text-base">{title}</h3>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground tracking-wider">{hoje}</span>
      </div>

      {/* Task List */}
      <div className="divide-y divide-border/50">
        {tasks.map((task) => {
          const isDone = completed.has(task.id);
          return (
            <div
              key={task.id}
              className="flex items-center gap-4 py-5 group transition-all duration-200"
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTask(task.id)}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isDone
                    ? "bg-emerald-500 border-emerald-500 text-white scale-95"
                    : "border-muted-foreground/20 hover:border-primary/50 bg-transparent"
                }`}
              >
                {isDone && <CheckCircle2 className="w-5 h-5" />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold transition-all duration-300 ${
                  isDone ? "line-through text-muted-foreground/50 italic" : "text-foreground"
                }`}>
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
              </div>

              {/* Time + Arrow */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs font-medium">{task.time}</span>
                </div>
                <button
                  onClick={() => onTaskClick?.(task)}
                  className="w-9 h-9 rounded-full bg-muted/40 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-200"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
