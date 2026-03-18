import { useMemo, useState } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { triggerCelebration } from "@/components/CelebrationEffect";
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
  organizer: Calendar, detailist: Target, funnel: GitBranch, checklist: ListChecks, student: GraduationCap, strategy: Zap,
};

const medalColors: Record<string, { gradient: string; glow: string; text: string; border: string }> = {
  lead:    { gradient: "from-blue-400 via-blue-500 to-blue-700", glow: "rgba(59,130,246,0.5)", text: "text-blue-400", border: "border-blue-400/40" },
  sales:   { gradient: "from-amber-300 via-amber-500 to-amber-700", glow: "rgba(245,158,11,0.5)", text: "text-amber-400", border: "border-amber-400/40" },
  streak:  { gradient: "from-orange-400 via-orange-500 to-red-600", glow: "rgba(249,115,22,0.5)", text: "text-orange-400", border: "border-orange-400/40" },
  crm:     { gradient: "from-purple-400 via-purple-500 to-purple-700", glow: "rgba(168,85,247,0.5)", text: "text-purple-400", border: "border-purple-400/40" },
  closer:  { gradient: "from-yellow-300 via-yellow-400 to-amber-600", glow: "rgba(234,179,8,0.5)", text: "text-yellow-400", border: "border-yellow-400/40" },
  content: { gradient: "from-emerald-400 via-emerald-500 to-green-700", glow: "rgba(16,185,129,0.5)", text: "text-emerald-400", border: "border-emerald-400/40" },
  dispatch:{ gradient: "from-rose-400 via-rose-500 to-pink-700", glow: "rgba(244,63,94,0.5)", text: "text-rose-400", border: "border-rose-400/40" },
  site:    { gradient: "from-cyan-400 via-cyan-500 to-teal-700", glow: "rgba(6,182,212,0.5)", text: "text-cyan-400", border: "border-cyan-400/40" },
  agent:   { gradient: "from-violet-400 via-violet-500 to-indigo-700", glow: "rgba(139,92,246,0.5)", text: "text-violet-400", border: "border-violet-400/40" },
  profile: { gradient: "from-sky-400 via-sky-500 to-blue-700", glow: "rgba(14,165,233,0.5)", text: "text-sky-400", border: "border-sky-400/40" },
  company: { gradient: "from-teal-400 via-teal-500 to-emerald-700", glow: "rgba(20,184,166,0.5)", text: "text-teal-400", border: "border-teal-400/40" },
  integrator: { gradient: "from-green-400 via-green-500 to-emerald-700", glow: "rgba(34,197,94,0.5)", text: "text-green-400", border: "border-green-400/40" },
  strategist: { gradient: "from-indigo-400 via-indigo-500 to-purple-700", glow: "rgba(99,102,241,0.5)", text: "text-indigo-400", border: "border-indigo-400/40" },
  communicator: { gradient: "from-pink-400 via-pink-500 to-rose-700", glow: "rgba(236,72,153,0.5)", text: "text-pink-400", border: "border-pink-400/40" },
  organizer: { gradient: "from-lime-400 via-lime-500 to-green-700", glow: "rgba(132,204,22,0.5)", text: "text-lime-400", border: "border-lime-400/40" },
  detailist: { gradient: "from-blue-500 via-indigo-500 to-violet-700", glow: "rgba(79,70,229,0.5)", text: "text-indigo-400", border: "border-indigo-400/40" },
  funnel:  { gradient: "from-fuchsia-400 via-fuchsia-500 to-purple-700", glow: "rgba(192,38,211,0.5)", text: "text-fuchsia-400", border: "border-fuchsia-400/40" },
  checklist: { gradient: "from-emerald-300 via-green-500 to-teal-700", glow: "rgba(16,185,129,0.5)", text: "text-emerald-400", border: "border-emerald-400/40" },
  student: { gradient: "from-amber-400 via-orange-500 to-red-700", glow: "rgba(251,146,60,0.5)", text: "text-orange-400", border: "border-orange-400/40" },
  strategy: { gradient: "from-cyan-300 via-blue-500 to-indigo-700", glow: "rgba(59,130,246,0.5)", text: "text-blue-400", border: "border-blue-400/40" },
};

