// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame } from "lucide-react";
import { motion } from "framer-motion";

interface LevelInfo {
  level: number;
  title: string;
  nextTitle?: string;
  xpToNext: number;
  progress: number;
}

interface ClienteInicioLevelCardProps {
  levelInfo: LevelInfo;
  xp: number;
  streakDays: number;
}

export function ClienteInicioLevelCard({ levelInfo, xp, streakDays }: ClienteInicioLevelCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
      <Card
        className="border-primary/15 bg-gradient-to-br from-primary/5 to-transparent cursor-pointer hover:shadow-md transition-all"
        onClick={() => navigate("/cliente/gamificacao")}
      >
        <CardContent className="py-4 px-5">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-primary">{levelInfo.title}</span>
                <span className="text-[10px] text-muted-foreground">Nível {levelInfo.level}</span>
              </div>
              <Progress value={levelInfo.progress} className="h-2" />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{xp} XP</span>
                {levelInfo.nextTitle && (
                  <span className="text-[10px] text-muted-foreground">{levelInfo.xpToNext} para {levelInfo.nextTitle}</span>
                )}
              </div>
            </div>
            {streakDays > 0 && (
              <div className={`text-center ${streakDays > 7 ? "animate-pulse" : ""}`}>
                <Flame className="w-6 h-6 text-orange-500 mx-auto" />
                <span className="text-xs font-bold text-orange-500">{streakDays}d</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
