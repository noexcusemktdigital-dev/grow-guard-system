import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronDown, Plus, MessageSquare, Calendar, Megaphone, TrendingUp,
  Inbox, Users, FileSignature, Headphones, Building2, AlertTriangle,
  ArrowUpRight, Target, Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HomeMensagemDia } from "@/components/home/HomeMensagemDia";
import { HomeAtalhos } from "@/components/home/HomeAtalhos";
import { KpiCard } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyMessages } from "@/hooks/useDailyMessages";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useCalendarEvents } from "@/hooks/useCalendar";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { useSupportTicketsNetwork } from "@/hooks/useSupportTicketsNetwork";
import { useUnits } from "@/hooks/useUnits";
import { useContracts } from "@/hooks/useContracts";
import { useActiveGoals } from "@/hooks/useGoals";
import { useGoalProgress } from "@/hooks/useGoalProgress";
import { useNetworkClientStats } from "@/hooks/useNetworkClientStats";
import type { MensagemDoDia } from "@/types/home";

const quickActionIcons: Record<string, React.ElementType> = {
  MessageSquare, Calendar, Megaphone, TrendingUp,
};

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: dailyMessage, isLoading: loadingMsg } = useDailyMessages();
  const { data: announcements, isLoading: loadingAnn } = useAnnouncements();
  const { data: events, isLoading: loadingEv } = useCalendarEvents();
  const { data: leads } = useCrmLeads();
  const { data: tickets } = useSupportTicketsNetwork();
  const { data: units } = useUnits();
  const { data: contracts } = useContracts();
  const { data: goals } = useActiveGoals("network");
  const { data: goalProgress } = useGoalProgress(goals);
  const { data: clientStats } = useNetworkClientStats();

  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const hojeCapitalized = hoje.charAt(0).toUpperCase() + hoje.slice(1);
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const userName = profile?.full_name?.split(" ")[0] || "Usuário";

  const mensagem: MensagemDoDia | null = dailyMessage ? {
    id: dailyMessage.id,
    texto: dailyMessage.message,
    autor: dailyMessage.author || "",
    categoria: "Mentalidade" as const,
    publico: ["Franqueadora", "Franqueados"],
    dataPublicacao: dailyMessage.date,
    status: "Ativo",
    criadoEm: dailyMessage.created_at,
  } : null;

  // KPI data
  const totalUnidades = (units ?? []).length;
  const leadsRede = (leads ?? []).length;
  const contratosAtivos = (contracts ?? []).filter(c => c.status === "active").length;
  const chamadosAbertos = (tickets ?? []).filter(t => t.status === "open").length;

  // Smart priorities - top 3 most urgent things
  const smartPriorities = useMemo(() => {
    const items: { icon: React.ElementType; label: string; detail: string; path: string; urgency: number }[] = [];

    const openTickets = (tickets ?? []).filter(t => t.status === "open");
    const urgentTickets = openTickets.filter(t => t.priority === "urgent" || t.priority === "high");
    if (urgentTickets.length > 0) {
      items.push({ icon: Headphones, label: `${urgentTickets.length} chamado${urgentTickets.length > 1 ? "s" : ""} urgente${urgentTickets.length > 1 ? "s" : ""}`, detail: "Requerem atenção imediata", path: "/franqueadora/atendimento", urgency: 1 });
    }

    const criticalAnn = (announcements ?? []).filter(a => a.priority === "Crítica");
    if (criticalAnn.length > 0) {
      items.push({ icon: Megaphone, label: `${criticalAnn.length} comunicado${criticalAnn.length > 1 ? "s" : ""} crítico${criticalAnn.length > 1 ? "s" : ""}`, detail: "Pendentes de confirmação da rede", path: "/franqueadora/comunicados", urgency: 2 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const staleLeads = (leads ?? []).filter(l => !l.won_at && !l.lost_at && l.updated_at < sevenDaysAgo);
    if (staleLeads.length > 0) {
      items.push({ icon: Users, label: `${staleLeads.length} lead${staleLeads.length > 1 ? "s" : ""} sem atividade`, detail: "Há mais de 7 dias sem interação", path: "/franqueadora/crm", urgency: 3 });
    }

    const todayEvents = (events ?? []).filter(e => {
      const d = new Date(e.start_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    });
    if (todayEvents.length > 0) {
      items.push({ icon: Calendar, label: `${todayEvents.length} evento${todayEvents.length > 1 ? "s" : ""} hoje`, detail: todayEvents[0]?.title || "", path: "/franqueadora/agenda", urgency: 4 });
    }

    return items.sort((a, b) => a.urgency - b.urgency).slice(0, 3);
  }, [tickets, announcements, leads, events]);

  // Commercial summary
  const comercialData = useMemo(() => {
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const leadsArr = leads ?? [];
    const faturamento = leadsArr.filter(l => l.won_at && l.won_at.startsWith(mesAtual)).reduce((s, l) => s + (Number(l.value) || 0), 0);
    const novosLeads = leadsArr.filter(l => l.created_at.startsWith(mesAtual)).length;
    const conversoes = leadsArr.filter(l => l.won_at && l.won_at.startsWith(mesAtual)).length;
    return { faturamento, novosLeads, conversoes };
  }, [leads]);

  const quickActions = [
    { label: "Novo chamado", path: "/franqueadora/atendimento", icon: "MessageSquare" },
    { label: "Criar evento", path: "/franqueadora/agenda", icon: "Calendar" },
    { label: "Novo comunicado", path: "/franqueadora/comunicados", icon: "Megaphone" },
    { label: "CRM Expansão", path: "/franqueadora/crm", icon: "TrendingUp" },
  ];

  const isLoading = loadingMsg || loadingAnn || loadingEv;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={`${saudacao}, ${userName}`}
        subtitle={`Franqueadora · ${hojeCapitalized}`}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Ações rápidas <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {quickActions.map(a => {
                const Icon = quickActionIcons[a.icon] || Plus;
                return (
                  <DropdownMenuItem key={a.path} onClick={() => navigate(a.path)}>
                    <Icon className="w-4 h-4 mr-2" /> {a.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Unidades" value={String(totalUnidades)} icon={Building2} delay={0} />
            <KpiCard label="Leads na Rede" value={String(leadsRede)} icon={Users} delay={1} />
            <KpiCard label="Contratos Ativos" value={String(contratosAtivos)} icon={FileSignature} delay={2} />
            <KpiCard label="Chamados Abertos" value={String(chamadosAbertos)} sublabel={chamadosAbertos > 0 ? "pendentes" : "tudo em dia"} icon={Headphones} delay={3} />
          </div>

          {/* SaaS Network Stats */}
          {clientStats && clientStats.total_clients > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                Performance SaaS da Rede
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{clientStats.total_clients}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Clientes Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{clientStats.active_clients}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Ativos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {clientStats.total_mrr > 0 ? `R$ ${Number(clientStats.total_mrr).toLocaleString("pt-BR")}` : "R$ 0"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">MRR</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{clientStats.total_leads}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Leads dos Clientes</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${clientStats.expiring_soon > 0 ? "text-destructive" : "text-foreground"}`}>
                    {clientStats.expiring_soon}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Expirando em 7d</p>
                </div>
              </div>
            </div>
          )}

          {/* Smart Priorities + Mensagem do Dia */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Hoje eu preciso de...
              </h3>
              {smartPriorities.length > 0 ? (
                <div className="space-y-3">
                  {smartPriorities.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(item.path)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.detail}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
                  <Inbox className="w-5 h-5 mr-2" />
                  Tudo em dia! Nenhuma ação urgente.
                </div>
              )}
            </div>

            {mensagem ? (
              <HomeMensagemDia mensagem={mensagem} isAdmin />
            ) : (
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-2">💬 Mensagem do Dia</h3>
                <p className="text-sm text-muted-foreground">Nenhuma mensagem configurada para hoje.</p>
              </div>
            )}
          </div>

          {/* Commercial + Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Visão Comercial — {format(new Date(), "MMMM", { locale: ptBR })}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {comercialData.faturamento > 0
                      ? `R$ ${(comercialData.faturamento / 1000).toFixed(1)}k`
                      : "R$ 0"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Faturamento</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{comercialData.novosLeads}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Novos Leads</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{comercialData.conversoes}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Conversões</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="mt-4 text-xs w-full" onClick={() => navigate("/franqueadora/crm")}>
                Ver CRM completo →
              </Button>
            </div>

            {/* Goals */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Metas da Rede
              </h3>
              {(goals ?? []).length > 0 ? (
                <div className="space-y-3">
                  {(goals ?? []).slice(0, 3).map((goal: any) => {
                    const progress = goalProgress?.[goal.id];
                    const percent = Math.min(progress?.percent ?? 0, 100);
                    return (
                      <div key={goal.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium truncate max-w-[70%]">{goal.title}</span>
                          <span className="text-xs text-muted-foreground">{Math.round(percent)}%</span>
                        </div>
                        <Progress value={percent} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma meta ativa. <button onClick={() => navigate("/franqueadora/metas")} className="text-primary hover:underline">Criar metas.</button></p>
              )}
              <Button variant="ghost" size="sm" className="mt-4 text-xs w-full" onClick={() => navigate("/franqueadora/metas")}>
                Ver todas as metas →
              </Button>
            </div>
          </div>

          {/* Upcoming events + Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">📅 Próximos Eventos</h3>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              {(events ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(events ?? []).slice(0, 4).map(e => (
                    <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate("/franqueadora/agenda")}>
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
                <p className="text-sm text-muted-foreground">Agenda vazia. <button onClick={() => navigate("/franqueadora/agenda")} className="text-primary hover:underline">Criar evento.</button></p>
              )}
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">📢 Comunicados Recentes</h3>
                <Badge variant="outline">{(announcements ?? []).length}</Badge>
              </div>
              {(announcements ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(announcements ?? []).slice(0, 4).map(a => (
                    <div key={a.id} className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate("/franqueadora/comunicados")}>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium line-clamp-1 flex-1">{a.title}</p>
                        {a.priority === "Crítica" && <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(a.created_at), "dd MMM", { locale: ptBR })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum comunicado ativo.</p>
              )}
            </div>
          </div>

          <HomeAtalhos />
        </>
      )}
    </div>
  );
}
