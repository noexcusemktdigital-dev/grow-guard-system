import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, ChevronDown, Calendar, TrendingUp,
  UserPlus, Headphones, FileSignature, LayoutGrid,
  Users, Inbox, Target, AlertTriangle, Bell, Megaphone,
  ArrowUpRight, Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeAtalhos } from "@/components/home/HomeAtalhos";
import { useAuth } from "@/contexts/AuthContext";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useAnnouncementViews } from "@/hooks/useAnnouncementViews";
import { useCalendarEvents } from "@/hooks/useCalendar";
import { useContracts } from "@/hooks/useContracts";
import { useDailyMessages } from "@/hooks/useDailyMessages";
import { useActiveGoals } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { useNetworkClientStats } from "@/hooks/useNetworkClientStats";

const quickActionIcons: Record<string, React.ElementType> = { UserPlus, Headphones, FileSignature, LayoutGrid };

export default function FranqueadoDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showSecondary, setShowSecondary] = useState(false);

  const { data: leads, isLoading: loadingLeads } = useCrmLeads();
  const { data: announcements, isLoading: loadingAnn } = useAnnouncements();
  const { data: views } = useAnnouncementViews();
  const { data: events, isLoading: loadingEv } = useCalendarEvents();
  const { data: contracts } = useContracts();
  const { data: dailyMessage } = useDailyMessages();
  // Secondary queries — deferred
  const { data: goals } = useActiveGoals();
  const { data: goalProgress } = useGoalProgress(goals);
  const { data: clientStats } = useNetworkClientStats();

  useEffect(() => {
    const timer = setTimeout(() => setShowSecondary(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const userName = profile?.full_name?.split(" ")[0] || "Usuário";
  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const hojeCapitalized = hoje.charAt(0).toUpperCase() + hoje.slice(1);

  const leadsAtivos = (leads ?? []).filter(l => l.stage !== "perdido").length;
  const contratosAtivos = (contracts ?? []).filter(c => c.status === "active").length;

  const viewedIds = useMemo(() => new Set((views ?? []).map(v => v.announcement_id)), [views]);
  const confirmedIds = useMemo(() => new Set((views ?? []).filter(v => v.confirmed_at).map(v => v.announcement_id)), [views]);

  const unreadAnnouncements = useMemo(() => (announcements ?? []).filter(a => !viewedIds.has(a.id)), [announcements, viewedIds]);
  const criticalPending = useMemo(() => (announcements ?? []).filter(a => a.priority === "Crítica" && !confirmedIds.has(a.id)), [announcements, confirmedIds]);

  // Smart alerts
  const smartAlerts = useMemo(() => {
    const items: { icon: React.ElementType; label: string; detail: string; path: string; variant: "destructive" | "warning" | "info" }[] = [];

    if (criticalPending.length > 0) {
      items.push({ icon: AlertTriangle, label: `${criticalPending.length} comunicado${criticalPending.length > 1 ? "s" : ""} crítico${criticalPending.length > 1 ? "s" : ""}`, detail: "Requerem confirmação de leitura", path: "/franqueado/comunicados", variant: "destructive" });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const staleLeads = (leads ?? []).filter(l => !l.won_at && !l.lost_at && l.updated_at < sevenDaysAgo);
    if (staleLeads.length > 0) {
      items.push({ icon: Users, label: `${staleLeads.length} lead${staleLeads.length > 1 ? "s" : ""} parado${staleLeads.length > 1 ? "s" : ""}`, detail: "Sem contato há mais de 7 dias", path: "/franqueado/crm", variant: "warning" });
    }

    if (unreadAnnouncements.length > 0 && criticalPending.length === 0) {
      items.push({ icon: Bell, label: `${unreadAnnouncements.length} comunicado${unreadAnnouncements.length > 1 ? "s" : ""} não lido${unreadAnnouncements.length > 1 ? "s" : ""}`, detail: "Novos avisos da matriz", path: "/franqueado/comunicados", variant: "info" });
    }

    return items;
  }, [criticalPending, leads, unreadAnnouncements]);

  const quickActions = [
    { label: "Criar Lead", path: "/franqueado/crm", icon: "UserPlus" },
    { label: "Abrir Chamado", path: "/franqueado/suporte", icon: "Headphones" },
    { label: "Ver Propostas", path: "/franqueado/propostas", icon: "FileSignature" },
    { label: "Acessar CRM", path: "/franqueado/crm", icon: "LayoutGrid" },
  ];

  const isLoading = loadingLeads || loadingAnn || loadingEv;

  return (
    <div className="w-full space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/10 p-6 lg:p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">👋</span>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">{saudacao}, {userName}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{hojeCapitalized}</p>
          {dailyMessage && (
            <div className="mt-4 bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50 max-w-xl">
              <p className="text-sm italic text-foreground leading-relaxed">"{dailyMessage.message}"</p>
              <span className="text-[10px] text-muted-foreground mt-1 block">— {dailyMessage.author || "Admin"}</span>
            </div>
          )}
        </div>
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Ações rápidas <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {quickActions.map(a => {
            const Icon = quickActionIcons[a.icon] || Plus;
            return (
              <DropdownMenuItem key={a.path + a.label} onClick={() => navigate(a.path)}>
                <Icon className="w-4 h-4 mr-2" /> {a.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      ) : (
        <>
          {/* Smart Alerts */}
          {smartAlerts.length > 0 && (
            <div className="space-y-2">
              {smartAlerts.map((alert, i) => (
                <button
                  key={i}
                  onClick={() => navigate(alert.path)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left group ${
                    alert.variant === "destructive"
                      ? "bg-destructive/5 border-destructive/20 hover:bg-destructive/10"
                      : alert.variant === "warning"
                      ? "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
                      : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                  }`}
                >
                  <alert.icon className={`w-4 h-4 flex-shrink-0 ${
                    alert.variant === "destructive" ? "text-destructive" : alert.variant === "warning" ? "text-amber-500" : "text-primary"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.label}</p>
                    <p className="text-[11px] text-muted-foreground">{alert.detail}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Leads Ativos" value={String(leadsAtivos)} sublabel={`${(leads ?? []).length} total`} icon={Users} delay={0} />
            <KpiCard label="Contratos Ativos" value={String(contratosAtivos)} sublabel={`${(contracts ?? []).length} total`} icon={FileSignature} delay={1} />
            <KpiCard label="Próximos Eventos" value={String((events ?? []).filter(e => new Date(e.start_at) >= new Date()).slice(0, 5).length)} sublabel="Na agenda" icon={Calendar} delay={2} />
            <KpiCard label="Comunicados" value={String(unreadAnnouncements.length)} sublabel={unreadAnnouncements.length > 0 ? "não lidos" : "tudo lido"} icon={Megaphone} delay={3} />
          </div>

          {/* Client Stats */}
          {clientStats && clientStats.total_clients > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                Meus Clientes SaaS
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{clientStats.active_clients}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Ativos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{clientStats.total_leads}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Leads</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {Number(clientStats.total_mrr) > 0 ? `R$ ${Number(clientStats.total_mrr).toLocaleString("pt-BR")}` : "R$ 0"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">MRR</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${clientStats.expiring_soon > 0 ? "text-destructive" : "text-foreground"}`}>
                    {clientStats.expiring_soon}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Expirando</p>
                </div>
              </div>
            </div>
          )}

          {/* Goals + Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goals */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4" /> Metas
                </h3>
                <Badge variant="outline">{(goals ?? []).length}</Badge>
              </div>
              {(goals ?? []).length > 0 ? (
                <div className="space-y-4">
                  {(goals ?? []).slice(0, 3).map((goal: any) => {
                    const progress = goalProgress?.[goal.id];
                    const percent = Math.min(progress?.percent ?? 0, 100);
                    return (
                      <div key={goal.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium truncate max-w-[65%]">{goal.title}</span>
                          <span className="text-xs font-semibold tabular-nums">{Math.round(percent)}%</span>
                        </div>
                        <Progress value={percent} className="h-2" />
                        {progress && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {progress.daysLeft > 0 ? `${progress.daysLeft} dias restantes` : "Prazo encerrado"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma meta ativa definida pela matriz.</p>
              )}
              <Button variant="ghost" size="sm" className="mt-3 text-xs w-full" onClick={() => navigate("/franqueado/estrategia")}>
                Ver metas →
              </Button>
            </div>

            {/* Pipeline */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Pipeline Comercial
                </h3>
              </div>
              {leadsAtivos > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground text-lg">{leadsAtivos}</strong> leads ativos no CRM
                  </p>
                  {(() => {
                    const stages: Record<string, number> = {};
                    (leads ?? []).filter(l => l.stage !== "perdido").forEach(l => {
                      stages[l.stage] = (stages[l.stage] || 0) + 1;
                    });
                    const entries = Object.entries(stages).slice(0, 4);
                    return entries.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {entries.map(([stage, count]) => (
                          <div key={stage} className="bg-muted/50 rounded-lg p-2.5 text-center">
                            <p className="text-lg font-bold text-foreground">{count}</p>
                            <p className="text-[10px] text-muted-foreground capitalize truncate">{stage.replace(/_/g, " ")}</p>
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum lead registrado. <button onClick={() => navigate("/franqueado/crm")} className="text-primary hover:underline">Comece a prospectar.</button></p>
              )}
              <Button variant="ghost" size="sm" className="mt-3 text-xs w-full" onClick={() => navigate("/franqueado/crm")}>
                Acessar CRM →
              </Button>
            </div>
          </div>

          {/* Agenda + Comunicados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">📅 Próximos Compromissos</h3>
              </div>
              {(() => {
                const futureEvents = (events ?? []).filter(e => new Date(e.start_at) >= new Date());
                return futureEvents.length > 0 ? (
                  <div className="space-y-2">
                    {futureEvents.slice(0, 4).map(e => (
                      <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate("/franqueado/agenda")}>
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[10px] text-primary font-bold">{format(new Date(e.start_at), "dd")}</span>
                          <span className="text-[8px] text-muted-foreground uppercase">{format(new Date(e.start_at), "MMM", { locale: ptBR })}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{e.title}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(e.start_at), "HH:mm")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Agenda vazia. <button onClick={() => navigate("/franqueado/agenda")} className="text-primary hover:underline">Criar evento.</button></p>
                );
              })()}
              <Button variant="ghost" size="sm" className="mt-3 text-xs w-full" onClick={() => navigate("/franqueado/agenda")}>
                Ver agenda →
              </Button>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">📢 Comunicados</h3>
                {unreadAnnouncements.length > 0 && (
                  <Badge variant="destructive" className="text-[10px]">{unreadAnnouncements.length} novo{unreadAnnouncements.length > 1 ? "s" : ""}</Badge>
                )}
              </div>
              {(announcements ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(announcements ?? []).slice(0, 4).map(c => (
                    <div
                      key={c.id}
                      className={`p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${!viewedIds.has(c.id) ? "border-l-3 border-l-primary" : ""}`}
                      onClick={() => navigate("/franqueado/comunicados")}
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium line-clamp-1 flex-1">{c.title}</p>
                        {c.priority === "Crítica" && !confirmedIds.has(c.id) && (
                          <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0" />
                        )}
                        {!viewedIds.has(c.id) && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { locale: ptBR, addSuffix: true })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum comunicado ativo.</p>
              )}
              <Button variant="ghost" size="sm" className="mt-3 text-xs w-full" onClick={() => navigate("/franqueado/comunicados")}>
                Ver todos →
              </Button>
            </div>
          </div>

          <HomeAtalhos />
        </>
      )}
    </div>
  );
}
