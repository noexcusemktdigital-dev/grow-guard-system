import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Sparkles, Trophy, ListChecks, Users, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

interface LevelInfo {
  level: number;
  title: string;
  nextTitle?: string;
  xpToNext: number;
  progress: number;
}

interface ClienteInicioHeroProps {
  greeting: string;
  greetingEmoji: ReactNode;
  xp: number;
  levelInfo: LevelInfo;
  streakDays: number;
  dailyPhrase: string;
  dailyMessageAuthor?: string;
  pendingTasksCount: number;
  thisMonthLeadsCount: number;
  goalPercent: number;
  now: Date;
}

export function ClienteInicioHero({
  greeting,
  greetingEmoji,
  xp,
  levelInfo,
  streakDays,
  dailyPhrase,
  dailyMessageAuthor,
  pendingTasksCount,
  thisMonthLeadsCount,
  goalPercent,
  now,
}: ClienteInicioHeroProps) {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/3 pointer-events-none" />
        <CardContent className="relative p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                {greetingEmoji}
                <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {greeting}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR }).replace(/^./, c => c.toUpperCase())}
              </p>
            </div>
            {/* Gamification mini badge */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/cliente/gamificacao")}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10 hover:border-primary/30 transition-all"
            >
              <Trophy className="w-4 h-4 text-primary" />
              <div className="text-left">
                <p className="text-[10px] font-bold text-primary">{levelInfo.title}</p>
                <p className="text-[9px] text-muted-foreground">{xp} XP</p>
              </div>
              {streakDays > 0 && (
                <span className={`text-sm ${streakDays > 7 ? "animate-pulse" : ""}`}>🔥{streakDays}</span>
              )}
            </motion.button>
          </div>

          <div className="flex items-start gap-3 bg-background/60 rounded-xl p-3.5">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground/90 italic leading-relaxed">"{dailyPhrase}"</p>
              {dailyMessageAuthor && (
                <p className="text-[10px] text-muted-foreground mt-1">— {dailyMessageAuthor}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-primary" />
              <span><span className="text-foreground font-semibold">{pendingTasksCount}</span> tarefas pendentes</span>
            </div>
            <span className="text-muted-foreground/40">·</span>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span><span className="text-foreground font-semibold">{thisMonthLeadsCount}</span> leads no mês</span>
            </div>
            <span className="text-muted-foreground/40">·</span>
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span>Meta em <span className="text-foreground font-semibold">{Math.min(goalPercent, 100).toFixed(0)}%</span></span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
