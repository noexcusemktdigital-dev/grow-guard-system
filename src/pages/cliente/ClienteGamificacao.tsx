// @ts-nocheck
import { useMemo } from "react";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import {
  Trophy, Medal, Star, Target, Coins, Timer, BarChart3, Award,
  TrendingUp, Users, Crown, Lock, Gift, CheckCircle2, Flame,
  Send, Globe, Bot, FileText, Sparkles, Shield, Sword, Gem,
  User, Building2, Wifi, Clipboard, MessageCircle,
  Calendar, ListChecks, GraduationCap, GitBranch, Zap,
  ArrowRight, AlertTriangle,
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
import { reportError } from "@/lib/error-toast";
import { triggerCelebration } from "@/components/CelebrationEffect";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useGamificationData } from "@/hooks/useGamificationData";

import {
  LEVELS, ORG_LEVELS, medalIcons, medalColors, allMedals, rewardTiers,
  getLevelInfo, Medal3D, CompletenessScore, XpSuggestions,
} from "./ClienteGamificacaoHelpers";

export default function ClienteGamificacao() {
  const { user } = useAuth();
  const { isAdmin } = useRoleAccess();
  const qc = useQueryClient();

  // Single consolidated request — replaces 18 parallel hooks.
  const { data: g, isLoading } = useGamificationData();

  const orgId = g?.org_id ?? null;
  const profile = g?.profile ?? null;
  const org = g?.org ?? null;
  const gamification = g?.gamification ?? null;
  const counts = g?.counts;
  const waConnected = g?.flags.wa_connected ?? false;
  const hasStrategy = g?.flags.has_strategy ?? false;
  const teamRankingRaw = g?.team_ranking ?? [];
  const totalOrgXp = g?.total_org_xp ?? 0;
  const claimedSet = useMemo(() => new Set(g?.claimed_reward_ids ?? []), [g?.claimed_reward_ids]);

  const totalLeads = counts?.total_leads ?? 0;
  const wonLeads = counts?.won_leads ?? 0;
  const wonValue = counts?.won_value ?? 0;
  const pipelineValue = counts?.pipeline_value ?? 0;
  const completeLeads = counts?.complete_leads ?? 0;
  const contentCount = counts?.contents ?? 0;
  const dispatchCount = counts?.dispatches ?? 0;
  const siteCount = counts?.sites ?? 0;
  const activeAgents = counts?.active_agents ?? 0;
  const calendarEvents = counts?.calendar_events ?? 0;
  const checklistDoneCount = counts?.checklist_done ?? 0;
  const academyProgress = counts?.academy_done ?? 0;
  const customFunnels = counts?.custom_funnels ?? 0;

  const xp = (gamification as Record<string, unknown>)?.xp ?? 0;
  const streakDays = gamification?.streak_days ?? 0;
  const points = gamification?.points ?? 0;
  const lastActivity = gamification?.last_activity_at;
  const levelInfo = getLevelInfo(xp);
  const LevelIcon = levelInfo.icon;

  const orgLevelInfo = getLevelInfo(totalOrgXp, ORG_LEVELS);
  const OrgLevelIcon = orgLevelInfo.icon;

  const streakAtRisk = useMemo(() => {
    if (!lastActivity || streakDays === 0) return false;
    const hoursSince = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
    return hoursSince > 20;
  }, [lastActivity, streakDays]);

  const medals = useMemo(() => {
    return allMedals.map(m => {
      let unlocked = false;
      if (m.emoji === "profile" && profile?.full_name && profile?.phone && profile?.job_title) unlocked = true;
      if (m.emoji === "company" && org?.cnpj && org?.address && org?.phone) unlocked = true;
      if (m.emoji === "integrator" && waConnected) unlocked = true;
      if (m.emoji === "strategist" && hasStrategy) unlocked = true;
      if (m.emoji === "communicator" && contentCount >= 10) unlocked = true;
      if (m.emoji === "organizer" && calendarEvents >= 5) unlocked = true;
      if (m.emoji === "detailist" && completeLeads >= 10) unlocked = true;
      if (m.emoji === "funnel" && customFunnels >= 1) unlocked = true;
      if (m.emoji === "checklist" && checklistDoneCount >= 30) unlocked = true;
      if (m.emoji === "student" && academyProgress >= 3) unlocked = true;
      if (m.emoji === "strategy" && hasStrategy && totalLeads >= 5) unlocked = true;
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
  }, [totalLeads, wonLeads, streakDays, wonValue, contentCount, dispatchCount, siteCount, activeAgents, profile, org, waConnected, calendarEvents, completeLeads, customFunnels, checklistDoneCount, academyProgress, hasStrategy]);

  const unlockedCount = medals.filter(m => m.unlocked).length;

  const avgEval = g?.avg_eval != null ? g.avg_eval.toFixed(1) : null;
  const evalsCount = g?.evals_count ?? 0;

  const teamRanking = useMemo(() => {
    return teamRankingRaw.map(m => ({
      ...m,
      levelInfo: getLevelInfo(m.xp),
    }));
  }, [teamRankingRaw]);

  const claimReward = useMutation({
    mutationFn: async ({ level, value }: { level: number; value: number }) => {
      if (!orgId) throw new Error("no_org");
      const { error: claimError } = await supabase
        .from("gamification_claims" as unknown as "profiles")
        .insert({ user_id: user?.id ?? "", organization_id: orgId, reward_id: `level-${level}`, status: "claimed" } as Record<string, unknown>);
      if (claimError) throw claimError;
      if (value > 0) {
        const { data: wallet } = await supabase
          .from("credit_wallets").select("id, balance").eq("organization_id", orgId).maybeSingle();
        if (wallet) {
          await supabase.from("credit_wallets").update({ balance: (wallet.balance || 0) + value }).eq("id", wallet.id);
          await supabase.from("credit_transactions").insert({
            organization_id: orgId, type: "bonus", amount: value,
            balance_after: (wallet.balance || 0) + value,
            description: `Recompensa de gamificação - Nível ${level}`,
            metadata: { source: "gamification_reward", level },
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gamification-data"] });
      qc.invalidateQueries({ queryKey: ["credit-wallet"] });
      triggerCelebration();
      toast.success("Recompensa resgatada com sucesso! 🎉");
    },
    onError: () => reportError(new Error("Erro ao resgatar recompensa"), { title: "Erro ao resgatar recompensa", category: "gamificacao.redeem" }),
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Gamificação" subtitle="Seus pontos, medalhas e ranking" icon={<Trophy className="w-5 h-5 text-primary" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-xl" /><Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  const rankBadges = ["🥇", "🥈", "🥉"];

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Gamificação" subtitle={isAdmin ? "Visão geral da equipe e recompensas" : "Seus pontos, evolução e recompensas"} icon={<Trophy className="w-5 h-5 text-primary" />} actions={<FeatureTutorialButton slug="gamificacao" />} />

      {/* Evolution Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <CardContent className="py-6 relative">
            <div className="flex items-center gap-6">
              <motion.div className="text-center" animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2 mx-auto border-2 border-primary/20 relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))`, boxShadow: `0 8px 32px hsl(var(--primary) / 0.15), inset 0 1px 2px rgba(255,255,255,0.1)` }}>
                  <LevelIcon className={`w-10 h-10 ${levelInfo.color} drop-shadow-lg`} />
                </div>
                <p className={`text-lg font-black ${levelInfo.color}`}>{levelInfo.title}</p>
                <p className="text-[10px] text-muted-foreground">Nível {levelInfo.level}</p>
              </motion.div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{xp.toLocaleString()} XP</span>
                  {levelInfo.nextTitle && <span className="text-muted-foreground">{levelInfo.xpToNext} XP para {levelInfo.nextTitle}</span>}
                </div>
                <Progress value={levelInfo.progress} className="h-3" />
                <div className="flex gap-4 text-[10px] text-muted-foreground flex-wrap">
                  <div className={`flex items-center gap-1 ${streakDays > 7 ? "animate-pulse" : ""}`}>
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span className="font-bold text-orange-500">{streakDays} dias</span> de sequência
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>{points.toLocaleString()} pontos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Medal className="w-3 h-3 text-amber-500" />
                    <span>{unlockedCount}/{medals.length} medalhas</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {streakAtRisk && streakDays > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-500">Seu streak está em risco!</p>
                <p className="text-[10px] text-muted-foreground">Você tem {streakDays} dias de sequência. Realize uma ação para manter!</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <XpSuggestions
        profile={profile} org={org} waConnected={waConnected}
        totalLeads={totalLeads} wonLeads={wonLeads} contentCount={contentCount}
        siteCount={siteCount} activeAgents={activeAgents} hasStrategy={hasStrategy}
      />

      <CompletenessScore profile={profile} org={org} waConnected={waConnected} />

      {isAdmin && (counts?.members ?? 0) > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Visão da Equipe</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold">{counts?.members ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Membros</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold">{counts?.teams ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Times</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold">{unlockedCount}</p>
                <p className="text-[10px] text-muted-foreground">Medalhas da Org</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold">{totalLeads}</p>
                <p className="text-[10px] text-muted-foreground">Leads Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <p className="text-xs text-muted-foreground">{evalsCount} avaliações</p>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma avaliação ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

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
              ].map((stat) => (
                <div key={stat.label} className="p-2 rounded-lg bg-muted/30 text-center">
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {medals.map((m) => {
              const MIcon = medalIcons[m.emoji] || Award;
              const colors = medalColors[m.emoji] || medalColors.lead;
              return <Medal3D key={m.id} medal={m} colors={colors} MedalIcon={MIcon} />;
            })}
          </div>
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/[0.02]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Nível da Conta</CardTitle>
              <Badge variant="outline" className="text-[10px] ml-auto">Recompensas da empresa</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-5">
              <div className="text-center shrink-0">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-1.5 mx-auto border-2 border-primary/20"
                  style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04))`, boxShadow: `0 6px 24px hsl(var(--primary) / 0.1)` }}>
                  <OrgLevelIcon className={`w-8 h-8 ${orgLevelInfo.color} drop-shadow`} />
                </div>
                <p className={`text-sm font-black ${orgLevelInfo.color}`}>{orgLevelInfo.title}</p>
                <p className="text-[9px] text-muted-foreground">Nível {orgLevelInfo.level}</p>
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{totalOrgXp.toLocaleString()} XP total</span>
                  {orgLevelInfo.nextTitle && <span className="text-muted-foreground">{orgLevelInfo.xpToNext.toLocaleString()} XP para {orgLevelInfo.nextTitle}</span>}
                </div>
                <Progress value={orgLevelInfo.progress} className="h-2.5" />
                <p className="text-[10px] text-muted-foreground">
                  Soma do XP de {teamRankingRaw.length} membro{teamRankingRaw.length !== 1 ? "s" : ""} da equipe
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Recompensas da Conta</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rewardTiers.map((reward) => {
              const isUnlocked = orgLevelInfo.level >= reward.level;
              const isClaimed = claimedSet.has(`level-${reward.level}`);
              const tierLevel = ORG_LEVELS[reward.level - 1];
              const TierIcon = tierLevel.icon;
              return (
                <div key={reward.level} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isClaimed ? "bg-emerald-500/5 border-emerald-500/20" : isUnlocked ? "bg-primary/5 border-primary/20" : "opacity-50"
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUnlocked ? "bg-primary/10" : "bg-muted/30"}`}>
                    {isUnlocked ? <TierIcon className={`w-5 h-5 ${tierLevel.color}`} /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{reward.title}</p>
                    <p className="text-[10px] text-muted-foreground">Nível {reward.level} da conta — {tierLevel.name}</p>
                  </div>
                  {isClaimed ? (
                    <Badge variant="secondary" className="text-[10px] shrink-0"><CheckCircle2 className="w-3 h-3 mr-1" /> Resgatado</Badge>
                  ) : isUnlocked && isAdmin ? (
                    <Button size="sm" className="text-xs h-8 shrink-0" onClick={() => claimReward.mutate({ level: reward.level, value: reward.value })} disabled={claimReward.isPending}>
                      <Gift className="w-3 h-3 mr-1" /> Resgatar
                    </Button>
                  ) : isUnlocked && !isAdmin ? (
                    <Badge variant="secondary" className="text-[10px] shrink-0">Peça ao admin</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] shrink-0"><Lock className="w-3 h-3 mr-1" /> Bloqueado</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                const initials = (member.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                const MemberLevelIcon = member.levelInfo.icon;
                return (
                  <div key={member.user_id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isMe ? "bg-primary/10 border border-primary/20" : "bg-muted/20 hover:bg-muted/30"}`}>
                    <span className="text-lg font-bold w-8 text-center">{idx < 3 ? rankBadges[idx] : `${idx + 1}º`}</span>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold truncate">{member.full_name} {isMe && <span className="text-primary">(você)</span>}</p>
                        <MemberLevelIcon className={`w-3 h-3 ${member.levelInfo.color} shrink-0`} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{member.title} · {member.xp.toLocaleString()} XP</p>
                    </div>
                    <Badge variant={idx === 0 ? "default" : "outline"} className="text-[10px]">{member.xp.toLocaleString()} XP</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
