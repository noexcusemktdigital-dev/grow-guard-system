import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

interface ClienteInicioProgressProps {
  dailyScore: number;
  taskProgress: number;
  goalPercent: number;
  todayLeadsCount: number;
}

export function ClienteInicioProgress({ dailyScore, taskProgress, goalPercent, todayLeadsCount }: ClienteInicioProgressProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
      <Card className="border-primary/10">
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Progresso do Dia</span>
            </div>
            <Badge variant={dailyScore >= 80 ? "default" : dailyScore >= 50 ? "secondary" : "outline"} className="text-xs">
              {dailyScore}/100
            </Badge>
          </div>
          <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                dailyScore >= 80 ? "bg-emerald-500" : dailyScore >= 50 ? "bg-amber-500" : "bg-destructive/70"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${dailyScore}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
            <span>Checklist {Math.round(taskProgress)}%</span>
            <span>Metas {Math.min(goalPercent, 100).toFixed(0)}%</span>
            <span>CRM {Math.min(todayLeadsCount * 20, 100)}%</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
