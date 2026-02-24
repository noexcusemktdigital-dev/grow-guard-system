import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "@/hooks/useUserOrgId";

interface RankEntry {
  user_id: string;
  full_name: string;
  completed_lessons: number;
  total_score: number;
}

export function AcademyRanking() {
  const { data: orgId } = useUserOrgId();

  const { data: ranking, isLoading } = useQuery({
    queryKey: ["academy-ranking", orgId],
    queryFn: async () => {
      // Get all progress for org users via academy_progress joined with profiles
      const { data: progressData, error: pError } = await supabase
        .from("academy_progress")
        .select("user_id, completed_at");
      if (pError) throw pError;

      // Get quiz attempts
      const { data: attempts, error: aError } = await supabase
        .from("academy_quiz_attempts")
        .select("user_id, score, passed");
      if (aError) throw aError;

      // Get profiles
      const userIds = [...new Set([
        ...(progressData || []).map((p) => p.user_id),
        ...(attempts || []).map((a) => a.user_id),
      ])];

      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p.full_name || "Usuário"]));

      // Aggregate
      const userMap = new Map<string, RankEntry>();
      for (const uid of userIds) {
        const completedLessons = (progressData || []).filter((p) => p.user_id === uid && p.completed_at).length;
        const totalScore = (attempts || []).filter((a) => a.user_id === uid).reduce((s, a) => s + a.score, 0);
        userMap.set(uid, {
          user_id: uid,
          full_name: profileMap.get(uid) || "Usuário",
          completed_lessons: completedLessons,
          total_score: totalScore + completedLessons * 10, // 10 pts per lesson
        });
      }

      return Array.from(userMap.values()).sort((a, b) => b.total_score - a.total_score);
    },
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  if (!ranking || ranking.length === 0) {
    return (
      <div className="text-center py-16">
        <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Nenhum dado de ranking</p>
        <p className="text-xs text-muted-foreground mt-1">Complete aulas para aparecer no ranking.</p>
      </div>
    );
  }

  const podiumIcons = [Trophy, Medal, Award];
  const podiumColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];

  return (
    <Card className="glass-card">
      <CardContent className="p-5">
        <h3 className="text-sm font-bold mb-4">Ranking da Equipe</h3>
        <div className="space-y-2">
          {ranking.map((entry, i) => {
            const isTop3 = i < 3;
            const PodiumIcon = isTop3 ? podiumIcons[i] : User;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${isTop3 ? "bg-primary/5" : "hover:bg-muted/30"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isTop3 ? "bg-primary/10" : "bg-muted/20"}`}>
                  {isTop3 ? (
                    <PodiumIcon className={`w-4 h-4 ${podiumColors[i]}`} />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${isTop3 ? "font-bold" : "font-medium"}`}>{entry.full_name}</p>
                  <p className="text-[10px] text-muted-foreground">{entry.completed_lessons} aulas concluídas</p>
                </div>
                <Badge variant={isTop3 ? "default" : "secondary"} className="text-[10px]">
                  {entry.total_score} pts
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
