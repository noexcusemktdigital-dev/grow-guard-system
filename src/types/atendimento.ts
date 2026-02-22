// Atendimento types and constants (extracted from atendimentoData.ts)

export type TicketStatus = "Aberto" | "Em analise" | "Em atendimento" | "Aguardando franqueado" | "Resolvido" | "Encerrado" | "Reaberto";
export type TicketPriority = "Baixa" | "Normal" | "Alta" | "Urgente";
export type TicketCategory = "Financeiro" | "Juridico" | "Clientes" | "Marketing" | "Comercial" | "Sistema" | "Academy" | "Onboarding" | "Geral";

export interface Ticket {
  id: string;
  numero: string;
  unidadeId: string;
  unidadeNome: string;
  categoria: TicketCategory;
  subcategoria: string;
  prioridade: TicketPriority;
  status: TicketStatus;
  responsavelId: string;
  responsavelNome: string;
  descricao: string;
  anexos: string[];
  slaDeadline: string;
  avaliacao?: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface TicketMessage {
  id: string;
  chamadoId: string;
  autorTipo: "franqueado" | "suporte";
  autorNome: string;
  mensagem: string;
  anexo?: string;
  criadoEm: string;
}

export const TICKET_STATUSES: TicketStatus[] = [
  "Aberto", "Em analise", "Em atendimento", "Aguardando franqueado", "Resolvido", "Encerrado"
];

export const CATEGORIES: TicketCategory[] = [
  "Financeiro", "Juridico", "Clientes", "Marketing", "Comercial", "Sistema", "Academy", "Onboarding", "Geral"
];

export const SUBCATEGORIES_MAP: Record<TicketCategory, string[]> = {
  Financeiro: ["Dúvida de repasse", "DRE", "Cobrança", "Sistema mensalidade", "Nota fiscal"],
  Juridico: ["Contrato", "COF", "Minuta", "Cláusulas", "Documentação"],
  Clientes: ["Problemas com cliente", "Cancelamento", "Renovação", "Cobrança cliente", "Escopo"],
  Marketing: ["Material de campanha", "Criativo", "Estratégia", "Meta Ads", "Google Ads"],
  Comercial: ["Proposta", "Calculadora", "Estratégia de venda", "Objeção"],
  Sistema: ["Erro no sistema", "Acesso", "Permissão", "Bug", "Integração"],
  Academy: ["Prova", "Certificado", "Módulo bloqueado"],
  Onboarding: ["Etapa", "Reunião", "Implantação"],
  Geral: ["Dúvida", "Sugestão", "Reclamação"],
};

export const SLA_DEADLINES: Record<TicketPriority, number> = {
  Urgente: 4,
  Alta: 8,
  Normal: 24,
  Baixa: 48,
};

export const RESPONSAVEIS = [
  { id: "r1", nome: "Davi" },
  { id: "r2", nome: "Lucas" },
  { id: "r3", nome: "Amanda" },
];

export interface AtendimentoAlert {
  tipo: "sla" | "sem_resposta" | "aguardando" | "total";
  label: string;
  count: number;
  cor: string;
}

// Helpers (pure functions)
export function isSlaBreached(ticket: Ticket): boolean {
  if (ticket.status === "Resolvido" || ticket.status === "Encerrado") return false;
  return new Date(ticket.slaDeadline) < new Date();
}

export function getSlaRemaining(ticket: Ticket): string {
  if (ticket.status === "Resolvido" || ticket.status === "Encerrado") return "—";
  const diff = new Date(ticket.slaDeadline).getTime() - new Date().getTime();
  if (diff <= 0) return "Estourado";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

export function calculateSlaDeadline(prioridade: TicketPriority): string {
  const hours = SLA_DEADLINES[prioridade];
  return new Date(Date.now() + hours * 3600000).toISOString();
}