const allMedals = [
  // Platform usage medals
  { id: "p1", name: "Perfil Completo", emoji: "profile", description: "Nome, telefone e cargo preenchidos", condition: "Perfil 100%" },
  { id: "p2", name: "Empresa Configurada", emoji: "company", description: "CNPJ, endereço e telefone da empresa", condition: "Org completa" },
  { id: "p3", name: "Integrador", emoji: "integrator", description: "WhatsApp conectado", condition: "WA ativo" },
  { id: "p4", name: "Estrategista", emoji: "strategist", description: "Plano de marketing ou vendas criado", condition: "Estratégia" },
  { id: "p5", name: "Comunicador", emoji: "communicator", description: "10+ conteúdos criados", condition: "10+ conteúdos" },
  // New platform usage medals
  { id: "p6", name: "Organizador", emoji: "organizer", description: "5+ eventos na agenda", condition: "5+ eventos" },
  { id: "p7", name: "Lead Detalhista", emoji: "detailist", description: "10 leads com valor, telefone e email", condition: "10 leads completos" },
  { id: "p8", name: "Funil Maestro", emoji: "funnel", description: "Funil customizado criado", condition: "Funil criado" },
  { id: "p9", name: "Checklist Master", emoji: "checklist", description: "30 tarefas do dia concluídas", condition: "30 tarefas feitas" },
  { id: "p10", name: "Aluno Dedicado", emoji: "student", description: "3+ aulas da Academy concluídas", condition: "3+ aulas" },
  { id: "p11", name: "Estratégia Completa", emoji: "strategy", description: "Plano de vendas ou marketing preenchido", condition: "Plano completo" },
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

/* ─── 3D Medal Component ─── */
function Medal3D({ medal, colors, MedalIcon }: { medal: typeof allMedals[0] & { unlocked: boolean }; colors: typeof medalColors.lead; MedalIcon: React.ElementType }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={medal.unlocked ? { rotateY: 15, scale: 1.08 } : {}}
            className={`group relative p-4 rounded-xl border text-center transition-all cursor-default ${
              medal.unlocked
                ? `${colors.border} bg-card hover:shadow-xl`
                : "border-muted/30 bg-muted/5"
            }`}
            style={{ perspective: "600px", transformStyle: "preserve-3d" }}
          >
            {/* Medal circle with 3D depth */}
            <div className="relative w-16 h-16 mx-auto mb-3">
              {/* Outer metallic ring */}
              <div
                className={`absolute inset-0 rounded-full ${medal.unlocked ? "" : "grayscale opacity-30"}`}
                style={{
                  background: medal.unlocked
                    ? `conic-gradient(from 0deg, rgba(255,255,255,0.3), rgba(0,0,0,0.1), rgba(255,255,255,0.3), rgba(0,0,0,0.1), rgba(255,255,255,0.3))`
                    : "rgba(128,128,128,0.2)",
                  padding: "3px",
                  borderRadius: "50%",
                }}
              >
                {/* Inner gradient face */}
                <div
                  className={`w-full h-full rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center relative overflow-hidden`}
                  style={{
                    boxShadow: medal.unlocked
                      ? `inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.4), 0 6px 20px ${colors.glow}, 0 2px 8px rgba(0,0,0,0.3)`
                      : "inset 0 -2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  {/* Specular highlight */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-4 rounded-b-full opacity-40"
                    style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.8), transparent)" }}
                  />
                  <MedalIcon className={`w-6 h-6 relative z-10 ${medal.unlocked ? "text-white drop-shadow-lg" : "text-gray-400"}`} />
                </div>
              </div>

              {/* Glow pulse for unlocked */}
              {medal.unlocked && (
                <div
                  className="absolute inset-[-4px] rounded-full animate-pulse opacity-30"
                  style={{ boxShadow: `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}` }}
                />
              )}

              {/* Lock icon for locked */}
              {!medal.unlocked && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center">
                  <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                </div>
              )}
            </div>

            <p className={`text-xs font-bold mb-0.5 ${medal.unlocked ? colors.text : "text-muted-foreground"}`}>{medal.name}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">{medal.condition}</p>
            {medal.unlocked && (
              <Badge variant="secondary" className={`text-[8px] mt-1.5 ${colors.text} bg-background/50`}>
                <CheckCircle2 className="w-2 h-2 mr-0.5" /> Conquistada
              </Badge>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="font-semibold text-xs">{medal.name}</p>
          <p className="text-[10px] text-muted-foreground">{medal.description}</p>
          {medal.unlocked && <p className="text-[10px] text-emerald-500 mt-1">✓ Desbloqueada</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
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

/* ─── XP Actions Suggestions ─── */
function XpSuggestions({ profile, org, waConnected, totalLeads, wonLeads, contentCount, siteCount, activeAgents }: {
  profile: any; org: any; waConnected: boolean; totalLeads: number; wonLeads: number; contentCount: number; siteCount: number; activeAgents: number;
}) {
  const suggestions = useMemo(() => {
    const items: { text: string; xp: number; icon: React.ElementType; href: string }[] = [];
    if (!profile?.full_name || !profile?.phone || !profile?.job_title)
      items.push({ text: "Complete seu perfil", xp: 25, icon: User, href: "/cliente/configuracoes" });
    if (!org?.cnpj || !org?.address)
      items.push({ text: "Preencha dados da empresa", xp: 25, icon: Building2, href: "/cliente/configuracoes" });
    if (!waConnected)
      items.push({ text: "Conecte o WhatsApp", xp: 50, icon: Wifi, href: "/cliente/integracoes" });
    if (totalLeads < 1)
      items.push({ text: "Cadastre seu primeiro lead", xp: 10, icon: Target, href: "/cliente/crm" });
    if (wonLeads < 1 && totalLeads >= 1)
      items.push({ text: "Feche sua primeira venda", xp: 50, icon: Trophy, href: "/cliente/crm" });
    if (contentCount < 1)
      items.push({ text: "Crie um conteúdo", xp: 10, icon: FileText, href: "/cliente/conteudos" });
    if (siteCount < 1)
      items.push({ text: "Gere um site", xp: 10, icon: Globe, href: "/cliente/sites" });
    if (activeAgents < 1)
      items.push({ text: "Ative um agente IA", xp: 10, icon: Bot, href: "/cliente/agentes-ia" });
    return items.slice(0, 4);
  }, [profile, org, waConnected, totalLeads, wonLeads, contentCount, siteCount, activeAgents]);

  if (suggestions.length === 0) return null;

  return (
    <Card className="border-primary/10 bg-primary/[0.02]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Próximas ações para XP</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestions.map((s, i) => {
            const SIcon = s.icon;
            return (
              <a key={i} href={s.href} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <SIcon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{s.text}</p>
                  <p className="text-[10px] text-primary font-bold">+{s.xp} XP</p>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </a>
            );
          })}
        </div>
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

  // Extra data for new medals
  const { data: calendarEvents } = useQuery({
    queryKey: ["gamification-events", orgId],
    queryFn: async () => {
      const { count } = await supabase.from("calendar_events").select("id", { count: "exact", head: true }).eq("organization_id", orgId!);
      return count ?? 0;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: checklistDoneCount } = useQuery({
    queryKey: ["gamification-checklist-done", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("client_checklist_items").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_completed", true);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: academyProgress } = useQuery({
    queryKey: ["gamification-academy", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("academy_progress").select("id", { count: "exact", head: true }).eq("user_id", user!.id).not("completed_at", "is", null);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: customFunnels } = useQuery({
    queryKey: ["gamification-funnels", orgId],
    queryFn: async () => {
      const { count } = await supabase.from("crm_funnels").select("id", { count: "exact", head: true }).eq("organization_id", orgId!);
      return count ?? 0;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });

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

  // Team gamification data for ranking
  const { data: teamGamification } = useQuery({
    queryKey: ["team-gamification", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_gamification")
        .select("user_id, xp, title, streak_days")
        .eq("organization_id", orgId!);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
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
      triggerCelebration();
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

  // Complete leads count (value + phone + email)
  const completeLeads = myLeads.filter(l => l.value && Number(l.value) > 0 && l.phone && l.email).length;

  const xp = (gamification as any)?.xp ?? 0;
  const streakDays = gamification?.streak_days ?? 0;
  const points = gamification?.points ?? 0;
  const lastActivity = gamification?.last_activity_at;
  const levelInfo = getLevelInfo(xp);
  const LevelIcon = levelInfo.icon;

  // Streak risk check
  const streakAtRisk = useMemo(() => {
    if (!lastActivity || streakDays === 0) return false;
    const hoursSince = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
    return hoursSince > 20;
  }, [lastActivity, streakDays]);

  const medals = useMemo(() => {
    return allMedals.map(m => {
      let unlocked = false;
      // Platform usage medals
      if (m.emoji === "profile" && profile?.full_name && profile?.phone && profile?.job_title) unlocked = true;
      if (m.emoji === "company" && org?.cnpj && org?.address && org?.phone) unlocked = true;
      if (m.emoji === "integrator" && waConnected) unlocked = true;
      if (m.emoji === "strategist" && contentCount >= 1) unlocked = true;
      if (m.emoji === "communicator" && contentCount >= 10) unlocked = true;
      // New platform medals
      if (m.emoji === "organizer" && (calendarEvents ?? 0) >= 5) unlocked = true;
      if (m.emoji === "detailist" && completeLeads >= 10) unlocked = true;
      if (m.emoji === "funnel" && (customFunnels ?? 0) >= 1) unlocked = true;
      if (m.emoji === "checklist" && (checklistDoneCount ?? 0) >= 30) unlocked = true;
      if (m.emoji === "student" && (academyProgress ?? 0) >= 3) unlocked = true;
      if (m.emoji === "strategy" && contentCount >= 3 && totalLeads >= 5) unlocked = true;
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
  }, [totalLeads, wonLeads, streakDays, wonValue, contentCount, dispatchCount, siteCount, activeAgents, profile, org, waConnected, calendarEvents, completeLeads, customFunnels, checklistDoneCount, academyProgress]);

  const unlockedCount = medals.filter(m => m.unlocked).length;

  const avgEval = myEvals && myEvals.length > 0
    ? (myEvals.reduce((a, e) => a + e.score, 0) / myEvals.length).toFixed(1)
    : null;

  // Ranking with real XP from gamification table
  const teamRanking = useMemo(() => {
    const gamMap = new Map((teamGamification ?? []).map(g => [g.user_id, g]));
    return (team ?? []).map(member => {
      const gam = gamMap.get(member.user_id);
      const memberXp = gam?.xp ?? 0;
      const memberTitle = gam?.title ?? "Novato";
      const memberLevel = getLevelInfo(memberXp);
      return { ...member, xp: memberXp, title: memberTitle, levelInfo: memberLevel };
    }).sort((a, b) => b.xp - a.xp);
  }, [team, teamGamification]);

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
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2 mx-auto border-2 border-primary/20 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))`,
                    boxShadow: `0 8px 32px hsl(var(--primary) / 0.15), inset 0 1px 2px rgba(255,255,255,0.1)`,
                  }}
                >
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

      {/* Streak risk alert */}
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

      {/* XP Suggestions */}
      <XpSuggestions
        profile={profile} org={org} waConnected={waConnected}
        totalLeads={totalLeads} wonLeads={wonLeads} contentCount={contentCount}
        siteCount={siteCount} activeAgents={activeAgents}
      />

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

      {/* Medals — 3D Version */}
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

      {/* Team Ranking — with real XP */}
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
