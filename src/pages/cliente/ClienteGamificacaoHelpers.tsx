import React, { useMemo } from "react";
import {
  Trophy, Medal, Star, Target, Coins, Timer, BarChart3, Award,
  TrendingUp, Users, Crown, Lock, Gift, CheckCircle2, Flame,
  Send, Globe, Bot, FileText, Sparkles, Shield, Sword, Gem,
  User, Building2, Wifi, Clipboard, MessageCircle,
  Calendar, ListChecks, GraduationCap, GitBranch, Zap,
  ArrowRight, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

export const LEVELS = [
  { name: "Novato", minXp: 0, maxXp: 499, icon: Shield, color: "text-muted-foreground" },
  { name: "Aprendiz", minXp: 500, maxXp: 1499, icon: Sword, color: "text-blue-500" },
  { name: "Profissional", minXp: 1500, maxXp: 3499, icon: Star, color: "text-purple-500" },
  { name: "Especialista", minXp: 3500, maxXp: 6999, icon: Gem, color: "text-amber-500" },
  { name: "Mestre", minXp: 7000, maxXp: 11999, icon: Crown, color: "text-orange-500" },
  { name: "Lenda", minXp: 12000, maxXp: Infinity, icon: Trophy, color: "text-primary" },
];

// Organization-level thresholds (sum of all members' XP)
export const ORG_LEVELS = [
  { name: "Novato", minXp: 0, maxXp: 999, icon: Shield, color: "text-muted-foreground" },
  { name: "Aprendiz", minXp: 1000, maxXp: 2999, icon: Sword, color: "text-blue-500" },
  { name: "Profissional", minXp: 3000, maxXp: 6999, icon: Star, color: "text-purple-500" },
  { name: "Especialista", minXp: 7000, maxXp: 13999, icon: Gem, color: "text-amber-500" },
  { name: "Mestre", minXp: 14000, maxXp: 23999, icon: Crown, color: "text-orange-500" },
  { name: "Lenda", minXp: 24000, maxXp: Infinity, icon: Trophy, color: "text-primary" },
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

export const allMedals = [
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

export const rewardTiers = [
  { level: 2, title: "+100 Créditos Bônus", description: "Nível Aprendiz", type: "bonus_credits", value: 100 },
  { level: 3, title: "+300 Créditos Bônus", description: "Nível Profissional", type: "bonus_credits", value: 300 },
  { level: 4, title: "+500 Créditos Bônus", description: "Nível Especialista", type: "bonus_credits", value: 500 },
  { level: 5, title: "+800 Créditos Bônus", description: "Nível Mestre", type: "bonus_credits", value: 800 },
  { level: 6, title: "+1.500 Créditos Bônus", description: "Nível Lenda", type: "bonus_credits", value: 1500 },
];

export function getLevelInfo(xp: number, levels = LEVELS) {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].minXp) {
      const current = levels[i];
      const next = levels[i + 1];
      const progressInLevel = next ? ((xp - current.minXp) / (next.minXp - current.minXp)) * 100 : 100;
      return { level: i + 1, title: current.name, nextTitle: next?.name, xpToNext: next ? next.minXp - xp : 0, progress: Math.min(progressInLevel, 100), icon: current.icon, color: current.color };
    }
  }
  return { level: 1, title: "Novato", nextTitle: "Aprendiz", xpToNext: levels[1]?.minXp ?? 500, progress: 0, icon: Shield, color: "text-muted-foreground" };
}

/* ─── 3D Medal Component ─── */
export function Medal3D({ medal, colors, MedalIcon }: { medal: typeof allMedals[0] & { unlocked: boolean }; colors: typeof medalColors.lead; MedalIcon: React.ElementType }) {
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

export function CompletenessScore({ profile, org, waConnected }: { profile: Record<string, unknown>; org: Record<string, unknown>; waConnected: boolean }) {
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
export function XpSuggestions({ profile, org, waConnected, totalLeads, wonLeads, contentCount, siteCount, activeAgents, hasStrategy }: {
  profile: Record<string, unknown>; org: Record<string, unknown>; waConnected: boolean; totalLeads: number; wonLeads: number; contentCount: number; siteCount: number; activeAgents: number; hasStrategy: boolean;
}) {
  const suggestions = useMemo(() => {
    const items: { text: string; xp: number; icon: React.ElementType; href: string }[] = [];
    if (!profile?.full_name || !profile?.phone || !profile?.job_title)
      items.push({ text: "Complete seu perfil", xp: 25, icon: User, href: "/cliente/configuracoes" });
    if (!org?.cnpj || !org?.address)
      items.push({ text: "Preencha dados da empresa", xp: 25, icon: Building2, href: "/cliente/configuracoes" });
    if (!waConnected)
      items.push({ text: "Conecte o WhatsApp", xp: 50, icon: Wifi, href: "/cliente/integracoes" });
    if (!hasStrategy)
      items.push({ text: "Gere sua estratégia de marketing", xp: 30, icon: Clipboard, href: "/cliente/plano-marketing" });
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
  }, [profile, org, waConnected, totalLeads, wonLeads, contentCount, siteCount, activeAgents, hasStrategy]);

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

