import { mockTickets, type Ticket } from "./atendimentoData";
import { mockContratos, type Contrato } from "./contratosData";
import { mockComunicados, type Comunicado } from "./comunicadosData";
import { mockOnboardings, mockMeetings, mockTasks as onboardingTasks } from "./onboardingData";
import { mockEvents, mockCalendars, type AgendaEvent } from "./agendaData";
import { mockLeads } from "./crmData";
import { getMonthSummary } from "./mockData";
import { getRankingForMonth } from "./metasRankingData";
import { parseISO, isAfter, isBefore, addDays, format } from "date-fns";

// ========== TYPES ==========

export type MensagemCategoria = "Mentalidade" | "Vendas" | "Gestão" | "Marketing" | "Liderança";
export type MensagemStatus = "Ativo" | "Programado" | "Arquivado";
export type PublicoAlvo = "Franqueadora" | "Franqueados" | "Clientes finais" | "Todos";

export interface MensagemDoDia {
  id: string;
  texto: string;
  categoria: MensagemCategoria;
  autor: string;
  publico: PublicoAlvo[];
  dataPublicacao: string;
  status: MensagemStatus;
  criadoEm: string;
}

export interface AlertaHome {
  id: string;
  tipo: "chamado" | "prova" | "onboarding" | "contrato" | "fechamento" | "comunicado";
  titulo: string;
  descricao: string;
  prioridade: "alta" | "media" | "baixa";
  link: string;
  moduloOrigem: string;
  criadoEm: string;
}

export interface PrioridadeDoDia {
  id: string;
  titulo: string;
  descricao: string;
  tipo: AlertaHome["tipo"];
  link: string;
  urgencia: 1 | 2 | 3;
}

// ========== MOCK MENSAGENS ==========

export const mockMensagens: MensagemDoDia[] = [
  {
    id: "msg-1",
    texto: "O sucesso não é sobre ser o melhor. É sobre ser melhor do que você era ontem.",
    categoria: "Mentalidade",
    autor: "Davi",
    publico: ["Todos"],
    dataPublicacao: format(new Date(), "yyyy-MM-dd"),
    status: "Ativo",
    criadoEm: "2026-02-15T08:00:00",
  },
  {
    id: "msg-2",
    texto: "Cada 'não' te aproxima de um 'sim'. Continue prospectando com consistência.",
    categoria: "Vendas",
    autor: "Gabriel",
    publico: ["Franqueados"],
    dataPublicacao: "2026-02-22",
    status: "Programado",
    criadoEm: "2026-02-14T10:00:00",
  },
  {
    id: "msg-3",
    texto: "Gestão é transformar dados em decisões. Olhe seu DRE toda semana.",
    categoria: "Gestão",
    autor: "Davi",
    publico: ["Franqueadora", "Franqueados"],
    dataPublicacao: "2026-02-23",
    status: "Programado",
    criadoEm: "2026-02-14T11:00:00",
  },
  {
    id: "msg-4",
    texto: "Marketing não é custo, é investimento. Meça o ROI de cada campanha.",
    categoria: "Marketing",
    autor: "Amanda",
    publico: ["Franqueados"],
    dataPublicacao: "2026-02-24",
    status: "Programado",
    criadoEm: "2026-02-13T09:00:00",
  },
  {
    id: "msg-5",
    texto: "Um líder não cria seguidores. Um líder cria outros líderes.",
    categoria: "Liderança",
    autor: "Davi",
    publico: ["Todos"],
    dataPublicacao: "2026-02-18",
    status: "Arquivado",
    criadoEm: "2026-02-10T08:00:00",
  },
  {
    id: "msg-6",
    texto: "A venda acontece quando o cliente confia mais em você do que na objeção dele.",
    categoria: "Vendas",
    autor: "Victor",
    publico: ["Franqueados"],
    dataPublicacao: "2026-02-17",
    status: "Arquivado",
    criadoEm: "2026-02-09T08:00:00",
  },
  {
    id: "msg-7",
    texto: "Consistência supera intensidade. Faça pouco, mas faça todos os dias.",
    categoria: "Mentalidade",
    autor: "Davi",
    publico: ["Todos"],
    dataPublicacao: "2026-02-16",
    status: "Arquivado",
    criadoEm: "2026-02-08T08:00:00",
  },
  {
    id: "msg-8",
    texto: "O conteúdo que educa, vende. O que só vende, espanta.",
    categoria: "Marketing",
    autor: "Amanda",
    publico: ["Franqueados"],
    dataPublicacao: "2026-02-15",
    status: "Arquivado",
    criadoEm: "2026-02-07T08:00:00",
  },
  {
    id: "msg-9",
    texto: "Caixa é oxigênio. Controle suas despesas antes que elas controlem você.",
    categoria: "Gestão",
    autor: "Davi",
    publico: ["Franqueadora", "Franqueados"],
    dataPublicacao: "2026-02-14",
    status: "Arquivado",
    criadoEm: "2026-02-06T08:00:00",
  },
  {
    id: "msg-10",
    texto: "A cultura da sua equipe é reflexo das suas ações, não dos seus discursos.",
    categoria: "Liderança",
    autor: "Davi",
    publico: ["Todos"],
    dataPublicacao: "2026-02-13",
    status: "Arquivado",
    criadoEm: "2026-02-05T08:00:00",
  },
  {
    id: "msg-11",
    texto: "Prospectar é plantar. Quem não planta hoje, não colhe no próximo mês.",
    categoria: "Vendas",
    autor: "Gabriel",
    publico: ["Franqueados"],
    dataPublicacao: "2026-02-12",
    status: "Arquivado",
    criadoEm: "2026-02-04T08:00:00",
  },
  {
    id: "msg-12",
    texto: "Dados sem ação são apenas números. Transforme cada insight em um próximo passo.",
    categoria: "Gestão",
    autor: "Davi",
    publico: ["Todos"],
    dataPublicacao: "2026-02-11",
    status: "Arquivado",
    criadoEm: "2026-02-03T08:00:00",
  },
];

