import { useMemo, useCallback } from "react";
import {
  Trophy, Medal, Star, Target, Coins, Timer, BarChart3, Award,
  TrendingUp, Users, Crown, Lock, Gift, CheckCircle2, Flame,
  Send, Globe, Bot, FileText, Sparkles, Shield, Sword, Gem,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useClienteGamification } from "@/hooks/useClienteContent";
import { useCrmLeads } from "@/hooks/useClienteCrm";
import { useCrmTeam } from "@/hooks/useCrmTeam";
import { useMyEvaluations } from "@/hooks/useEvaluations";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useClienteContent, useClienteDispatches, useClienteSites } from "@/hooks/useClienteContent";
import { useClienteAgents } from "@/hooks/useClienteAgents";

const LEVELS = [
  { name: "Novato", minXp: 0, maxXp: 499, icon: Shield, color: "text-muted-foreground" },
  { name: "Aprendiz", minXp: 500, maxXp: 1499, icon: Sword, color: "text-blue-500" },
  { name: "Profissional", minXp: 1500, maxXp: 3499, icon: Star, color: "text-purple-500" },
  { name: "Especialista", minXp: 3500, maxXp: 6999, icon: Gem, color: "text-amber-500" },
  { name: "Mestre", minXp: 7000, maxXp: 11999, icon: Crown, color: "text-orange-500" },
  { name: "Lenda", minXp: 12000, maxXp: Infinity, icon: Trophy, color: "text-primary" },
];

const medalIcons: Record<string, React.ElementType> = {
  lead: Target, sales: Coins, streak: Timer, crm: BarChart3, closer: Trophy,
  content: FileText, dispatch: Send, site: Globe, agent: Bot,
};

const medalColors: Record<string, { bg: string; text: string; border: string }> = {
  lead: { bg: "bg-blue-500/15", text: "text-blue-500", border: "border-blue-500/30" },
  sales: { bg: "bg-amber-500/15", text: "text-amber-500", border: "border-amber-500/30" },
  streak: { bg: "bg-orange-500/15", text: "text-orange-500", border: "border-orange-500/30" },
  crm: { bg: "bg-purple-500/15", text: "text-purple-500", border: "border-purple-500/30" },
  closer: { bg: "bg-yellow-500/15", text: "text-yellow-500", border: "border-yellow-500/30" },
  content: { bg: "bg-emerald-500/15", text: "text-emerald-500", border: "border-emerald-500/30" },
  dispatch: { bg: "bg-rose-500/15", text: "text-rose-500", border: "border-rose-500/30" },
  site: { bg: "bg-cyan-500/15", text: "text-cyan-500", border: "border-cyan-500/30" },
  agent: { bg: "bg-violet-500/15", text: "text-violet-500", border: "border-violet-500/30" },
};

const allMedals = [
  { id: "1", name: "Primeiro Lead", emoji: "lead", description: "Captou o primeiro lead", condition: "1+ lead criado" },
  { id: "2", name: "Vendedor Nato", emoji: "sales", description: "10 vendas fechadas", condition: "10+ ganhos" },
  { id: "3", name: "Maratonista", emoji: "streak", description: "30 dias de streak", condition: "30 dias seguidos" },
  { id: "5", name: "Mestre do CRM", emoji: "crm", description: "100 leads gerenciados", condition: "100+ leads" },
  { id: "6", name: "Top Closer", emoji: "closer", description: "R$ 100k em vendas", condition: "R$100k+ vendas" },
  { id: "7", name: "Estrategista Digital", emoji: "content", description: "5 conteúdos gerados", condition: "5+ conteúdos" },
  { id: "8", name: "Atirador de Elite", emoji: "dispatch", description: "10 disparos enviados", condition: "10+ disparos" },
  { id: "9", name: "Construtor", emoji: "site", description: "1 site gerado", condition: "1+ site" },
  { id: "10", name: "Automatizador", emoji: "agent", description: "1 agente IA ativo", condition: "1+ agente ativo" },
];

