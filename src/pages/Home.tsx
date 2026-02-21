import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, Plus, MessageSquare, Calendar, Megaphone, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  getSaudacao, getMensagemHoje, getAlertasFranqueadora, getPrioridadesDoDia,
  getDadosComerciais, getProximosEventos, getComunicadosAtivos,
} from "@/data/homeData";
import { HomeHojePreciso } from "@/components/home/HomeHojePreciso";
import { HomeMensagemDia } from "@/components/home/HomeMensagemDia";
import { HomeComunicados } from "@/components/home/HomeComunicados";
import { HomeAgenda } from "@/components/home/HomeAgenda";
import { HomeComercial } from "@/components/home/HomeComercial";
import { HomeAlertas } from "@/components/home/HomeAlertas";
import { HomeAtalhos } from "@/components/home/HomeAtalhos";
import { PageHeader } from "@/components/PageHeader";
import { TaskListCard } from "@/components/premium/TaskListCard";
import { ProgressCtaCard } from "@/components/premium/ProgressCtaCard";

const quickActionIcons: Record<string, React.ElementType> = {
  MessageSquare, Calendar, Megaphone, TrendingUp,
};

export default function Home() {
  const navigate = useNavigate();

  const saudacao = getSaudacao();
  const mensagem = getMensagemHoje();
  const alertas = useMemo(() => getAlertasFranqueadora(), []);
  const prioridades = useMemo(() => getPrioridadesDoDia(alertas), [alertas]);
  const comercial = useMemo(() => getDadosComerciais(), []);
  const eventos = useMemo(() => getProximosEventos(5), []);
  const comunicados = useMemo(() => getComunicadosAtivos(3), []);

  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const hojeCapitalized = hoje.charAt(0).toUpperCase() + hoje.slice(1);

  const quickActions = [
    { label: "Novo chamado", path: "/franqueadora/atendimento", icon: "MessageSquare" },
    { label: "Criar evento", path: "/franqueadora/agenda", icon: "Calendar" },
    { label: "Novo comunicado", path: "/franqueadora/comunicados", icon: "Megaphone" },
    { label: "CRM Expansão", path: "/franqueadora/crm", icon: "TrendingUp" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title={`${saudacao}, Davi`}
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

      <HomeHojePreciso prioridades={prioridades} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HomeMensagemDia mensagem={mensagem} isAdmin />
        <HomeComunicados comunicados={comunicados} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HomeAgenda eventos={eventos} />
        <HomeComercial dados={comercial} />
      </div>

      <ProgressCtaCard
        title="PERFORMANCE DA REDE"
        level="FRANQUEADORA"
        metaLabel="META DA REDE"
        metaDescription="Faltam R$ 45.000 para atingir a meta consolidada do mês."
        percent={78}
        ctaTitle="AÇÃO NECESSÁRIA"
        ctaSubtitle="REVISÃO DE METAS TRIMESTRAIS"
        ctaDescription="Agende a reunião de revisão com os franqueados até sexta-feira."
        ctaButtonLabel="AGENDAR REUNIÃO"
        onCtaClick={() => navigate("/franqueadora/agenda")}
      />

      <TaskListCard
        title="TAREFAS OPERACIONAIS"
        tasks={[
          { id: "t1", title: "Revisar relatórios financeiros", description: "Consolidar fechamento mensal de todas as unidades.", time: "09:00", done: true },
          { id: "t2", title: "Aprovar materiais de marketing", description: "Validar artes da campanha de Março antes do envio.", time: "10:30" },
          { id: "t3", title: "Reunião com novos franqueados", description: "Onboarding das 2 unidades aprovadas este mês.", time: "14:00" },
          { id: "t4", title: "Atualizar comunicado da rede", description: "Publicar informativo sobre novas políticas comerciais.", time: "16:00" },
        ]}
        onTaskClick={() => navigate("/franqueadora/atendimento")}
      />

      <HomeAlertas alertas={alertas} />
      <HomeAtalhos />
    </div>
  );
}
