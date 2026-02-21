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

const now = new Date();
const h = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3600000).toISOString();
const future = (hoursAhead: number) => new Date(now.getTime() + hoursAhead * 3600000).toISOString();

export const mockTickets: Ticket[] = [
  {
    id: "t1", numero: "#001", unidadeId: "u1", unidadeNome: "Unidade Centro",
    categoria: "Financeiro", subcategoria: "Dúvida de repasse", prioridade: "Urgente", status: "Aberto",
    responsavelId: "r1", responsavelNome: "Davi",
    descricao: "Franqueado reporta divergência no valor de repasse do mês de janeiro. Solicita revisão urgente.",
    anexos: ["relatorio_jan.pdf"], slaDeadline: h(1), // SLA estourado
    criadoEm: h(6), atualizadoEm: h(2),
  },
  {
    id: "t2", numero: "#002", unidadeId: "u2", unidadeNome: "Unidade Norte",
    categoria: "Sistema", subcategoria: "Bug", prioridade: "Alta", status: "Em analise",
    responsavelId: "r2", responsavelNome: "Lucas",
    descricao: "Sistema não gera relatório DRE corretamente. Valores de receita aparecem zerados.",
    anexos: [], slaDeadline: h(-2), // SLA estourado
    criadoEm: h(12), atualizadoEm: h(4),
  },
  {
    id: "t3", numero: "#003", unidadeId: "u3", unidadeNome: "Unidade Sul",
    categoria: "Marketing", subcategoria: "Material de campanha", prioridade: "Normal", status: "Em atendimento",
    responsavelId: "r3", responsavelNome: "Amanda",
    descricao: "Precisa de artes para campanha de Dia das Mães. Formatos: stories e feed.",
    anexos: ["briefing.docx"], slaDeadline: future(12),
    criadoEm: h(20), atualizadoEm: h(3),
  },
  {
    id: "t4", numero: "#004", unidadeId: "u4", unidadeNome: "Unidade Leste",
    categoria: "Clientes", subcategoria: "Cancelamento", prioridade: "Alta", status: "Aguardando franqueado",
    responsavelId: "r1", responsavelNome: "Davi",
    descricao: "Cliente importante solicitou cancelamento. Aguardando franqueado enviar histórico de atendimento.",
    anexos: [], slaDeadline: future(2),
    criadoEm: h(30), atualizadoEm: h(50),
  },
  {
    id: "t5", numero: "#005", unidadeId: "u1", unidadeNome: "Unidade Centro",
    categoria: "Juridico", subcategoria: "Contrato", prioridade: "Normal", status: "Aberto",
    responsavelId: "r2", responsavelNome: "Lucas",
    descricao: "Dúvida sobre cláusula de exclusividade territorial no contrato de franquia.",
    anexos: ["contrato_v2.pdf"], slaDeadline: future(18),
    criadoEm: h(8), atualizadoEm: h(8),
  },
  {
    id: "t6", numero: "#006", unidadeId: "u5", unidadeNome: "Unidade Oeste",
    categoria: "Onboarding", subcategoria: "Etapa", prioridade: "Normal", status: "Em atendimento",
    responsavelId: "r3", responsavelNome: "Amanda",
    descricao: "Franqueado com dificuldade na etapa de configuração comercial do onboarding.",
    anexos: [], slaDeadline: future(10),
    criadoEm: h(15), atualizadoEm: h(5),
  },
  {
    id: "t7", numero: "#007", unidadeId: "u2", unidadeNome: "Unidade Norte",
    categoria: "Comercial", subcategoria: "Proposta", prioridade: "Baixa", status: "Resolvido",
    responsavelId: "r1", responsavelNome: "Davi",
    descricao: "Solicitação de modelo de proposta comercial atualizado.",
    anexos: ["proposta_modelo.pdf"], slaDeadline: future(30), avaliacao: 5,
    criadoEm: h(72), atualizadoEm: h(24),
  },
  {
    id: "t8", numero: "#008", unidadeId: "u3", unidadeNome: "Unidade Sul",
    categoria: "Academy", subcategoria: "Certificado", prioridade: "Baixa", status: "Encerrado",
    responsavelId: "r2", responsavelNome: "Lucas",
    descricao: "Certificado do módulo de vendas não foi gerado após conclusão da prova.",
    anexos: [], slaDeadline: future(40), avaliacao: 4,
    criadoEm: h(96), atualizadoEm: h(48),
  },
  {
    id: "t9", numero: "#009", unidadeId: "u6", unidadeNome: "Unidade Jardins",
    categoria: "Geral", subcategoria: "Sugestão", prioridade: "Baixa", status: "Aberto",
    responsavelId: "r3", responsavelNome: "Amanda",
    descricao: "Sugestão de melhoria no dashboard: incluir gráfico comparativo mensal.",
    anexos: [], slaDeadline: future(36),
    criadoEm: h(10), atualizadoEm: h(10),
  },
  {
    id: "t10", numero: "#010", unidadeId: "u7", unidadeNome: "Unidade Paulista",
    categoria: "Sistema", subcategoria: "Acesso", prioridade: "Urgente", status: "Em analise",
    responsavelId: "r1", responsavelNome: "Davi",
    descricao: "Funcionário novo não consegue acessar o sistema. Permissões não foram atribuídas.",
    anexos: [], slaDeadline: future(1),
    criadoEm: h(3), atualizadoEm: h(1),
  },
];

