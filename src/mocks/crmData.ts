// ---- Types ----

export type FunnelType = "franchise" | "clients";

export const FRANCHISE_STAGES = [
  "Novo Lead",
  "Primeiro Contato",
  "Follow-up",
  "Apresentação da Franquia",
  "Liberação de COF e Minuta",
  "Apresentação de Projeção",
  "Proposta",
  "Venda",
  "Oportunidade Perdida",
] as const;

export const CLIENT_STAGES = [
  "Novo Lead",
  "Primeiro Contato",
  "Follow-up",
  "Diagnóstico",
  "Apresentação de Estratégia",
  "Proposta",
  "Venda",
  "Oportunidade Perdida",
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
  // Franchise fields
  perfil?: "investidor" | "operador";
  capitalDisponivel?: string;
  prazoDecisao?: string;
  cidadeInteresse?: string;
  // Client fields
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

// ---- Constants ----

export const LEAD_ORIGINS: LeadOrigin[] = ["Meta Leads", "Formulário", "WhatsApp", "Indicação", "Orgânico", "Eventos"];
export const RESPONSAVEIS = ["Davi", "Gabriel", "Victor"];
export const TEMPERATURES: LeadTemperature[] = ["Frio", "Morno", "Quente"];
export const CONTACT_STATUSES: ContactStatus[] = ["Sem contato", "Em andamento", "Sem resposta"];
export const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

// ---- Mock Data ----

export const mockLeads: Lead[] = [
  {
    id: "lead-1", nome: "Ricardo Mendes", telefone: "(41) 99876-5432", whatsapp: "(41) 99876-5432",
    email: "ricardo@email.com", cidade: "Londrina", uf: "PR", funnel: "franchise", stage: "Novo Lead",
    origin: "Meta Leads", responsavel: "Davi", temperature: "Quente", contactStatus: "Sem contato",
    leadStatus: "Ativo", tags: ["urgente"], observacoes: "Interessado em região Sul",
    valorPotencial: 150000, criadoEm: "2026-02-19T10:00:00", atualizadoEm: "2026-02-19T10:00:00",
    perfil: "investidor", capitalDisponivel: "R$ 200.000", cidadeInteresse: "Londrina",
  },
  {
    id: "lead-2", nome: "Camila Ferreira", telefone: "(11) 98765-1234", whatsapp: "(11) 98765-1234",
    email: "camila@empresa.com", cidade: "Campinas", uf: "SP", funnel: "franchise", stage: "Apresentação da Franquia",
    origin: "Indicação", responsavel: "Gabriel", temperature: "Morno", contactStatus: "Em andamento",
    leadStatus: "Ativo", tags: [], observacoes: "Conheceu via parceiro", valorPotencial: 180000,
    criadoEm: "2026-02-10T14:00:00", atualizadoEm: "2026-02-18T09:00:00",
    perfil: "operador", capitalDisponivel: "R$ 150.000", prazoDecisao: "30 dias", cidadeInteresse: "Campinas",
  },
  {
    id: "lead-3", nome: "André Souza", telefone: "(21) 97654-3210", whatsapp: "(21) 97654-3210",
    email: "andre@mail.com", cidade: "Rio de Janeiro", uf: "RJ", funnel: "franchise", stage: "Proposta",
    origin: "Orgânico", responsavel: "Victor", temperature: "Quente", contactStatus: "Em andamento",
    leadStatus: "Ativo", tags: ["prioritário"], observacoes: "Aguardando proposta final",
    valorPotencial: 200000, criadoEm: "2026-01-25T08:00:00", atualizadoEm: "2026-02-20T16:00:00",
    perfil: "investidor", capitalDisponivel: "R$ 300.000", prazoDecisao: "15 dias", cidadeInteresse: "Niterói",
  },
  {
    id: "lead-4", nome: "Fernanda Lima", telefone: "(31) 91234-5678", whatsapp: "(31) 91234-5678",
    email: "fernanda@mail.com", cidade: "Belo Horizonte", uf: "MG", funnel: "franchise", stage: "Venda",
    origin: "Eventos", responsavel: "Davi", temperature: "Quente", contactStatus: "Em andamento",
    leadStatus: "Vendido", tags: ["convertido"], observacoes: "Franquia assinada",
    valorPotencial: 250000, criadoEm: "2025-12-01T10:00:00", atualizadoEm: "2026-02-01T10:00:00",
    perfil: "operador", capitalDisponivel: "R$ 250.000", cidadeInteresse: "BH",
  },
  {
    id: "lead-5", nome: "Bruno Almeida", telefone: "(41) 93456-7890", whatsapp: "(41) 93456-7890",
    email: "bruno@mail.com", cidade: "Curitiba", uf: "PR", funnel: "franchise", stage: "Oportunidade Perdida",
    origin: "WhatsApp", responsavel: "Gabriel", temperature: "Frio", contactStatus: "Sem resposta",
    leadStatus: "Perdido", tags: [], observacoes: "Não respondeu após 3 tentativas",
    criadoEm: "2026-01-15T10:00:00", atualizadoEm: "2026-02-10T10:00:00",
  },
  // Client funnel leads
  {
    id: "lead-6", nome: "Empresa TechSol", telefone: "(11) 3456-7890", whatsapp: "(11) 93456-7890",
    email: "contato@techsol.com", cidade: "São Paulo", uf: "SP", funnel: "clients", stage: "Novo Lead",
    origin: "Meta Leads", responsavel: "Davi", temperature: "Quente", contactStatus: "Sem contato",
    leadStatus: "Ativo", tags: ["tech"], observacoes: "Empresa de tecnologia interessada em assessoria",
    criadoEm: "2026-02-20T08:00:00", atualizadoEm: "2026-02-20T08:00:00",
    empresa: "TechSol Ltda", segmento: "Tecnologia", ticketPotencial: 5000, dorPrincipal: "Precisa de marketing digital",
  },
  {
    id: "lead-7", nome: "Clínica Bella Saúde", telefone: "(41) 3222-1111", whatsapp: "(41) 99222-1111",
    email: "bella@clinica.com", cidade: "Curitiba", uf: "PR", funnel: "clients", stage: "Diagnóstico",
    origin: "Indicação", responsavel: "Gabriel", temperature: "Morno", contactStatus: "Em andamento",
    leadStatus: "Ativo", tags: ["saúde"], observacoes: "Clínica de estética buscando presença digital",
    criadoEm: "2026-02-05T14:00:00", atualizadoEm: "2026-02-19T11:00:00",
    empresa: "Bella Saúde", segmento: "Saúde", ticketPotencial: 3500, dorPrincipal: "Redes sociais fracas",
  },
  {
    id: "lead-8", nome: "Restaurante Sabor & Arte", telefone: "(43) 3333-4444", whatsapp: "(43) 99333-4444",
    email: "sabor@rest.com", cidade: "Maringá", uf: "PR", funnel: "clients", stage: "Apresentação de Estratégia",
    origin: "Orgânico", responsavel: "Victor", temperature: "Morno", contactStatus: "Em andamento",
    leadStatus: "Ativo", tags: ["food"], observacoes: "Quer aumentar delivery via apps",
    criadoEm: "2026-02-01T09:00:00", atualizadoEm: "2026-02-18T15:00:00",
    empresa: "Sabor & Arte", segmento: "Alimentação", ticketPotencial: 2500, dorPrincipal: "Baixo volume de delivery",
  },
  {
    id: "lead-9", nome: "Auto Center Premium", telefone: "(11) 4444-5555", whatsapp: "(11) 94444-5555",
    email: "premium@auto.com", cidade: "Guarulhos", uf: "SP", funnel: "clients", stage: "Proposta",
    origin: "WhatsApp", responsavel: "Davi", temperature: "Quente", contactStatus: "Em andamento",
    leadStatus: "Ativo", tags: ["auto", "urgente"], observacoes: "Proposta enviada, aguardando retorno",
    valorPotencial: 8000, criadoEm: "2026-01-20T10:00:00", atualizadoEm: "2026-02-20T10:00:00",
    empresa: "Auto Center Premium", segmento: "Automotivo", ticketPotencial: 8000, dorPrincipal: "Precisa gerar leads",
  },
  {
    id: "lead-10", nome: "Escola Criativa Kids", telefone: "(41) 5555-6666", whatsapp: "(41) 95555-6666",
    email: "kids@escola.com", cidade: "Curitiba", uf: "PR", funnel: "clients", stage: "Follow-up",
    origin: "Formulário", responsavel: "Victor", temperature: "Frio", contactStatus: "Sem resposta",
    leadStatus: "Ativo", tags: ["educação"], observacoes: "Pediu orçamento mas não respondeu",
    criadoEm: "2026-02-12T10:00:00", atualizadoEm: "2026-02-15T10:00:00",
    empresa: "Criativa Kids", segmento: "Educação", ticketPotencial: 2000, dorPrincipal: "Matrículas caindo",
  },
];

export const mockActivities: Activity[] = [
  { id: "act-1", leadId: "lead-1", tipo: "ligacao", dataHora: "2026-02-19T10:30:00", resultado: "Não atendeu", proximoPasso: "Tentar novamente amanhã" },
  { id: "act-2", leadId: "lead-2", tipo: "reuniao", dataHora: "2026-02-17T14:00:00", resultado: "Apresentação realizada com sucesso", proximoPasso: "Enviar COF" },
  { id: "act-3", leadId: "lead-3", tipo: "whatsapp", dataHora: "2026-02-20T09:00:00", resultado: "Proposta discutida, pediu ajuste no valor", proximoPasso: "Revisar proposta" },
  { id: "act-4", leadId: "lead-7", tipo: "email", dataHora: "2026-02-18T16:00:00", resultado: "Diagnóstico enviado por email", proximoPasso: "Agendar call de apresentação" },
  { id: "act-5", leadId: "lead-9", tipo: "whatsapp", dataHora: "2026-02-20T10:00:00", resultado: "Proposta enviada, aguardando aceite", proximoPasso: "Fazer follow-up em 2 dias" },
];

export const mockTasks: Task[] = [
  { id: "task-1", leadId: "lead-1", descricao: "Fazer primeiro contato com Ricardo", dataHora: "2026-02-20T09:00:00", status: "Atrasada", responsavel: "Davi" },
  { id: "task-2", leadId: "lead-3", descricao: "Revisar e reenviar proposta", dataHora: "2026-02-21T14:00:00", status: "Aberta", responsavel: "Victor" },
  { id: "task-3", leadId: "lead-6", descricao: "Ligar para TechSol", dataHora: "2026-02-20T10:00:00", status: "Atrasada", responsavel: "Davi" },
  { id: "task-4", leadId: "lead-7", descricao: "Agendar apresentação de estratégia", dataHora: "2026-02-22T10:00:00", status: "Aberta", responsavel: "Gabriel" },
  { id: "task-5", leadId: "lead-9", descricao: "Follow-up proposta Auto Center", dataHora: "2026-02-22T15:00:00", status: "Aberta", responsavel: "Davi" },
];

export const mockFiles: LeadFile[] = [
  { id: "file-1", leadId: "lead-3", nome: "COF_Andre_Souza.pdf", tipo: "PDF", data: "2026-02-15" },
  { id: "file-2", leadId: "lead-4", nome: "Contrato_Franquia_BH.pdf", tipo: "PDF", data: "2026-02-01" },
];

export const mockProposals: LeadProposal[] = [
  { id: "prop-1", leadId: "lead-3", valor: 200000, status: "enviada" },
  { id: "prop-2", leadId: "lead-9", valor: 8000, status: "enviada" },
];

// ---- Helpers ----

export function getLeadsByFunnel(funnel: FunnelType): Lead[] {
  return mockLeads.filter((l) => l.funnel === funnel);
}

export function getLeadsByStage(funnel: FunnelType, stage: string): Lead[] {
  return mockLeads.filter((l) => l.funnel === funnel && l.stage === stage);
}

export function getActivitiesForLead(leadId: string): Activity[] {
  return mockActivities.filter((a) => a.leadId === leadId);
}

export function getTasksForLead(leadId: string): Task[] {
  return mockTasks.filter((t) => t.leadId === leadId);
}

export function getFilesForLead(leadId: string): LeadFile[] {
  return mockFiles.filter((f) => f.leadId === leadId);
}

export function getProposalsForLead(leadId: string): LeadProposal[] {
  return mockProposals.filter((p) => p.leadId === leadId);
}

export function getStagesForFunnel(funnel: FunnelType): readonly string[] {
  return funnel === "franchise" ? FRANCHISE_STAGES : CLIENT_STAGES;
}

export interface CrmAlert {
  type: "no-contact" | "overdue-task" | "hot-stalled" | "conversion-rate";
  label: string;
  count: number;
  color: string;
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
