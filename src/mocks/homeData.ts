import type { Ticket } from "@/types/atendimento";
import { isSlaBreached } from "@/types/atendimento";

const now = new Date();
const h = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3600000).toISOString();
const future = (hoursAhead: number) => new Date(now.getTime() + hoursAhead * 3600000).toISOString();

const mockTickets: Ticket[] = [
  { id: "t1", numero: "#001", unidadeId: "u1", unidadeNome: "Unidade Centro", categoria: "Financeiro", subcategoria: "Dúvida de repasse", prioridade: "Urgente", status: "Aberto", responsavelId: "r1", responsavelNome: "Davi", descricao: "Franqueado reporta divergência no valor de repasse do mês de janeiro.", anexos: ["relatorio_jan.pdf"], slaDeadline: h(1), criadoEm: h(6), atualizadoEm: h(2) },
  { id: "t2", numero: "#002", unidadeId: "u2", unidadeNome: "Unidade Norte", categoria: "Sistema", subcategoria: "Bug", prioridade: "Alta", status: "Em analise", responsavelId: "r2", responsavelNome: "Lucas", descricao: "Sistema não gera relatório DRE corretamente.", anexos: [], slaDeadline: h(-2), criadoEm: h(12), atualizadoEm: h(4) },
  { id: "t3", numero: "#003", unidadeId: "u3", unidadeNome: "Unidade Sul", categoria: "Marketing", subcategoria: "Material de campanha", prioridade: "Normal", status: "Em atendimento", responsavelId: "r3", responsavelNome: "Amanda", descricao: "Artes para campanha de Dia das Mães.", anexos: ["briefing.docx"], slaDeadline: future(12), criadoEm: h(20), atualizadoEm: h(3) },
  { id: "t4", numero: "#004", unidadeId: "u4", unidadeNome: "Unidade Leste", categoria: "Clientes", subcategoria: "Cancelamento", prioridade: "Alta", status: "Aguardando franqueado", responsavelId: "r1", responsavelNome: "Davi", descricao: "Cliente importante solicitou cancelamento.", anexos: [], slaDeadline: future(2), criadoEm: h(30), atualizadoEm: h(50) },
  { id: "t5", numero: "#005", unidadeId: "u1", unidadeNome: "Unidade Centro", categoria: "Juridico", subcategoria: "Contrato", prioridade: "Normal", status: "Aberto", responsavelId: "r2", responsavelNome: "Lucas", descricao: "Dúvida sobre cláusula de exclusividade territorial.", anexos: ["contrato_v2.pdf"], slaDeadline: future(18), criadoEm: h(8), atualizadoEm: h(8) },
];
import { mockComunicados, type Comunicado } from "./comunicadosData";
import { mockOnboardings, mockMeetings, mockTasks as onboardingTasks } from "./onboardingData";
import type { AgendaEvent } from "@/types/agenda";
import { mockLeads } from "./crm";
import { getRankingForMonth } from "./metasRankingData";
import type { Contrato } from "@/types/contratos";
import { parseISO, isAfter, isBefore, addDays, format } from "date-fns";

// Inline mock contracts (previously from contratosData)
const mockContratos: Contrato[] = [
  { id: "ctr-1", numero: "CTR-001", tipo: "Assessoria", dono: "Franqueado", clienteNome: "Clínica Saúde Mais", clienteDocumento: "12.345.678/0001-90", clienteEmail: "contato@saudemais.com", franqueadoId: "f1", franqueadoNome: "João Silva (Unidade Centro)", produto: "Assessoria", recorrencia: "Mensal", valorMensal: 2500, valorTotal: 30000, dataInicio: "2025-01-01", dataFim: "2025-12-31", status: "Assinado", templateId: "tpl-1", observacoes: "Cliente prioritário", criadoEm: "2024-12-20", atualizadoEm: "2025-01-02" },
  { id: "ctr-2", numero: "CTR-002", tipo: "SaaS", dono: "Interno", clienteNome: "Tech Solutions LTDA", clienteDocumento: "98.765.432/0001-10", clienteEmail: "financeiro@techsolutions.com", produto: "SaaS", recorrencia: "Anual", valorMensal: 1200, valorTotal: 14400, dataInicio: "2025-02-01", dataFim: "2026-01-31", status: "Aguardando Assinatura", templateId: "tpl-2", observacoes: "", criadoEm: "2025-01-25", atualizadoEm: "2025-01-25" },
  { id: "ctr-5", numero: "CTR-005", tipo: "Sistema", dono: "Parceiro", clienteNome: "Escola Futuro Brilhante", clienteDocumento: "55.666.777/0001-88", clienteEmail: "escola@futurobrilhante.com", produto: "Sistema", recorrencia: "Mensal", valorMensal: 250, valorTotal: 3000, dataInicio: "2024-06-01", dataFim: "2025-05-31", status: "Vencido", observacoes: "Renovação pendente", criadoEm: "2024-05-20", atualizadoEm: "2025-06-01" },
];

function getMonthSummary(_month: string) {
  return {
    receitaBruta: 73000,
    receitaPorProduto: { Assessoria: 42000, SaaS: 18000, Sistema: 8000, Franquia: 5000 },
  };
}

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

// Próximos eventos - now returns empty since mock data was removed
// The parent (Home.tsx) fetches real events from useCalendarEvents
export function getProximosEventos(_limit = 5): AgendaEvent[] {
  return [];
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