const FALLBACK_MENSAGEM: MensagemDoDia = {
  id: "msg-fallback",
  texto: "Foco, disciplina e execução. Essa é a fórmula da semana.",
  categoria: "Mentalidade",
  autor: "Sistema",
  publico: ["Todos"],
  dataPublicacao: "",
  status: "Ativo",
  criadoEm: "",
};

// ========== HELPERS ==========

export function getSaudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function getMensagemHoje(): MensagemDoDia {
  const today = format(new Date(), "yyyy-MM-dd");
  const ativa = mockMensagens.find(m => m.status === "Ativo" && m.dataPublicacao === today);
  if (ativa) return ativa;
  const anyAtiva = mockMensagens.find(m => m.status === "Ativo");
  return anyAtiva || FALLBACK_MENSAGEM;
}

export function getAlertasFranqueadora(): AlertaHome[] {
  const alertas: AlertaHome[] = [];
  const now = new Date();

  // Chamados abertos
  mockTickets
    .filter(t => !["Resolvido", "Encerrado"].includes(t.status))
    .forEach(t => {
      alertas.push({
        id: `alert-ticket-${t.id}`,
        tipo: "chamado",
        titulo: `Chamado ${t.numero} — ${t.unidadeNome}`,
        descricao: t.descricao.substring(0, 80) + "...",
        prioridade: t.prioridade === "Urgente" || t.prioridade === "Alta" ? "alta" : t.prioridade === "Normal" ? "media" : "baixa",
        link: "/franqueadora/atendimento",
        moduloOrigem: "Atendimento",
        criadoEm: t.criadoEm,
      });
    });

  // Contratos vencendo em 30 dias
  mockContratos
    .filter(c => {
      if (c.status === "Cancelado" || c.status === "Vencido") return false;
      const fim = parseISO(c.dataFim);
      return isBefore(fim, addDays(now, 30)) && isAfter(fim, now);
    })
    .forEach(c => {
      alertas.push({
        id: `alert-contrato-${c.id}`,
        tipo: "contrato",
        titulo: `Contrato ${c.numero} vencendo`,
        descricao: `${c.clienteNome} — vence em ${format(parseISO(c.dataFim), "dd/MM/yyyy")}`,
        prioridade: "media",
        link: "/franqueadora/contratos",
        moduloOrigem: "Contratos",
        criadoEm: c.atualizadoEm,
      });
    });

  // Onboarding — tarefas atrasadas
  onboardingTasks
    .filter(t => t.status === "Atrasada")
    .forEach(t => {
      const ob = mockOnboardings.find(o => o.id === t.onboardingId);
      alertas.push({
        id: `alert-onb-${t.id}`,
        tipo: "onboarding",
        titulo: `Tarefa atrasada — ${ob?.unidadeNome || ""}`,
        descricao: t.tarefa,
        prioridade: "alta",
        link: "/franqueadora/onboarding",
        moduloOrigem: "Onboarding",
        criadoEm: t.prazo,
      });
    });

  // Reuniões onboarding pendentes
  mockMeetings
    .filter(m => m.status === "Cancelada" || m.status === "Agendada")
    .forEach(m => {
      if (m.status === "Cancelada") {
        const ob = mockOnboardings.find(o => o.id === m.onboardingId);
        alertas.push({
          id: `alert-meeting-${m.id}`,
          tipo: "onboarding",
          titulo: `Reunião cancelada — ${ob?.unidadeNome || ""}`,
          descricao: `${m.tipo}: ${m.resumo.substring(0, 60)}`,
          prioridade: "alta",
          link: "/franqueadora/onboarding",
          moduloOrigem: "Onboarding",
          criadoEm: m.data,
        });
      }
    });

  // Comunicados críticos
  mockComunicados
    .filter(c => c.status === "Ativo" && c.prioridade === "Crítica")
    .forEach(c => {
      alertas.push({
        id: `alert-com-${c.id}`,
        tipo: "comunicado",
        titulo: c.titulo,
        descricao: "Comunicado crítico ativo",
        prioridade: "alta",
        link: "/franqueadora/comunicados",
        moduloOrigem: "Comunicados",
        criadoEm: c.criadoEm,
      });
    });

  // Provas pendentes (placeholder)
  alertas.push({
    id: "alert-prova-1",
    tipo: "prova",
    titulo: "2 provas pendentes na Academy",
    descricao: "Módulo de vendas e módulo de atendimento aguardam avaliação",
    prioridade: "baixa",
    link: "/franqueadora/treinamentos",
    moduloOrigem: "Academy",
    criadoEm: new Date().toISOString(),
  });

  return alertas.sort((a, b) => {
    const p = { alta: 0, media: 1, baixa: 2 };
    return p[a.prioridade] - p[b.prioridade];
  });
}

