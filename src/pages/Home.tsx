import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, Plus, MessageSquare, Calendar, Megaphone, TrendingUp, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HomeMensagemDia } from "@/components/home/HomeMensagemDia";
import { HomeComunicados } from "@/components/home/HomeComunicados";
import { HomeAgenda } from "@/components/home/HomeAgenda";
import { HomeAtalhos } from "@/components/home/HomeAtalhos";
import { HomeAlertas } from "@/components/home/HomeAlertas";
import { HomeComercial } from "@/components/home/HomeComercial";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyMessages } from "@/hooks/useDailyMessages";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useCalendarEvents } from "@/hooks/useCalendar";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { useSupportTicketsNetwork } from "@/hooks/useSupportTicketsNetwork";
import type { Comunicado, PublicoAlvo } from "@/types/comunicados";
import type { AgendaEvent } from "@/types/agenda";
import type { MensagemDoDia, AlertaHome } from "@/types/home";

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

  const comunicados: Comunicado[] = useMemo(() =>
    (announcements ?? []).slice(0, 3).map(a => ({
      id: a.id,
      titulo: a.title,
      conteudo: a.content || "",
      tipo: (a.type || "Informativo") as any,
      prioridade: (a.priority || "Normal") as any,
      publico: (a.target_roles || []) as PublicoAlvo[],
      unidadesEspecificas: [],
      mostrarDashboard: true,
      mostrarPopup: false,
      exigirConfirmacao: false,
      status: "Ativo",
      autorId: a.created_by || "",
      autorNome: "Admin",
      criadoEm: a.created_at,
      atualizadoEm: a.updated_at,
    }))
  , [announcements]);

  const eventosFormatted: AgendaEvent[] = useMemo(() =>
    (events ?? []).slice(0, 5).map(e => ({
      id: e.id,
      titulo: e.title,
      descricao: e.description || "",
      inicio: e.start_at,
      fim: e.end_at,
      allDay: e.all_day || false,
      calendarId: e.calendar_id || "",
      nivel: "rede" as const,
      tipo: "Evento" as const,
      status: "Confirmado" as const,
      visibilidade: "Interno unidade" as const,
      recorrencia: "none" as const,
      participantes: [],
      local: e.location || "",
      criadoPor: e.created_by || "",
      criadoPorNome: "Admin",
      criadoEm: e.created_at,
      atualizadoEm: e.updated_at,
    }))
  , [events]);

  // Build real alerts from tickets, announcements, and stale leads
  const alertas: AlertaHome[] = useMemo(() => {
    const result: AlertaHome[] = [];
    const now = new Date();

    // Open support tickets
    (tickets ?? []).filter(t => t.status === "open").forEach(t => {
      result.push({
        id: `ticket-${t.id}`,
        tipo: "chamado",
        titulo: t.title,
        descricao: t.org_name || "Ticket aberto",
        prioridade: t.priority === "high" || t.priority === "urgent" ? "alta" : t.priority === "medium" ? "media" : "baixa",
        link: "/franqueadora/atendimento",
        moduloOrigem: "Suporte",
        criadoEm: t.created_at,
      });
    });

    // Critical announcements
    (announcements ?? []).filter(a => a.priority === "Crítica" || a.priority === "Urgente").forEach(a => {
      result.push({
        id: `ann-${a.id}`,
        tipo: "comunicado",
        titulo: a.title,
        descricao: "Comunicado crítico ativo",
        prioridade: "alta",
        link: "/franqueadora/comunicados",
        moduloOrigem: "Comunicados",
        criadoEm: a.created_at,
      });
    });

    // Leads without activity in 7+ days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    (leads ?? []).filter(l => !l.won_at && !l.lost_at && l.updated_at < sevenDaysAgo).slice(0, 5).forEach(l => {
      result.push({
        id: `lead-${l.id}`,
        tipo: "contrato",
        titulo: `Lead "${l.name}" sem atividade`,
        descricao: "Sem interação há mais de 7 dias",
        prioridade: "media",
        link: "/franqueadora/crm",
        moduloOrigem: "CRM",
        criadoEm: l.updated_at,
      });
    });

    return result.sort((a, b) => {
      const prio = { alta: 0, media: 1, baixa: 2 };
      return (prio[a.prioridade] ?? 2) - (prio[b.prioridade] ?? 2);
    });
  }, [tickets, announcements, leads]);

  // Build commercial data from real hooks
  const comercialData = useMemo(() => {
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const leadsArr = leads ?? [];
    const faturamentoRede = leadsArr
      .filter(l => l.won_at && l.won_at.startsWith(mesAtual))
      .reduce((sum, l) => sum + (Number(l.value) || 0), 0);

    const leadsNovos = leadsArr.filter(l => l.created_at.startsWith(mesAtual)).length;
    const chamadosAbertos = (tickets ?? []).filter(t => t.status === "open").length;

    // Top units from tickets by org_name (simple proxy for ranking)
    const unitMap = new Map<string, number>();
    leadsArr.filter(l => l.won_at).forEach(l => {
      const name = (l as any).company || "Sem empresa";
      unitMap.set(name, (unitMap.get(name) || 0) + (Number(l.value) || 0));
    });
    const topUnidades = Array.from(unitMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, rev], i) => ({ franchiseName: name, revenue: rev, points: Math.round(rev / 100) }));

    return { faturamentoRede, topUnidades, leadsNovos, chamadosAbertos };
  }, [leads, tickets]);

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
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      ) : (
        <>
          {/* Alertas reais */}
          {alertas.length > 0 ? (
            <HomeAlertas alertas={alertas} />
          ) : (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">🎯 Ações Pendentes</h3>
              <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
                <Inbox className="w-5 h-5 mr-2" />
                Nenhuma ação pendente. Tudo em dia!
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mensagem ? (
              <HomeMensagemDia mensagem={mensagem} isAdmin />
            ) : (
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-2">💬 Mensagem do Dia</h3>
                <p className="text-sm text-muted-foreground">Nenhuma mensagem configurada para hoje.</p>
              </div>
            )}
            {comunicados.length > 0 ? (
              <HomeComunicados comunicados={comunicados} />
            ) : (
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-2">📢 Comunicados</h3>
                <p className="text-sm text-muted-foreground">Nenhum comunicado ativo no momento.</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {eventosFormatted.length > 0 ? (
              <HomeAgenda eventos={eventosFormatted} />
            ) : (
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-2">📅 Agenda</h3>
                <p className="text-sm text-muted-foreground">Sua agenda está vazia. <button onClick={() => navigate("/franqueadora/agenda")} className="text-primary hover:underline">Crie seu primeiro evento.</button></p>
              </div>
            )}
            <HomeComercial dados={comercialData} />
          </div>

          <HomeAtalhos />
        </>
      )}
    </div>
  );
}