const rewardTiers = [
  { level: 2, title: "+50 Créditos Bônus", description: "Desbloqueie ao atingir o nível Aprendiz", type: "bonus_credits", value: 50 },
  { level: 3, title: "+200 Créditos Bônus", description: "Desbloqueie ao atingir o nível Profissional", type: "bonus_credits", value: 200 },
  { level: 4, title: "5% Desconto no Plano", description: "Desbloqueie ao atingir o nível Especialista", type: "discount", value: 5 },
  { level: 5, title: "+500 Créditos + Geração Extra", description: "Desbloqueie ao atingir o nível Mestre", type: "bonus_credits", value: 500 },
  { level: 6, title: "10% Desconto + 1000 Créditos", description: "Desbloqueie ao atingir o nível Lenda", type: "bonus_credits", value: 1000 },
];

function getLevelInfo(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      const current = LEVELS[i];
      const next = LEVELS[i + 1];
      const progressInLevel = next ? ((xp - current.minXp) / (next.minXp - current.minXp)) * 100 : 100;
      return { level: i + 1, title: current.name, nextTitle: next?.name, xpToNext: next ? next.minXp - xp : 0, progress: Math.min(progressInLevel, 100), icon: current.icon, color: current.color };
    }
  }
  return { level: 1, title: "Novato", nextTitle: "Aprendiz", xpToNext: 500, progress: 0, icon: Shield, color: "text-muted-foreground" };
}