export function getPrioridadesDoDia(alertas: AlertaHome[]): PrioridadeDoDia[] {
  return alertas.slice(0, 3).map((a, i) => ({
    id: a.id,
    titulo: a.titulo,
    descricao: a.descricao,
    tipo: a.tipo,
    link: a.link,
    urgencia: (i + 1) as 1 | 2 | 3,
  }));
}

export function getQuickActions() {
  return [
    { label: "Novo chamado", path: "/franqueadora/atendimento", icon: "MessageSquare" },
    { label: "Criar evento", path: "/franqueadora/agenda", icon: "Calendar" },
    { label: "Novo comunicado", path: "/franqueadora/comunicados", icon: "Megaphone" },
    { label: "CRM Expansão", path: "/franqueadora/crm", icon: "TrendingUp" },
  ];
}

// Dados comerciais agregados
export function getDadosComerciais() {
  const summary = getMonthSummary("2026-02");
  const ranking = getRankingForMonth("2026-02");
  const leadsNovos = mockLeads.filter(l => l.stage === "Novo Lead" && l.leadStatus === "Ativo").length;
  const chamadosAbertos = mockTickets.filter(t => !["Resolvido", "Encerrado"].includes(t.status)).length;

  return {
    faturamentoRede: summary.receitaBruta,
    topUnidades: ranking.slice(0, 3),
    leadsNovos,
    chamadosAbertos,
  };
}

// Próximos eventos
export function getProximosEventos(limit = 5): AgendaEvent[] {
  const now = new Date();
  const calendarIds = mockCalendars.map(c => c.id);
  return mockEvents
    .filter(e => calendarIds.includes(e.calendarId) && isAfter(parseISO(e.inicio), now) && e.status !== "Cancelado")
    .sort((a, b) => parseISO(a.inicio).getTime() - parseISO(b.inicio).getTime())
    .slice(0, limit);
}

// Comunicados ativos para dashboard
export function getComunicadosAtivos(limit = 3): Comunicado[] {
  const prioridadeOrder = { "Crítica": 0, "Alta": 1, "Normal": 2 };
  return mockComunicados
    .filter(c => c.status === "Ativo" && c.mostrarDashboard)
    .sort((a, b) => prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade])
    .slice(0, limit);
}

export const MENSAGEM_CATEGORIAS: MensagemCategoria[] = ["Mentalidade", "Vendas", "Gestão", "Marketing", "Liderança"];
