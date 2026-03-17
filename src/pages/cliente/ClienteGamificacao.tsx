import { useMemo, useCallback } from "react";
import { FeatureTutorialButton } from "@/components/cliente/FeatureTutorialButton";
import {
  Trophy, Medal, Star, Target, Coins, Timer, BarChart3, Award,
  TrendingUp, Users, Crown, Lock, Gift, CheckCircle2, Flame,
  Send, Globe, Bot, FileText, Sparkles, Shield, Sword, Gem,
  User, Building2, Wifi, Clipboard, MessageCircle,
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
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "@/hooks/useUserOrgId";
import { useClienteContent, useClienteDispatches, useClienteSites } from "@/hooks/useClienteContent";
import { useClienteAgents } from "@/hooks/useClienteAgents";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useWhatsAppInstance } from "@/hooks/useWhatsApp";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useOrgTeams } from "@/hooks/useOrgTeams";

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
  profile: User, company: Building2, integrator: Wifi, strategist: Clipboard, communicator: MessageCircle,
};

const medalColors: Record<string, { gradient: string; shadow: string; text: string; border: string; ring: string }> = {
  lead:    { gradient: "from-blue-400 via-blue-500 to-blue-700", shadow: "shadow-blue-500/40", text: "text-blue-400", border: "border-blue-400/40", ring: "ring-blue-400/30" },
  sales:   { gradient: "from-amber-300 via-amber-500 to-amber-700", shadow: "shadow-amber-500/40", text: "text-amber-400", border: "border-amber-400/40", ring: "ring-amber-400/30" },
  streak:  { gradient: "from-orange-400 via-orange-500 to-red-600", shadow: "shadow-orange-500/40", text: "text-orange-400", border: "border-orange-400/40", ring: "ring-orange-400/30" },
  crm:     { gradient: "from-purple-400 via-purple-500 to-purple-700", shadow: "shadow-purple-500/40", text: "text-purple-400", border: "border-purple-400/40", ring: "ring-purple-400/30" },
  closer:  { gradient: "from-yellow-300 via-yellow-400 to-amber-600", shadow: "shadow-yellow-500/40", text: "text-yellow-400", border: "border-yellow-400/40", ring: "ring-yellow-400/30" },
  content: { gradient: "from-emerald-400 via-emerald-500 to-green-700", shadow: "shadow-emerald-500/40", text: "text-emerald-400", border: "border-emerald-400/40", ring: "ring-emerald-400/30" },
  dispatch:{ gradient: "from-rose-400 via-rose-500 to-pink-700", shadow: "shadow-rose-500/40", text: "text-rose-400", border: "border-rose-400/40", ring: "ring-rose-400/30" },
  site:    { gradient: "from-cyan-400 via-cyan-500 to-teal-700", shadow: "shadow-cyan-500/40", text: "text-cyan-400", border: "border-cyan-400/40", ring: "ring-cyan-400/30" },
  agent:   { gradient: "from-violet-400 via-violet-500 to-indigo-700", shadow: "shadow-violet-500/40", text: "text-violet-400", border: "border-violet-400/40", ring: "ring-violet-400/30" },
  profile: { gradient: "from-sky-400 via-sky-500 to-blue-700", shadow: "shadow-sky-500/40", text: "text-sky-400", border: "border-sky-400/40", ring: "ring-sky-400/30" },
  company: { gradient: "from-teal-400 via-teal-500 to-emerald-700", shadow: "shadow-teal-500/40", text: "text-teal-400", border: "border-teal-400/40", ring: "ring-teal-400/30" },
  integrator: { gradient: "from-green-400 via-green-500 to-emerald-700", shadow: "shadow-green-500/40", text: "text-green-400", border: "border-green-400/40", ring: "ring-green-400/30" },
  strategist: { gradient: "from-indigo-400 via-indigo-500 to-purple-700", shadow: "shadow-indigo-500/40", text: "text-indigo-400", border: "border-indigo-400/40", ring: "ring-indigo-400/30" },
  communicator: { gradient: "from-pink-400 via-pink-500 to-rose-700", shadow: "shadow-pink-500/40", text: "text-pink-400", border: "border-pink-400/40", ring: "ring-pink-400/30" },
};

