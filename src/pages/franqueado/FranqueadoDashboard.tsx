import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, ChevronDown, Calendar, TrendingUp,
  UserPlus, Headphones, FileSignature, LayoutGrid,
  DollarSign, FileText, Target, Users, Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeAtalhos } from "@/components/home/HomeAtalhos";
import { useAuth } from "@/contexts/AuthContext";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useCalendarEvents } from "@/hooks/useCalendar";
import { useContracts } from "@/hooks/useContracts";
import { useDailyMessages } from "@/hooks/useDailyMessages";
import { useGoals } from "@/hooks/useGoals";

const quickActionIcons: Record<string, React.ElementType> = { UserPlus, Headphones, FileSignature, LayoutGrid };

export default function FranqueadoDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: leads, isLoading: loadingLeads } = useCrmLeads();
  const { data: announcements, isLoading: loadingAnn } = useAnnouncements();
  const { data: events, isLoading: loadingEv } = useCalendarEvents();
  const { data: contracts } = useContracts();
  const { data: dailyMessage } = useDailyMessages();
  const { data: goals } = useGoals();

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const userName = profile?.full_name?.split(" ")[0] || "Usuário";
  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const hojeCapitalized = hoje.charAt(0).toUpperCase() + hoje.slice(1);

  const leadsAtivos = (leads ?? []).filter(l => l.stage !== "perdido").length;
  const contratosAtivos = (contracts ?? []).filter(c => c.status === "active").length;
  const comunicadosCount = (announcements ?? []).length;
  const eventosCount = (events ?? []).slice(0, 5).length;

  const quickActions = [
    { label: "Criar Lead", path: "/franqueado/crm", icon: "UserPlus" },
    { label: "Abrir Chamado", path: "/franqueado/suporte", icon: "Headphones" },
    { label: "Ver Propostas", path: "/franqueado/propostas", icon: "FileSignature" },
    { label: "Acessar CRM", path: "/franqueado/crm", icon: "LayoutGrid" },
  ];

  const isLoading = loadingLeads || loadingAnn || loadingEv;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title={`${saudacao}, ${userName}`}
        subtitle={`Unidade · ${hojeCapitalized}`}
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
                  <DropdownMenuItem key={a.path + a.label} onClick={() => navigate(a.path)}>
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

          {/* Mensagem do dia + Comunicados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 flex flex-col h-full">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">💬 Mensagem do Dia</h3>
              {dailyMessage ? (
                <>
                  <p className="text-lg italic text-foreground leading-relaxed flex-1">"{dailyMessage.message}"</p>
                  <span className="text-xs text-muted-foreground mt-4">— {dailyMessage.author || "Admin"}</span>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma mensagem configurada para hoje.</p>
              )}
            </div>

            <div className="glass-card p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">📢 Comunicados</h3>
                <Badge variant="outline">{comunicadosCount}</Badge>
              </div>
              {comunicadosCount > 0 ? (
                <div className="flex-1 space-y-3">
                  {(announcements ?? []).slice(0, 3).map(c => (
                    <div key={c.id} className="p-3 rounded-lg border border-border transition-colors cursor-pointer hover:bg-muted/50" onClick={() => navigate("/franqueado/comunicados")}>
                      <p className="text-sm font-medium line-clamp-1">{c.title}</p>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), "dd MMM", { locale: ptBR })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum comunicado ativo no momento.</p>
              )}
              <Button variant="ghost" size="sm" className="mt-3 text-xs w-full" onClick={() => navigate("/franqueado/comunicados")}>
                Ver todos →
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Leads Ativos" value={String(leadsAtivos)} sublabel={`${(leads ?? []).length} total`} icon={Users} delay={0} />
            <KpiCard label="Contratos Ativos" value={String(contratosAtivos)} sublabel={`${(contracts ?? []).length} total`} icon={FileSignature} delay={1} />
            <KpiCard label="Próximos Eventos" value={String(eventosCount)} sublabel="Na agenda" icon={Calendar} delay={2} />
            <KpiCard label="Metas" value={String((goals ?? []).length)} sublabel="Configuradas" icon={Target} delay={3} />
          </div>

          {/* Agenda */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">📅 Próximos Compromissos</h3>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              {eventosCount > 0 ? (
                <div className="space-y-2">
                  {(events ?? []).slice(0, 5).map(e => (
                    <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer hover:bg-muted/50" onClick={() => navigate("/franqueado/agenda")}>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
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
                <p className="text-sm text-muted-foreground">Sua agenda está vazia. <button onClick={() => navigate("/franqueado/agenda")} className="text-primary hover:underline">Crie seu primeiro evento.</button></p>
              )}
              <Button variant="ghost" size="sm" className="mt-3 text-xs w-full" onClick={() => navigate("/franqueado/agenda")}>
                Ver agenda completa →
              </Button>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">📊 Comercial</h3>
              {leadsAtivos > 0 ? (
                <div className="text-sm text-muted-foreground">
                  <p><strong className="text-foreground">{leadsAtivos}</strong> leads ativos no CRM</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum lead registrado. <button onClick={() => navigate("/franqueado/crm")} className="text-primary hover:underline">Comece a prospectar.</button></p>
              )}
            </div>
          </div>

          <HomeAtalhos />
        </>
      )}
    </div>
  );
}
