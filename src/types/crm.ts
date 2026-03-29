// @ts-nocheck
// CRM types and constants (extracted from crmData.ts)

export type FunnelType = "franchise" | "clients";

export const FRANCHISE_STAGES = [
  "Novo Lead", "Primeiro Contato", "Follow-up", "Apresentação da Franquia",
  "Liberação de COF e Minuta", "Apresentação de Projeção", "Proposta", "Venda", "Oportunidade Perdida",
] as const;

export const CLIENT_STAGES = [
  "Novo Lead", "Primeiro Contato", "Follow-up", "Diagnóstico",
  "Apresentação de Estratégia", "Proposta", "Venda", "Oportunidade Perdida",
] as const;

export type FranchiseFunnelStage = (typeof FRANCHISE_STAGES)[number];
export type ClientFunnelStage = (typeof CLIENT_STAGES)[number];

export type LeadTemperature = "Frio" | "Morno" | "Quente";
export type LeadOrigin = "Meta Leads" | "Formulário" | "WhatsApp" | "Indicação" | "Orgânico" | "Eventos";
export type LeadStatus = "Ativo" | "Perdido" | "Vendido";
export type ContactStatus = "Sem contato" | "Em andamento" | "Sem resposta";

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cidade: string;
  uf: string;
  funnel: FunnelType;
  stage: string;
  origin: LeadOrigin;
  responsavel: string;
  temperature: LeadTemperature;
  contactStatus: ContactStatus;
  leadStatus: LeadStatus;
  tags: string[];
  observacoes: string;
  valorPotencial?: number;
  criadoEm: string;
  atualizadoEm: string;
  perfil?: "investidor" | "operador";
  capitalDisponivel?: string;
  prazoDecisao?: string;
  cidadeInteresse?: string;
  empresa?: string;
  segmento?: string;
  ticketPotencial?: number;
  dorPrincipal?: string;
}

export type ActivityType = "ligacao" | "whatsapp" | "reuniao" | "email";

export interface Activity {
  id: string;
  leadId: string;
  tipo: ActivityType;
  dataHora: string;
  resultado: string;
  proximoPasso: string;
  anexo?: string;
}

export type TaskStatus = "Aberta" | "Concluída" | "Atrasada";

export interface Task {
  id: string;
  leadId: string;
  descricao: string;
  dataHora: string;
  status: TaskStatus;
  responsavel: string;
}

export interface LeadFile {
  id: string;
  leadId: string;
  nome: string;
  tipo: string;
  data: string;
}

export type ProposalStatus = "rascunho" | "enviada" | "aceita";

export interface LeadProposal {
  id: string;
  leadId: string;
  valor: number;
  status: ProposalStatus;
}

export interface CrmAlert {
  type: "no-contact" | "overdue-task" | "hot-stalled" | "conversion-rate";
  label: string;
  count: number;
  color: string;
}

// Constants
export const LEAD_ORIGINS: LeadOrigin[] = ["Meta Leads", "Formulário", "WhatsApp", "Indicação", "Orgânico", "Eventos"];
export const RESPONSAVEIS = ["Davi", "Gabriel", "Victor"];
export const TEMPERATURES: LeadTemperature[] = ["Frio", "Morno", "Quente"];
export const CONTACT_STATUSES: ContactStatus[] = ["Sem contato", "Em andamento", "Sem resposta"];
export const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

// Helpers (pure functions, no mock data dependency)
export function getStagesForFunnel(funnel: FunnelType): readonly string[] {
  return funnel === "franchise" ? FRANCHISE_STAGES : CLIENT_STAGES;
}

export function getAlerts(leads: Lead[], tasks: Task[]): CrmAlert[] {
  const now = new Date();
  const noContact = leads.filter(
    (l) => l.leadStatus === "Ativo" && l.contactStatus === "Sem contato" &&
      (now.getTime() - new Date(l.criadoEm).getTime()) > 24 * 60 * 60 * 1000
  );
  const overdueTasks = tasks.filter((t) => t.status === "Atrasada");
  const hotStalled = leads.filter(
    (l) => l.leadStatus === "Ativo" && l.temperature === "Quente" &&
      (now.getTime() - new Date(l.atualizadoEm).getTime()) > 3 * 24 * 60 * 60 * 1000
  );
  const totalActive = leads.filter((l) => l.leadStatus !== "Perdido").length;
  const converted = leads.filter((l) => l.leadStatus === "Vendido").length;
  const rate = totalActive > 0 ? Math.round((converted / totalActive) * 100) : 0;

  return [
    { type: "no-contact", label: "Sem 1º contato (24h+)", count: noContact.length, color: "text-red-600" },
    { type: "overdue-task", label: "Tarefas vencidas", count: overdueTasks.length, color: "text-orange-600" },
    { type: "hot-stalled", label: "Quentes parados (3d+)", count: hotStalled.length, color: "text-amber-600" },
    { type: "conversion-rate", label: "Taxa conversão", count: rate, color: "text-blue-600" },
  ];
}
