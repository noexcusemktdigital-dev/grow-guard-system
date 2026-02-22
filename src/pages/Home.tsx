import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, Plus, MessageSquare, Calendar, Megaphone, TrendingUp, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HomeHojePreciso } from "@/components/home/HomeHojePreciso";
import { HomeMensagemDia } from "@/components/home/HomeMensagemDia";
import { HomeComunicados } from "@/components/home/HomeComunicados";
import { HomeAgenda } from "@/components/home/HomeAgenda";
import { HomeAtalhos } from "@/components/home/HomeAtalhos";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyMessages } from "@/hooks/useDailyMessages";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useCalendarEvents } from "@/hooks/useCalendar";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import type { Comunicado, PublicoAlvo } from "@/mocks/comunicadosData";
import type { AgendaEvent } from "@/types/agenda";
import type { MensagemDoDia } from "@/mocks/homeData";

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

  const quickActions = [
    { label: "Novo chamado", path: "/franqueadora/atendimento", icon: "MessageSquare" },
    { label: "Criar evento", path: "/franqueadora/agenda", icon: "Calendar" },
    { label: "Novo comunicado", path: "/franqueadora/comunicados", icon: "Megaphone" },
    { label: "CRM Expansão", path: "/franqueadora/crm", icon: "TrendingUp" },
  ];

  const isLoading = loadingMsg || loadingAnn || loadingEv;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
          {/* Prioridades - empty state */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">🎯 Hoje eu preciso de...</h3>
            <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
              <Inbox className="w-5 h-5 mr-2" />
              Nenhuma prioridade pendente. Tudo em dia!
            </div>
          </div>

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
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">📊 Comercial</h3>
              {(leads ?? []).length > 0 ? (
                <div className="text-sm text-muted-foreground">
                  <p><strong className="text-foreground">{leads!.length}</strong> leads no CRM</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum lead registrado. <button onClick={() => navigate("/franqueadora/crm")} className="text-primary hover:underline">Comece a prospectar.</button></p>
              )}
            </div>
          </div>

          <HomeAtalhos />
        </>
      )}
    </div>
  );
}