export default function ClienteGamificacao() {
  const { user } = useAuth();
  const { data: orgId } = useUserOrgId();
  const qc = useQueryClient();
  const { data: gamification, isLoading } = useClienteGamification();
  const { data: leads } = useCrmLeads();
  const { data: team } = useCrmTeam();
  const { data: myEvals } = useMyEvaluations();
  const { data: contents } = useClienteContent();
  const { data: dispatches } = useClienteDispatches();
  const { data: sites } = useClienteSites();
  const { data: agents } = useClienteAgents();

  // Claims
  const { data: claims } = useQuery({
    queryKey: ["gamification-claims", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gamification_claims" as any)
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const claimReward = useMutation({
    mutationFn: async ({ level, value }: { level: number; value: number }) => {
      // Insert claim
      const { error: claimError } = await supabase
        .from("gamification_claims" as any)
        .insert({ user_id: user!.id, organization_id: orgId!, reward_id: `level-${level}` as any, status: "claimed" } as any);
      if (claimError) throw claimError;

      // Credit bonus to wallet if applicable
      if (value > 0) {
        const { data: wallet } = await supabase
          .from("credit_wallets")
          .select("id, balance")
          .eq("organization_id", orgId!)
          .maybeSingle();

        if (wallet) {
          await supabase.from("credit_wallets").update({ balance: (wallet.balance || 0) + value }).eq("id", wallet.id);
          await supabase.from("credit_transactions").insert({
            organization_id: orgId!,
            type: "bonus",
            amount: value,
            balance_after: (wallet.balance || 0) + value,
            description: `Recompensa de gamificação - Nível ${level}`,
            metadata: { source: "gamification_reward", level },
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gamification-claims"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
      toast.success("Recompensa resgatada com sucesso! 🎉");
    },
    onError: () => toast.error("Erro ao resgatar recompensa"),
  });

  const myLeads = leads?.filter(l => l.assigned_to === user?.id) ?? [];
  const totalLeads = myLeads.length;
  const wonLeads = myLeads.filter(l => !!l.won_at).length;
  const pipelineValue = myLeads.filter(l => !l.won_at && !l.lost_at).reduce((acc, l) => acc + Number(l.value || 0), 0);
  const wonValue = myLeads.filter(l => !!l.won_at).reduce((acc, l) => acc + Number(l.value || 0), 0);

  const contentCount = contents?.length ?? 0;
  const dispatchCount = dispatches?.length ?? 0;
  const siteCount = sites?.length ?? 0;
  const activeAgents = (agents || []).filter(a => a.status === "active").length;

  const xp = (gamification as any)?.xp ?? 0;
  const streakDays = gamification?.streak_days ?? 0;
  const points = gamification?.points ?? 0;

  const levelInfo = getLevelInfo(xp);
  const LevelIcon = levelInfo.icon;

  // Auto-unlock medals based on real data
  const medals = useMemo(() => {
    return allMedals.map(m => {
      let unlocked = false;
      if (m.emoji === "lead" && totalLeads >= 1) unlocked = true;
      if (m.emoji === "sales" && wonLeads >= 10) unlocked = true;
      if (m.emoji === "streak" && streakDays >= 30) unlocked = true;
      if (m.emoji === "crm" && totalLeads >= 100) unlocked = true;
      if (m.emoji === "closer" && wonValue >= 100000) unlocked = true;
      if (m.emoji === "content" && contentCount >= 5) unlocked = true;
      if (m.emoji === "dispatch" && dispatchCount >= 10) unlocked = true;
      if (m.emoji === "site" && siteCount >= 1) unlocked = true;
      if (m.emoji === "agent" && activeAgents >= 1) unlocked = true;
      return { ...m, unlocked };
    });
  }, [totalLeads, wonLeads, streakDays, wonValue, contentCount, dispatchCount, siteCount, activeAgents]);

  const unlockedCount = medals.filter(m => m.unlocked).length;

  const avgEval = myEvals && myEvals.length > 0
    ? (myEvals.reduce((a, e) => a + e.score, 0) / myEvals.length).toFixed(1)
    : null;

  const teamRanking = useMemo(() => {
    return (team ?? []).map(member => {
      const memberLeads = leads?.filter(l => l.assigned_to === member.user_id) ?? [];
      const memberWon = memberLeads.filter(l => !!l.won_at).length;
      const memberPoints = (memberLeads.length * 10) + (memberWon * 50);
      return { ...member, totalLeads: memberLeads.length, wonLeads: memberWon, points: memberPoints };
    }).sort((a, b) => b.points - a.points);
  }, [team, leads]);

  const claimedLevels = useMemo(() => {
    return new Set((claims || []).map((c: any) => c.reward_id));
  }, [claims]);

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Gamificação" subtitle="Seus pontos, medalhas e ranking" icon={<Trophy className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  const rankBadges = ["🥇", "🥈", "🥉"];

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Gamificação" subtitle="Seus pontos, evolução e recompensas" icon={<Trophy className="w-5 h-5 text-primary" />} />

      {/* Evolution Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <CardContent className="py-6 relative">
            <div className="flex items-center gap-6">
              <motion.div
                className="text-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 mx-auto border-2 border-primary/20`}>
                  <LevelIcon className={`w-8 h-8 ${levelInfo.color}`} />
                </div>
                <p className={`text-lg font-black ${levelInfo.color}`}>{levelInfo.title}</p>
                <p className="text-[10px] text-muted-foreground">Nível {levelInfo.level}</p>
              </motion.div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{xp.toLocaleString()} XP</span>
                  {levelInfo.nextTitle && (
                    <span className="text-muted-foreground">{levelInfo.xpToNext} XP para {levelInfo.nextTitle}</span>
                  )}
                </div>
                <div className="relative">
                  <Progress value={levelInfo.progress} className="h-3" />
                  <motion.div
                    className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-transparent to-white/20"
                    style={{ width: `${levelInfo.progress}%` }}
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </div>
                <div className="flex gap-4 text-[10px] text-muted-foreground">
                  <div className={`flex items-center gap-1 ${streakDays > 7 ? "animate-pulse" : ""}`}>
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span className="font-bold text-orange-500">{streakDays} dias</span> de sequência
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>{points.toLocaleString()} pontos</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Manager Evaluation + CRM Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <CardTitle className="text-sm font-semibold">Avaliação do Gestor</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {avgEval ? (
                <div className="text-center py-2">
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-6 h-6 ${s <= Math.round(Number(avgEval)) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                  <p className="text-2xl font-bold">{avgEval}</p>
                  <p className="text-xs text-muted-foreground">{myEvals?.length} avaliações recebidas</p>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma avaliação ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Desempenho</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: totalLeads, label: "Leads" },
                  { value: wonLeads, label: "Ganhos" },
                  { value: `R$ ${(wonValue / 1000).toFixed(0)}k`, label: "Vendas" },
                  { value: `R$ ${(pipelineValue / 1000).toFixed(0)}k`, label: "Pipeline" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="p-2 rounded-lg bg-muted/30 text-center"
                  >
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Medals */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Medal className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Medalhas</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">{unlockedCount}/{medals.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {medals.map((m, idx) => {
                const MedalIcon = medalIcons[m.emoji] || Award;
                const colors = medalColors[m.emoji] || { bg: "bg-primary/15", text: "text-primary", border: "border-primary/30" };
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      m.unlocked
                        ? `${colors.border} bg-muted/30 hover:bg-muted/50 hover:shadow-sm`
                        : "opacity-30 grayscale"
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${m.unlocked ? colors.bg : "bg-muted/50"}`}>
                      <MedalIcon className={`w-5 h-5 ${m.unlocked ? colors.text : "text-muted-foreground"}`} />
                    </div>
                    <p className="text-xs font-semibold mt-1">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.description}</p>
                    <p className="text-[9px] text-muted-foreground/70 mt-0.5">{m.condition}</p>
                    {m.unlocked && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                        <Badge variant="secondary" className={`text-[9px] mt-2 ${colors.text}`}>
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Conquistada
                        </Badge>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Rewards */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Recompensas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rewardTiers.map((reward, i) => {
                const isUnlocked = levelInfo.level >= reward.level;
                const isClaimed = claimedLevels.has(`level-${reward.level}`);
                const tierLevel = LEVELS[reward.level - 1];
                const TierIcon = tierLevel.icon;

                return (
                  <motion.div
                    key={reward.level}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      isClaimed
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : isUnlocked
                        ? "bg-primary/5 border-primary/20 hover:shadow-sm"
                        : "opacity-50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isUnlocked ? "bg-primary/10" : "bg-muted/30"
                    }`}>
                      {isUnlocked ? (
                        <TierIcon className={`w-5 h-5 ${tierLevel.color}`} />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{reward.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Nível {reward.level} — {tierLevel.name}
                      </p>
                    </div>
                    {isClaimed ? (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Resgatado
                      </Badge>
                    ) : isUnlocked ? (
                      <Button
                        size="sm"
                        className="text-xs h-8 shrink-0"
                        onClick={() => claimReward.mutate({ level: reward.level, value: reward.value })}
                        disabled={claimReward.isPending}
                      >
                        <Gift className="w-3 h-3 mr-1" /> Resgatar
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        <Lock className="w-3 h-3 mr-1" /> Bloqueado
                      </Badge>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Team Ranking */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Ranking da Equipe</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {teamRanking.length <= 1 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Adicione membros à equipe para ver o ranking!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamRanking.map((member, idx) => {
                  const isMe = member.user_id === user?.id;
                  const initials = member.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <motion.div
                      key={member.user_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + idx * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isMe ? "bg-primary/10 border border-primary/20" : "bg-muted/20 hover:bg-muted/30"}`}
                    >
                      <span className="text-lg font-bold w-8 text-center">
                        {idx < 3 ? rankBadges[idx] : `${idx + 1}º`}
                      </span>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{member.full_name} {isMe && <span className="text-primary">(você)</span>}</p>
                        <p className="text-[10px] text-muted-foreground">{member.totalLeads} leads · {member.wonLeads} ganhos</p>
                      </div>
                      <Badge variant={idx === 0 ? "default" : "outline"} className="text-[10px]">{member.points} pts</Badge>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