export const mockMessages: TicketMessage[] = [
  { id: "m1", chamadoId: "t1", autorTipo: "franqueado", autorNome: "Carlos (Franqueado)", mensagem: "Boa tarde, o valor do repasse veio diferente do combinado. Podem verificar?", criadoEm: h(5) },
  { id: "m2", chamadoId: "t1", autorTipo: "suporte", autorNome: "Davi", mensagem: "Olá Carlos, vou verificar agora com o financeiro. Já retorno.", criadoEm: h(4.5) },
  { id: "m3", chamadoId: "t1", autorTipo: "franqueado", autorNome: "Carlos (Franqueado)", mensagem: "Ok, fico no aguardo. É urgente pois preciso fechar o caixa.", criadoEm: h(4) },
  { id: "m4", chamadoId: "t2", autorTipo: "franqueado", autorNome: "Marina (Franqueado)", mensagem: "O relatório DRE está vindo com valores zerados desde ontem.", criadoEm: h(10) },
  { id: "m5", chamadoId: "t2", autorTipo: "suporte", autorNome: "Lucas", mensagem: "Identificamos o problema. A integração com o módulo financeiro teve uma falha. Estamos corrigindo.", criadoEm: h(8) },
  { id: "m6", chamadoId: "t2", autorTipo: "suporte", autorNome: "Lucas", mensagem: "Correção aplicada. Pode testar novamente e confirmar?", criadoEm: h(5) },
  { id: "m7", chamadoId: "t3", autorTipo: "franqueado", autorNome: "Roberto (Franqueado)", mensagem: "Preciso das artes até sexta-feira. É possível?", criadoEm: h(18) },
  { id: "m8", chamadoId: "t3", autorTipo: "suporte", autorNome: "Amanda", mensagem: "Sim, vou encaminhar ao time de design. Teremos as artes prontas até quinta.", criadoEm: h(16) },
  { id: "m9", chamadoId: "t3", autorTipo: "franqueado", autorNome: "Roberto (Franqueado)", mensagem: "Perfeito! Seguem as referências visuais que gostaria.", criadoEm: h(14) },
  { id: "m10", chamadoId: "t4", autorTipo: "suporte", autorNome: "Davi", mensagem: "Precisamos do histórico de atendimento desse cliente para analisar a situação.", criadoEm: h(28) },
  { id: "m11", chamadoId: "t4", autorTipo: "franqueado", autorNome: "Juliana (Franqueado)", mensagem: "Vou levantar e enviar até amanhã.", criadoEm: h(26) },
  { id: "m12", chamadoId: "t6", autorTipo: "franqueado", autorNome: "Pedro (Franqueado)", mensagem: "Não estou conseguindo avançar na configuração comercial. O sistema trava.", criadoEm: h(14) },
  { id: "m13", chamadoId: "t6", autorTipo: "suporte", autorNome: "Amanda", mensagem: "Vamos agendar uma call para resolver juntos. Que horário funciona?", criadoEm: h(12) },
  { id: "m14", chamadoId: "t10", autorTipo: "franqueado", autorNome: "Ana (Franqueado)", mensagem: "O novo funcionário precisa do acesso urgente, começa amanhã!", criadoEm: h(2) },
  { id: "m15", chamadoId: "t10", autorTipo: "suporte", autorNome: "Davi", mensagem: "Entendido. Vou solicitar a liberação agora. Qual o email dele?", criadoEm: h(1) },
];

export function getTicketsByStatus(tickets: Ticket[], status: TicketStatus): Ticket[] {
  return tickets.filter(t => t.status === status);
}

export function getMessagesForTicket(ticketId: string): TicketMessage[] {
  return mockMessages.filter(m => m.chamadoId === ticketId);
}

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

export interface AtendimentoAlert {
  tipo: "sla" | "sem_resposta" | "aguardando" | "total";
  label: string;
  count: number;
  cor: string;
}

export function getAtendimentoAlerts(tickets: Ticket[]): AtendimentoAlert[] {
  const slaEstourado = tickets.filter(t => isSlaBreached(t)).length;
  const semResposta = tickets.filter(t => t.status === "Aberto" && getMessagesForTicket(t.id).filter(m => m.autorTipo === "suporte").length === 0).length;
  const aguardando48h = tickets.filter(t => {
    if (t.status !== "Aguardando franqueado") return false;
    const diff = new Date().getTime() - new Date(t.atualizadoEm).getTime();
    return diff > 48 * 3600000;
  }).length;
  const abertos = tickets.filter(t => !["Resolvido", "Encerrado"].includes(t.status)).length;

  return [
    { tipo: "sla", label: "SLA Estourado", count: slaEstourado, cor: "text-red-500" },
    { tipo: "sem_resposta", label: "Sem Resposta", count: semResposta, cor: "text-orange-500" },
    { tipo: "aguardando", label: "Aguardando +48h", count: aguardando48h, cor: "text-yellow-500" },
    { tipo: "total", label: "Chamados Abertos", count: abertos, cor: "text-blue-500" },
  ];
}

export function calculateSlaDeadline(prioridade: TicketPriority): string {
  const hours = SLA_DEADLINES[prioridade];
  return new Date(Date.now() + hours * 3600000).toISOString();
}