const allMedals = [
  // Platform usage medals
  { id: "p1", name: "Perfil Completo", emoji: "profile", description: "Nome, telefone e cargo preenchidos", condition: "Perfil 100%" },
  { id: "p2", name: "Empresa Configurada", emoji: "company", description: "CNPJ, endereço e telefone da empresa", condition: "Org completa" },
  { id: "p3", name: "Integrador", emoji: "integrator", description: "WhatsApp conectado", condition: "WA ativo" },
  { id: "p4", name: "Estrategista", emoji: "strategist", description: "Plano de marketing ou vendas criado", condition: "Estratégia" },
  { id: "p5", name: "Comunicador", emoji: "communicator", description: "10+ conteúdos criados", condition: "10+ conteúdos" },
  // CRM medals
  { id: "1", name: "Primeiro Lead", emoji: "lead", description: "Captou o primeiro lead", condition: "1+ lead" },
  { id: "2", name: "Vendedor Nato", emoji: "sales", description: "10 vendas fechadas", condition: "10+ ganhos" },
  { id: "3", name: "Maratonista", emoji: "streak", description: "30 dias de streak", condition: "30 dias" },
  { id: "5", name: "Mestre do CRM", emoji: "crm", description: "100 leads gerenciados", condition: "100+ leads" },
  { id: "6", name: "Top Closer", emoji: "closer", description: "R$ 100k em vendas", condition: "R$100k+" },
  { id: "7", name: "Estrategista Digital", emoji: "content", description: "5 conteúdos gerados", condition: "5+ conteúdos" },
  { id: "8", name: "Atirador de Elite", emoji: "dispatch", description: "10 disparos enviados", condition: "10+ disparos" },
  { id: "9", name: "Construtor", emoji: "site", description: "1 site gerado", condition: "1+ site" },
  { id: "10", name: "Automatizador", emoji: "agent", description: "1 agente IA ativo", condition: "1+ agente" },
];

const rewardTiers = [
  { level: 2, title: "+50 Créditos Bônus", description: "Nível Aprendiz", type: "bonus_credits", value: 50 },
  { level: 3, title: "+200 Créditos Bônus", description: "Nível Profissional", type: "bonus_credits", value: 200 },
  { level: 4, title: "5% Desconto no Plano", description: "Nível Especialista", type: "discount", value: 5 },
  { level: 5, title: "+500 Créditos + Geração Extra", description: "Nível Mestre", type: "bonus_credits", value: 500 },
  { level: 6, title: "10% Desconto + 1000 Créditos", description: "Nível Lenda", type: "bonus_credits", value: 1000 },
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

function CompletenessScore({ profile, org, waConnected }: { profile: any; org: any; waConnected: boolean }) {
  const checks = [
    { label: "Nome completo", done: !!profile?.full_name },
    { label: "Telefone pessoal", done: !!profile?.phone },
    { label: "Cargo", done: !!profile?.job_title },
    { label: "Nome da empresa", done: !!org?.name },
    { label: "CNPJ", done: !!org?.cnpj },
    { label: "Endereço", done: !!org?.address },
    { label: "Telefone da empresa", done: !!org?.phone },
    { label: "WhatsApp conectado", done: waConnected },
  ];
  const doneCount = checks.filter(c => c.done).length;
  const percent = Math.round((doneCount / checks.length) * 100);

  return (
    <Card className="border-primary/15">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Completude do Perfil</CardTitle>
          </div>
          <Badge variant={percent === 100 ? "default" : "secondary"} className="text-xs">{percent}%</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={percent} className="h-2.5 mb-3" />
        <div className="grid grid-cols-2 gap-1.5">
          {checks.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px]">
              {c.done ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              ) : (
                <div className="w-3 h-3 rounded-full border border-muted-foreground/30 shrink-0" />
              )}
              <span className={c.done ? "text-muted-foreground line-through" : "text-foreground"}>{c.label}</span>
            </div>
          ))}
        </div>
        {percent < 100 && (
          <p className="text-[10px] text-primary mt-2 font-medium">+{(checks.length - doneCount) * 25} XP ao completar</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClienteGamificacao() {
  const { user } = useAuth();
  const { isAdmin } = useRoleAccess();
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
  const { data: profile } = useUserProfile();
  const { data: org } = useOrgProfile();
  const { data: waInstance } = useWhatsAppInstance();
  const { data: members } = useOrgMembers();
  const { data: teams } = useOrgTeams();

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
      const { error: claimError } = await supabase
        .from("gamification_claims" as any)
        .insert({ user_id: user!.id, organization_id: orgId!, reward_id: `level-${level}` as any, status: "claimed" } as any);
      if (claimError) throw claimError;
      if (value > 0) {
        const { data: wallet } = await supabase
          .from("credit_wallets").select("id, balance").eq("organization_id", orgId!).maybeSingle();
        if (wallet) {
          await supabase.from("credit_wallets").update({ balance: (wallet.balance || 0) + value }).eq("id", wallet.id);
          await supabase.from("credit_transactions").insert({
            organization_id: orgId!, type: "bonus", amount: value,
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
  const waConnected = waInstance?.status === "connected";

  const xp = (gamification as any)?.xp ?? 0;
  const streakDays = gamification?.streak_days ?? 0;
  const points = gamification?.points ?? 0;
  const levelInfo = getLevelInfo(xp);
  const LevelIcon = levelInfo.icon;

  const medals = useMemo(() => {
    return allMedals.map(m => {
      let unlocked = false;
      // Platform usage medals
      if (m.emoji === "profile" && profile?.full_name && profile?.phone && profile?.job_title) unlocked = true;
      if (m.emoji === "company" && org?.cnpj && org?.address && org?.phone) unlocked = true;
      if (m.emoji === "integrator" && waConnected) unlocked = true;
      if (m.emoji === "strategist" && contentCount >= 1) unlocked = true;
      if (m.emoji === "communicator" && contentCount >= 10) unlocked = true;
      // CRM medals
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
  }, [totalLeads, wonLeads, streakDays, wonValue, contentCount, dispatchCount, siteCount, activeAgents, profile, org, waConnected]);

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

  const claimedLevels = useMemo(() => new Set((claims || []).map((c: any) => c.reward_id)), [claims]);

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
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 mx-auto border-2 border-primary/20">
                  <LevelIcon className={`w-8 h-8 ${levelInfo.color}`} />
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

      {/* Profile Completeness Score */}
      <CompletenessScore profile={profile} org={org} waConnected={waConnected} />

      {/* Admin: Team overview */}
      {isAdmin && members && members.length > 1 && (
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
                <p className="text-xl font-bold">{members.length}</p>
                <p className="text-[10px] text-muted-foreground">Membros</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold">{teams?.length ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Times</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold">{unlockedCount}</p>
                <p className="text-[10px] text-muted-foreground">Medalhas da Org</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold">{(leads ?? []).length}</p>
                <p className="text-[10px] text-muted-foreground">Leads Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation + Performance */}
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
                <p className="text-xs text-muted-foreground">{myEvals?.length} avaliações</p>
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

      {/* Medals */}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {medals.map((m, idx) => {
              const MedalIcon = medalIcons[m.emoji] || Award;
              const colors = medalColors[m.emoji] || medalColors.lead;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.03 }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    m.unlocked ? `${colors.border} bg-muted/20 hover:shadow-lg ${colors.shadow}` : "opacity-25 grayscale"
                  }`}
                >
                  <div className="relative w-12 h-12 mx-auto mb-2">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center ring-2 ${colors.ring}`}
                      style={{
                        boxShadow: m.unlocked ? "inset 0 -3px 6px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)" : "inset 0 -2px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      <MedalIcon className="w-5 h-5 text-white drop-shadow-md" />
                    </div>
                  </div>
                  <p className={`text-[11px] font-bold ${m.unlocked ? colors.text : "text-muted-foreground"}`}>{m.name}</p>
                  <p className="text-[9px] text-muted-foreground">{m.condition}</p>
                  {m.unlocked && (
                    <Badge variant="secondary" className={`text-[8px] mt-1 ${colors.text}`}>
                      <CheckCircle2 className="w-2 h-2 mr-0.5" /> ✓
                    </Badge>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rewards */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Recompensas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rewardTiers.map((reward) => {
              const isUnlocked = levelInfo.level >= reward.level;
              const isClaimed = claimedLevels.has(`level-${reward.level}`);
              const tierLevel = LEVELS[reward.level - 1];
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
                    <p className="text-[10px] text-muted-foreground">Nível {reward.level} — {tierLevel.name}</p>
                  </div>
                  {isClaimed ? (
                    <Badge variant="secondary" className="text-[10px] shrink-0"><CheckCircle2 className="w-3 h-3 mr-1" /> Resgatado</Badge>
                  ) : isUnlocked ? (
                    <Button size="sm" className="text-xs h-8 shrink-0" onClick={() => claimReward.mutate({ level: reward.level, value: reward.value })} disabled={claimReward.isPending}>
                      <Gift className="w-3 h-3 mr-1" /> Resgatar
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-[10px] shrink-0"><Lock className="w-3 h-3 mr-1" /> Bloqueado</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Team Ranking */}
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
                  <div key={member.user_id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isMe ? "bg-primary/10 border border-primary/20" : "bg-muted/20 hover:bg-muted/30"}`}>
                    <span className="text-lg font-bold w-8 text-center">{idx < 3 ? rankBadges[idx] : `${idx + 1}º`}</span>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{member.full_name} {isMe && <span className="text-primary">(você)</span>}</p>
                      <p className="text-[10px] text-muted-foreground">{member.totalLeads} leads · {member.wonLeads} ganhos</p>
                    </div>
                    <Badge variant={idx === 0 ? "default" : "outline"} className="text-[10px]">{member.points} pts</Badge>
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
