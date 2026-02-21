// ===== DADOS MOCK — CLIENTE FINAL (SaaS NOEXCUSE) =====

// ===== SaaS ACCESS SYSTEM =====

export interface Organization {
  id: string;
  name: string;
  cnpj: string;
  plan: string;
  status: "ativo" | "trial" | "suspenso" | "cancelado";
  createdAt: string;
  maxUsers: number;
  segmento: string;
  fusoHorario: string;
}

export interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  planName: string;
  status: "active" | "trial" | "expired" | "cancelled";
  startDate: string;
  renewalDate: string;
  trialEndsAt: string | null;
  price: number;
  creditsIncluded: number;
}

export interface Wallet {
  organizationId: string;
  currentBalance: number;
  totalIncluded: number;
  renewalDate: string;
}

export interface CreditTransaction {
  id: string;
  type: "consumo" | "recarga" | "compra_extra" | "bonus";
  amount: number;
  date: string;
  module: string;
  description: string;
}

export interface SaasPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  maxUsers: number;
  features: string[];
  popular: boolean;
}

export type UserRole = "admin" | "gestor_comercial" | "marketing" | "operador";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ativo" | "convidado" | "inativo";
  lastLogin: string;
}

export const mockOrganization: Organization = {
  id: "org-1",
  name: "Minha Empresa Ltda",
  cnpj: "12.345.678/0001-90",
  plan: "pro",
  status: "trial",
  createdAt: "2026-02-07",
  maxUsers: 5,
  segmento: "Serviços Digitais",
  fusoHorario: "America/Sao_Paulo",
};

export const mockSubscription: Subscription = {
  id: "sub-1",
  organizationId: "org-1",
  planId: "pro",
  planName: "Pro",
  status: "trial",
  startDate: "2026-02-07",
  renewalDate: "2026-03-07",
  trialEndsAt: "2026-03-03",
  price: 397,
  creditsIncluded: 2000,
};

export const mockWallet: Wallet = {
  organizationId: "org-1",
  currentBalance: 500,
  totalIncluded: 2000,
  renewalDate: "2026-03-07",
};

export const mockTransactions: CreditTransaction[] = [
  { id: "tx1", type: "recarga", amount: 2000, date: "2026-02-07", module: "Sistema", description: "Créditos do plano Pro — Fev/2026" },
  { id: "tx2", type: "consumo", amount: -350, date: "2026-02-10", module: "IA Comercial", description: "Geração de scripts e respostas automáticas" },
  { id: "tx3", type: "consumo", amount: -200, date: "2026-02-12", module: "IA Marketing", description: "Criação de 5 posts com IA" },
  { id: "tx4", type: "consumo", amount: -150, date: "2026-02-14", module: "Disparos", description: "Campanha WhatsApp — 150 mensagens" },
  { id: "tx5", type: "consumo", amount: -300, date: "2026-02-16", module: "Geração de Sites", description: "Landing page gerada por IA" },
  { id: "tx6", type: "compra_extra", amount: 500, date: "2026-02-17", module: "Sistema", description: "Compra de 500 créditos extras" },
  { id: "tx7", type: "consumo", amount: -250, date: "2026-02-18", module: "IA Comercial", description: "Qualificação automática de 12 leads" },
  { id: "tx8", type: "consumo", amount: -180, date: "2026-02-19", module: "IA Marketing", description: "Geração de carrossel + copy" },
  { id: "tx9", type: "bonus", amount: 100, date: "2026-02-20", module: "Sistema", description: "Bônus — indicação de cliente" },
  { id: "tx10", type: "consumo", amount: -170, date: "2026-02-21", module: "Disparos", description: "Follow-up automático — 85 mensagens" },
];

export const mockPlans: SaasPlan[] = [
  {
    id: "starter", name: "Starter", price: 197, credits: 1000, maxUsers: 2, popular: false,
    features: ["CRM completo", "Chat WhatsApp (1 número)", "Scripts de vendas", "Relatórios básicos", "1.000 créditos/mês"],
  },
  {
    id: "pro", name: "Pro", price: 397, credits: 2000, maxUsers: 5, popular: true,
    features: ["Tudo do Starter", "IA Comercial + Marketing", "Disparos em massa", "Geração de sites", "Campanhas avançadas", "2.000 créditos/mês", "5 usuários"],
  },
  {
    id: "enterprise", name: "Enterprise", price: 797, credits: 5000, maxUsers: 15, popular: false,
    features: ["Tudo do Pro", "API personalizada", "Gerente de conta dedicado", "Onboarding assistido", "Relatórios avançados", "5.000 créditos/mês", "15 usuários"],
  },
];

export const mockTeamMembers: TeamMember[] = [
  { id: "u1", name: "Você (Admin)", email: "admin@minhaempresa.com", role: "admin", status: "ativo", lastLogin: "2026-02-21 14:30" },
  { id: "u2", name: "Carlos Mendes", email: "carlos@minhaempresa.com", role: "gestor_comercial", status: "ativo", lastLogin: "2026-02-21 11:20" },
  { id: "u3", name: "Julia Santos", email: "julia@minhaempresa.com", role: "marketing", status: "convidado", lastLogin: "—" },
];

export const roleDescriptions: Record<UserRole, { label: string; description: string; color: string }> = {
  admin: { label: "Admin", description: "Acesso total, gerencia plano, compra créditos, conecta WhatsApp", color: "bg-primary text-primary-foreground" },
  gestor_comercial: { label: "Gestor Comercial", description: "CRM, Chat, Scripts, Relatórios", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  marketing: { label: "Marketing", description: "Conteúdos, Sites, Tráfego, Campanhas", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  operador: { label: "Operador", description: "Apenas CRM e Chat", color: "bg-muted text-muted-foreground" },
};

export function getTrialDaysRemaining(): number {
  if (!mockSubscription.trialEndsAt) return 0;
  const now = new Date("2026-02-21");
  const end = new Date(mockSubscription.trialEndsAt);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function getCreditConsumptionByModule() {
  return [
    { name: "IA Comercial", value: 600, fill: "hsl(355, 78%, 50%)" },
    { name: "IA Marketing", value: 380, fill: "hsl(262, 60%, 55%)" },
    { name: "Disparos", value: 320, fill: "hsl(200, 70%, 50%)" },
    { name: "Geração de Sites", value: 300, fill: "hsl(142, 71%, 40%)" },
  ];
}

export interface ClienteKpi {
  label: string;
  value: string;
  sublabel?: string;
  trend?: "up" | "down" | "neutral";
}

export interface ChecklistItem {
  id: string;
  title: string;
  type: "Comercial" | "Marketing" | "Gestão";
  origin: "auto" | "manual";
  done: boolean;
}

export interface ClienteNotificacao {
  id: string;
  type: "Leads" | "Chat" | "Campanhas" | "Metas";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export interface GamificacaoMedalha {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
}

export interface GamificacaoRanking {
  position: number;
  name: string;
  points: number;
  avatar: string;
}

// ===== CRM EXPANDIDO =====

export interface TimelineEntry {
  id: string;
  type: "message" | "stage_change" | "note" | "task" | "call";
  description: string;
  date: string;
  icon: string;
}

export interface LeadTask {
  id: string;
  title: string;
  status: "pendente" | "feita" | "atrasada";
  dueDate: string;
}

export interface LeadNote {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

export interface CrmLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  value: number;
  temperature: "Quente" | "Morno" | "Frio";
  stage: "novo" | "contato" | "proposta" | "fechado" | "perdido";
  responsible: string;
  notes: string;
  createdAt: string;
  // campos expandidos
  origin: string;
  tags: string[];
  diagnosticoDone: boolean;
  propostaEnviada: boolean;
  propostaAceita: boolean;
  lastInteraction: string;
  linkedConversationId: string | null;
  timeline: TimelineEntry[];
  tasks: LeadTask[];
  leadNotes: LeadNote[];
}

// ===== MARKETING 360 =====

export interface PlanoMarketingData {
  posicionamento: {
    publicoAlvo: string;
    persona: string;
    ticketMedio: number;
    diferenciais: string;
    concorrentes: string[];
    mercado: string;
  };
  objetivo: {
    tipo: "reconhecimento" | "leads" | "vendas" | "autoridade";
    metaLeads: number;
    metaVendas: number;
    roiEsperado: number;
  };
  canais: { name: string; active: boolean; icon: string; frequenciaSugerida: string }[];
  orcamento: {
    organico: number;
    pago: number;
    producao: number;
  };
  funil: {
    topo: { descricao: string; conteudo: string; metrica: string };
    meio: { descricao: string; conteudo: string; metrica: string };
    fundo: { descricao: string; conteudo: string; metrica: string };
  };
  planoAcao: {
    postsSemanais: number;
    cronograma: { dia: string; tipo: string }[];
    estrategiaTrafego: string;
    campanhasSugeridas: string[];
    landingPageSugerida: string;
  };
}

export interface CampanhaMarketing {
  id: string;
  name: string;
  objective: string;
  channel: string;
  audience: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: "Ativa" | "Pausada" | "Finalizada" | "Rascunho";
  leads: number;
  conversions: number;
  entregaveis: {
    conteudos: number;
    anuncios: number;
    landingPages: number;
    disparos: number;
  };
}

export interface ConteudoMarketing {
  id: string;
  title: string;
  network: string;
  format: "Feed" | "Story" | "Reels" | "Carrossel" | "Blog" | "Email";
  funnelStage: "Topo" | "Meio" | "Fundo";
  status: "Rascunho" | "Agendado" | "Publicado";
  date: string;
  description: string;
  copy?: string;
  cta?: string;
  hashtags?: string[];
  campaignId?: string;
}

// Legacy aliases
export type ClienteCampanha = CampanhaMarketing;
export type ClienteConteudo = ConteudoMarketing;

export interface ClienteScript {
  id: string;
  title: string;
  category: "Scripts de Vendas" | "Roteiros de Ligação" | "Modelos de Proposta" | "Estratégias";
  description: string;
  content: string;
  updatedAt: string;
}

export interface ClienteDisparo {
  id: string;
  type: "Email" | "Mensagem" | "Campanha Interna";
  subject: string;
  recipients: number;
  status: "Enviado" | "Agendado" | "Rascunho";
  sentAt: string;
  openRate?: number;
}

export interface ClienteSite {
  id: string;
  name: string;
  url: string;
  status: "Ativo" | "Inativo";
  leads: number;
  conversion: number;
}

// ===== DISPAROS WHATSAPP =====

export interface WhatsAppDisparo {
  id: string;
  type: "unica" | "campanha" | "followup";
  name: string;
  segment: string[];
  funnelStage: string | null;
  temperature: string | null;
  accountId: string;
  accountName: string;
  message: string;
  recipients: number;
  status: "enviado" | "agendado" | "rascunho" | "andamento";
  deliveryRate?: number;
  responseRate?: number;
  sentAt?: string;
  scheduledAt?: string;
}

export interface FollowUpRule {
  id: string;
  name: string;
  daysNoResponse: number;
  message: string;
  active: boolean;
  segment: string[];
}

// ===== GETTERS =====

export function getClienteDashboardKpis(): ClienteKpi[] {
  return [
    { label: "Receita Estimada", value: "R$ 47.500", sublabel: "+12% vs mês anterior", trend: "up" },
    { label: "Leads do Mês", value: "134", sublabel: "89 qualificados", trend: "up" },
    { label: "Taxa de Conversão", value: "18,5%", sublabel: "+2.3pp", trend: "up" },
    { label: "Meta vs Realizado", value: "72%", sublabel: "R$ 34.200 / R$ 47.500", trend: "neutral" },
  ];
}

export function getChecklistItems(): ChecklistItem[] {
  return [
    { id: "1", title: "Ligar para 5 leads quentes", type: "Comercial", origin: "auto", done: false },
    { id: "2", title: "Postar conteúdo no Instagram", type: "Marketing", origin: "auto", done: true },
    { id: "3", title: "Ajustar campanha Google Ads", type: "Marketing", origin: "auto", done: false },
    { id: "4", title: "Responder mensagens do chat", type: "Comercial", origin: "auto", done: true },
    { id: "5", title: "Revisar proposta cliente ABC", type: "Comercial", origin: "manual", done: false },
    { id: "6", title: "Atualizar CRM com novos leads", type: "Gestão", origin: "auto", done: false },
    { id: "7", title: "Agendar reunião com equipe", type: "Gestão", origin: "manual", done: true },
    { id: "8", title: "Criar copy para campanha semanal", type: "Marketing", origin: "auto", done: false },
  ];
}

export function getClienteNotificacoes(): ClienteNotificacao[] {
  return [
    { id: "1", type: "Leads", title: "Novo lead captado", description: "João Silva preencheu o formulário de contato", time: "Há 5 min", read: false },
    { id: "2", type: "Chat", title: "Nova mensagem", description: "Maria respondeu no chat interno", time: "Há 15 min", read: false },
    { id: "3", type: "Campanhas", title: "Campanha pausada", description: "Google Ads atingiu limite de orçamento", time: "Há 1h", read: false },
    { id: "4", type: "Metas", title: "Meta atingida!", description: "Você bateu 100% da meta de leads", time: "Há 2h", read: true },
    { id: "5", type: "Leads", title: "Lead qualificado", description: "Ana Costa foi marcada como quente", time: "Há 3h", read: true },
    { id: "6", type: "Chat", title: "Menção em grupo", description: "Carlos mencionou você no canal Vendas", time: "Há 4h", read: true },
    { id: "7", type: "Campanhas", title: "Campanha finalizada", description: "Campanha Black Friday encerrou com sucesso", time: "Ontem", read: true },
    { id: "8", type: "Metas", title: "Ranking atualizado", description: "Você subiu para 2º lugar no ranking", time: "Ontem", read: true },
  ];
}

export function getGamificacaoData() {
  return {
    points: 2450,
    level: 7,
    levelName: "Estrategista",
    nextLevel: 3000,
    medals: [
      { id: "1", name: "Primeiro Lead", emoji: "🎯", description: "Captou o primeiro lead", unlocked: true },
      { id: "2", name: "Vendedor Nato", emoji: "💰", description: "10 vendas fechadas", unlocked: true },
      { id: "3", name: "Maratonista", emoji: "🏃", description: "30 dias seguidos de checklist completo", unlocked: true },
      { id: "4", name: "Influencer", emoji: "📱", description: "50 posts publicados", unlocked: true },
      { id: "5", name: "Mestre do CRM", emoji: "📊", description: "100 leads gerenciados", unlocked: false },
      { id: "6", name: "Top Closer", emoji: "🏆", description: "R$ 100k em vendas", unlocked: false },
    ] as GamificacaoMedalha[],
    ranking: [
      { position: 1, name: "Carlos Mendes", points: 3200, avatar: "CM" },
      { position: 2, name: "Você", points: 2450, avatar: "VS" },
      { position: 3, name: "Ana Costa", points: 2100, avatar: "AC" },
      { position: 4, name: "Pedro Lima", points: 1800, avatar: "PL" },
      { position: 5, name: "Julia Santos", points: 1650, avatar: "JS" },
    ] as GamificacaoRanking[],
  };
}

export function getCrmLeads(): CrmLead[] {
  return [
    {
      id: "1", name: "João Silva", phone: "(11) 99999-1111", email: "joao@email.com", value: 5000, temperature: "Quente", stage: "novo", responsible: "Você", notes: "Indicação do Google", createdAt: "2026-02-20",
      origin: "Google Ads", tags: ["Lead Quente", "Decisor"], diagnosticoDone: false, propostaEnviada: false, propostaAceita: false,
      lastInteraction: "2026-02-21 14:25", linkedConversationId: "c1",
      timeline: [
        { id: "t1", type: "message", description: "Lead entrou via Google Ads", date: "2026-02-20 10:00", icon: "search" },
        { id: "t2", type: "message", description: "IA SDR iniciou atendimento no WhatsApp", date: "2026-02-20 10:01", icon: "bot" },
        { id: "t3", type: "stage_change", description: "Movido para Novo Lead", date: "2026-02-20 10:05", icon: "arrow-right" },
        { id: "t4", type: "message", description: "João respondeu no WhatsApp: 'Quero saber sobre o plano empresarial'", date: "2026-02-21 14:25", icon: "message-circle" },
      ],
      tasks: [
        { id: "tk1", title: "Ligar para qualificar", status: "pendente", dueDate: "2026-02-22" },
        { id: "tk2", title: "Enviar material institucional", status: "feita", dueDate: "2026-02-20" },
      ],
      leadNotes: [
        { id: "n1", text: "Lead veio do Google Ads, campanha 'Produto X'. Demonstrou interesse no plano empresarial.", createdAt: "2026-02-20 10:05", author: "Sistema" },
      ],
    },
    {
      id: "2", name: "Maria Oliveira", phone: "(11) 99999-2222", email: "maria@email.com", value: 12000, temperature: "Quente", stage: "contato", responsible: "Você", notes: "Retornar ligação", createdAt: "2026-02-18",
      origin: "Instagram", tags: ["Lead Quente", "Orçamento Alto"], diagnosticoDone: true, propostaEnviada: false, propostaAceita: false,
      lastInteraction: "2026-02-21 13:50", linkedConversationId: "c2",
      timeline: [
        { id: "t1", type: "message", description: "Lead captada via Instagram DM", date: "2026-02-18 09:00", icon: "instagram" },
        { id: "t2", type: "stage_change", description: "Movida para Contato", date: "2026-02-18 14:00", icon: "arrow-right" },
        { id: "t3", type: "call", description: "Ligação de qualificação realizada — 8 min", date: "2026-02-19 10:30", icon: "phone" },
        { id: "t4", type: "note", description: "Diagnóstico realizado: empresa de médio porte, 15 funcionários", date: "2026-02-19 11:00", icon: "clipboard" },
        { id: "t5", type: "message", description: "Maria enviou mensagem no WhatsApp", date: "2026-02-21 13:40", icon: "message-circle" },
      ],
      tasks: [
        { id: "tk1", title: "Enviar proposta comercial", status: "pendente", dueDate: "2026-02-22" },
        { id: "tk2", title: "Agendar demo do produto", status: "atrasada", dueDate: "2026-02-19" },
      ],
      leadNotes: [
        { id: "n1", text: "Empresa de serviços digitais, 15 funcionários. Busca CRM + automação.", createdAt: "2026-02-19 11:00", author: "Você" },
        { id: "n2", text: "Pediu para retornar ligação após reunião interna.", createdAt: "2026-02-20 16:00", author: "Você" },
      ],
    },
    {
      id: "3", name: "Carlos Mendes", phone: "(11) 99999-3333", email: "carlos@email.com", value: 8000, temperature: "Morno", stage: "proposta", responsible: "Ana", notes: "Aguardando aprovação", createdAt: "2026-02-15",
      origin: "WhatsApp", tags: ["Decisor"], diagnosticoDone: true, propostaEnviada: true, propostaAceita: false,
      lastInteraction: "2026-02-21 12:35", linkedConversationId: "c3",
      timeline: [
        { id: "t1", type: "message", description: "Lead entrou via WhatsApp direto", date: "2026-02-15 08:30", icon: "message-circle" },
        { id: "t2", type: "stage_change", description: "Movido para Contato", date: "2026-02-16 09:00", icon: "arrow-right" },
        { id: "t3", type: "call", description: "Ligação de diagnóstico — 12 min", date: "2026-02-17 14:00", icon: "phone" },
        { id: "t4", type: "stage_change", description: "Movido para Proposta", date: "2026-02-18 10:00", icon: "arrow-right" },
        { id: "t5", type: "task", description: "Proposta enviada por e-mail", date: "2026-02-18 11:00", icon: "file-text" },
      ],
      tasks: [
        { id: "tk1", title: "Follow-up sobre proposta", status: "pendente", dueDate: "2026-02-23" },
      ],
      leadNotes: [
        { id: "n1", text: "Pediu proposta customizada para 3 unidades.", createdAt: "2026-02-17 15:00", author: "Ana" },
      ],
    },
    {
      id: "4", name: "Ana Costa", phone: "(11) 99999-4444", email: "ana@email.com", value: 15000, temperature: "Quente", stage: "fechado", responsible: "Você", notes: "Contrato assinado", createdAt: "2026-02-10",
      origin: "Indicação", tags: ["Cliente", "Orçamento Alto"], diagnosticoDone: true, propostaEnviada: true, propostaAceita: true,
      lastInteraction: "2026-02-21 11:35", linkedConversationId: "c4",
      timeline: [
        { id: "t1", type: "message", description: "Lead indicada por cliente existente", date: "2026-02-10 09:00", icon: "users" },
        { id: "t2", type: "stage_change", description: "Movida para Fechado ✅", date: "2026-02-20 11:30", icon: "check-circle" },
      ],
      tasks: [],
      leadNotes: [
        { id: "n1", text: "Contrato assinado. Onboarding agendado para 25/02.", createdAt: "2026-02-20 12:00", author: "Você" },
      ],
    },
    {
      id: "5", name: "Pedro Lima", phone: "(11) 99999-5555", email: "pedro@email.com", value: 3000, temperature: "Frio", stage: "perdido", responsible: "Carlos", notes: "Sem orçamento", createdAt: "2026-02-08",
      origin: "Site", tags: [], diagnosticoDone: false, propostaEnviada: false, propostaAceita: false,
      lastInteraction: "2026-02-12 09:00", linkedConversationId: null,
      timeline: [
        { id: "t1", type: "message", description: "Lead captado via formulário do site", date: "2026-02-08 14:00", icon: "globe" },
        { id: "t2", type: "stage_change", description: "Movido para Perdido", date: "2026-02-12 09:00", icon: "x-circle" },
      ],
      tasks: [],
      leadNotes: [
        { id: "n1", text: "Sem orçamento no momento. Recontatar em 3 meses.", createdAt: "2026-02-12 09:00", author: "Carlos" },
      ],
    },
    {
      id: "6", name: "Fernanda Souza", phone: "(11) 99999-6666", email: "fernanda@email.com", value: 7500, temperature: "Morno", stage: "novo", responsible: "Você", notes: "Veio do Instagram", createdAt: "2026-02-21",
      origin: "Instagram", tags: ["Lead"], diagnosticoDone: false, propostaEnviada: false, propostaAceita: false,
      lastInteraction: "2026-02-21 08:00", linkedConversationId: null,
      timeline: [
        { id: "t1", type: "message", description: "Lead captada via Instagram", date: "2026-02-21 08:00", icon: "instagram" },
      ],
      tasks: [
        { id: "tk1", title: "Primeiro contato", status: "pendente", dueDate: "2026-02-22" },
      ],
      leadNotes: [],
    },
    {
      id: "7", name: "Ricardo Alves", phone: "(11) 99999-7777", email: "ricardo@email.com", value: 20000, temperature: "Quente", stage: "contato", responsible: "Ana", notes: "Grande potencial", createdAt: "2026-02-19",
      origin: "Instagram", tags: ["Lead Quente", "Decisor", "Orçamento Alto"], diagnosticoDone: false, propostaEnviada: false, propostaAceita: false,
      lastInteraction: "2026-02-21 11:05", linkedConversationId: "c7",
      timeline: [
        { id: "t1", type: "message", description: "Lead entrou via Instagram", date: "2026-02-19 11:00", icon: "instagram" },
        { id: "t2", type: "stage_change", description: "Movido para Contato", date: "2026-02-19 15:00", icon: "arrow-right" },
        { id: "t3", type: "message", description: "Ricardo perguntou sobre demo no WhatsApp", date: "2026-02-21 11:05", icon: "message-circle" },
      ],
      tasks: [
        { id: "tk1", title: "Agendar demonstração", status: "pendente", dueDate: "2026-02-22" },
      ],
      leadNotes: [
        { id: "n1", text: "Grande potencial. Empresa com 50+ funcionários.", createdAt: "2026-02-19 15:00", author: "Ana" },
      ],
    },
    {
      id: "8", name: "Patrícia Nunes", phone: "(11) 99999-8888", email: "patricia@email.com", value: 6000, temperature: "Frio", stage: "proposta", responsible: "Você", notes: "Comparando concorrentes", createdAt: "2026-02-14",
      origin: "Google Ads", tags: [], diagnosticoDone: true, propostaEnviada: true, propostaAceita: false,
      lastInteraction: "2026-02-20 16:00", linkedConversationId: null,
      timeline: [
        { id: "t1", type: "message", description: "Lead via Google Ads", date: "2026-02-14 10:00", icon: "search" },
        { id: "t2", type: "stage_change", description: "Movida para Proposta", date: "2026-02-18 09:00", icon: "arrow-right" },
        { id: "t3", type: "task", description: "Proposta enviada", date: "2026-02-18 09:30", icon: "file-text" },
      ],
      tasks: [
        { id: "tk1", title: "Follow-up proposta", status: "atrasada", dueDate: "2026-02-20" },
      ],
      leadNotes: [
        { id: "n1", text: "Está comparando com 2 concorrentes. Preço é fator decisivo.", createdAt: "2026-02-18 10:00", author: "Você" },
      ],
    },
  ];
}

export function getClienteCampanhas(): CampanhaMarketing[] {
  return [
    { id: "1", name: "Lançamento Produto X", objective: "Gerar Leads", channel: "Multi-canal", audience: "Empresas de tecnologia 10-50 func.", startDate: "2026-02-01", endDate: "2026-02-28", budget: 5000, spent: 3200, status: "Ativa", leads: 45, conversions: 8, entregaveis: { conteudos: 6, anuncios: 3, landingPages: 1, disparos: 2 } },
    { id: "2", name: "Remarketing Site", objective: "Vendas", channel: "Google", audience: "Visitantes do site últimos 30 dias", startDate: "2026-02-05", endDate: "2026-03-05", budget: 2000, spent: 1100, status: "Ativa", leads: 22, conversions: 5, entregaveis: { conteudos: 2, anuncios: 4, landingPages: 1, disparos: 0 } },
    { id: "3", name: "Black Friday", objective: "Vendas", channel: "Multi-canal", audience: "Base de clientes + lookalike", startDate: "2025-11-20", endDate: "2025-11-30", budget: 8000, spent: 7800, status: "Finalizada", leads: 120, conversions: 32, entregaveis: { conteudos: 12, anuncios: 8, landingPages: 2, disparos: 5 } },
    { id: "4", name: "Institucional Q1", objective: "Brand Awareness", channel: "Instagram", audience: "Público geral 25-45 anos", startDate: "2026-01-15", endDate: "2026-03-15", budget: 3000, spent: 900, status: "Pausada", leads: 12, conversions: 1, entregaveis: { conteudos: 4, anuncios: 1, landingPages: 0, disparos: 1 } },
  ];
}

export function getClienteConteudos(): ConteudoMarketing[] {
  return [
    { id: "1", title: "5 Dicas de produtividade para PMEs", network: "Instagram", format: "Carrossel", funnelStage: "Topo", status: "Publicado", date: "2026-02-17", description: "Carrossel com dicas práticas de produtividade", copy: "Sua equipe poderia render 2x mais com essas 5 mudanças simples 👇", cta: "Salve para aplicar hoje!", hashtags: ["#produtividade", "#gestão", "#pme"], campaignId: "1" },
    { id: "2", title: "Bastidores: nosso processo de onboarding", network: "Instagram", format: "Story", funnelStage: "Meio", status: "Publicado", date: "2026-02-18", description: "Mostrar como funciona o onboarding", campaignId: "1" },
    { id: "3", title: "Case: como a empresa X triplicou vendas", network: "LinkedIn", format: "Feed", funnelStage: "Fundo", status: "Publicado", date: "2026-02-19", description: "Case de sucesso com dados reais", copy: "A empresa X estava faturando R$ 30k/mês. Em 6 meses, chegou a R$ 95k. Como? 🧵", cta: "Agende uma consultoria gratuita", hashtags: ["#casesucesso", "#vendas", "#crescimento"] },
    { id: "4", title: "Tutorial: configurando seu CRM", network: "Instagram", format: "Reels", funnelStage: "Meio", status: "Agendado", date: "2026-02-22", description: "Video tutorial passo a passo", campaignId: "1" },
    { id: "5", title: "Promoção relâmpago de fevereiro", network: "Facebook", format: "Feed", funnelStage: "Fundo", status: "Publicado", date: "2026-02-19", description: "Post de oferta com urgência", copy: "🔥 Só até sexta! Plano anual com 30% OFF.", cta: "Garanta agora!", hashtags: ["#promoção", "#desconto"] },
    { id: "6", title: "Tendências de marketing 2026", network: "LinkedIn", format: "Carrossel", funnelStage: "Topo", status: "Rascunho", date: "2026-02-25", description: "As 7 tendências que vão dominar o marketing digital" },
    { id: "7", title: "Depoimento cliente Maria", network: "Instagram", format: "Reels", funnelStage: "Fundo", status: "Agendado", date: "2026-02-24", description: "Video depoimento de cliente satisfeita", campaignId: "1" },
    { id: "8", title: "Checklist: sua empresa está pronta?", network: "Instagram", format: "Carrossel", funnelStage: "Topo", status: "Agendado", date: "2026-02-26", description: "Checklist interativo para diagnóstico" },
    { id: "9", title: "Por que investir em CRM?", network: "Facebook", format: "Feed", funnelStage: "Meio", status: "Rascunho", date: "2026-02-27", description: "Post educativo sobre CRM" },
    { id: "10", title: "Newsletter semanal", network: "LinkedIn", format: "Email", funnelStage: "Meio", status: "Agendado", date: "2026-02-21", description: "Email com novidades e conteúdos" },
  ];
}

export function getPlanoMarketing360(): PlanoMarketingData {
  return {
    posicionamento: {
      publicoAlvo: "Empresas de pequeno e médio porte (10 a 100 funcionários) que buscam automatizar processos comerciais e de marketing.",
      persona: "Carlos, 38 anos, dono de agência digital. Dor: perde leads por falta de processo. Desejo: ter um sistema que organize vendas e marketing em um só lugar.",
      ticketMedio: 4500,
      diferenciais: "Plataforma 360° que integra CRM, marketing, WhatsApp e IA em um único sistema. Suporte humanizado e onboarding guiado.",
      concorrentes: ["RD Station", "Pipedrive", "HubSpot"],
      mercado: "SaaS B2B — Gestão Comercial e Marketing Digital",
    },
    objetivo: {
      tipo: "leads",
      metaLeads: 150,
      metaVendas: 25,
      roiEsperado: 300,
    },
    canais: [
      { name: "Instagram", active: true, icon: "instagram", frequenciaSugerida: "Diário" },
      { name: "Facebook", active: true, icon: "facebook", frequenciaSugerida: "3x/semana" },
      { name: "Google", active: true, icon: "search", frequenciaSugerida: "Contínuo" },
      { name: "YouTube", active: false, icon: "youtube", frequenciaSugerida: "1x/semana" },
      { name: "TikTok", active: false, icon: "music", frequenciaSugerida: "3x/semana" },
      { name: "WhatsApp", active: true, icon: "message-circle", frequenciaSugerida: "Diário" },
      { name: "Site", active: true, icon: "globe", frequenciaSugerida: "Contínuo" },
    ],
    orcamento: {
      organico: 3000,
      pago: 7000,
      producao: 2000,
    },
    funil: {
      topo: { descricao: "Atrair atenção e gerar interesse", conteudo: "Posts educativos, Reels virais, Blog SEO", metrica: "Alcance e Impressões" },
      meio: { descricao: "Nutrir e qualificar leads", conteudo: "Cases, Webinars, Email marketing, Carrosséis", metrica: "Engajamento e Leads" },
      fundo: { descricao: "Converter em vendas", conteudo: "Depoimentos, Ofertas, Landing Pages, Demos", metrica: "Conversão e Receita" },
    },
    planoAcao: {
      postsSemanais: 5,
      cronograma: [
        { dia: "Segunda", tipo: "Autoridade" },
        { dia: "Terça", tipo: "Educativo" },
        { dia: "Quarta", tipo: "Prova Social" },
        { dia: "Quinta", tipo: "Bastidores" },
        { dia: "Sexta", tipo: "Oferta/CTA" },
      ],
      estrategiaTrafego: "Google Search para captação de leads qualificados + Meta Ads para remarketing e lookalike. Budget 60% Google / 40% Meta.",
      campanhasSugeridas: ["Campanha de Leads — Google Search", "Remarketing — Meta Ads", "Lançamento Trimestral — Multi-canal", "Conteúdo Orgânico — Instagram/LinkedIn"],
      landingPageSugerida: "Landing page com Hero + 3 benefícios + prova social + formulário + FAQ. Integrada ao CRM para captura automática de leads.",
    },
  };
}

export function getClienteScripts(): ClienteScript[] {
  return [
    { id: "1", title: "Abordagem inicial por telefone", category: "Scripts de Vendas", description: "Script para primeiro contato telefônico", content: "Olá [Nome], aqui é o [Seu Nome] da [Empresa]. Vi que você demonstrou interesse em...", updatedAt: "2026-02-18" },
    { id: "2", title: "Roteiro de qualificação", category: "Roteiros de Ligação", description: "Perguntas-chave para qualificar o lead", content: "1. Qual o principal desafio que você enfrenta hoje?\n2. Qual o orçamento disponível?\n3. Quem é o decisor?", updatedAt: "2026-02-15" },
    { id: "3", title: "Proposta comercial padrão", category: "Modelos de Proposta", description: "Template de proposta para serviços", content: "PROPOSTA COMERCIAL\n\nEmpresa: [Nome]\nData: [Data]\n\nObjetivo: ...\nInvestimento: ...\nPrazo: ...", updatedAt: "2026-02-10" },
    { id: "4", title: "Estratégia de follow-up", category: "Estratégias", description: "Sequência de 7 toques para conversão", content: "Dia 1: Primeiro contato\nDia 3: E-mail de valor\nDia 5: Ligação de acompanhamento\nDia 7: Conteúdo relevante...", updatedAt: "2026-02-12" },
  ];
}

export function getClienteDisparos(): ClienteDisparo[] {
  return [
    { id: "1", type: "Email", subject: "Oferta especial de fevereiro", recipients: 250, status: "Enviado", sentAt: "2026-02-18", openRate: 32.5 },
    { id: "2", type: "Mensagem", subject: "Lembrete de reunião", recipients: 15, status: "Enviado", sentAt: "2026-02-20", openRate: 85 },
    { id: "3", type: "Email", subject: "Newsletter semanal", recipients: 480, status: "Agendado", sentAt: "2026-02-23" },
    { id: "4", type: "Campanha Interna", subject: "Atualização de preços", recipients: 8, status: "Rascunho", sentAt: "" },
  ];
}

// ===== DISPAROS WHATSAPP =====

export function getWhatsAppDisparos(): WhatsAppDisparo[] {
  return [
    {
      id: "wd1", type: "campanha", name: "Promoção Fevereiro", segment: ["Lead Quente", "Decisor"], funnelStage: "contato", temperature: "Quente",
      accountId: "wa1", accountName: "WA Comercial", message: "🔥 Oferta exclusiva! Contrate nosso plano empresarial até sexta e ganhe 20% de desconto. Responda SIM para saber mais!",
      recipients: 45, status: "enviado", deliveryRate: 96, responseRate: 34, sentAt: "2026-02-20 10:00",
    },
    {
      id: "wd2", type: "unica", name: "Follow-up Propostas Pendentes", segment: ["Decisor"], funnelStage: "proposta", temperature: null,
      accountId: "wa1", accountName: "WA Comercial", message: "Olá! Vi que sua proposta está em análise. Tem alguma dúvida que posso esclarecer? Estou à disposição 😊",
      recipients: 12, status: "enviado", deliveryRate: 100, responseRate: 58, sentAt: "2026-02-19 14:00",
    },
    {
      id: "wd3", type: "campanha", name: "Lançamento Produto X", segment: ["Lead", "Lead Quente"], funnelStage: null, temperature: null,
      accountId: "wa1", accountName: "WA Comercial", message: "🚀 Novidade! Acabamos de lançar o Produto X. Quer conhecer? Responda DEMO para agendar uma apresentação gratuita.",
      recipients: 120, status: "agendado", scheduledAt: "2026-02-23 09:00",
    },
    {
      id: "wd4", type: "followup", name: "Reativação Leads Frios", segment: [], funnelStage: "perdido", temperature: "Frio",
      accountId: "wa1", accountName: "WA Comercial", message: "Olá! Faz um tempo que não conversamos. Temos novidades que podem te interessar. Posso te contar?",
      recipients: 28, status: "rascunho",
    },
    {
      id: "wd5", type: "followup", name: "NPS Pós-venda", segment: ["Cliente"], funnelStage: "fechado", temperature: null,
      accountId: "wa2", accountName: "WA Suporte", message: "Olá! De 0 a 10, o quanto você recomendaria nossos serviços? Sua opinião é muito importante para nós! 🙏",
      recipients: 35, status: "andamento", deliveryRate: 91, responseRate: 42, sentAt: "2026-02-21 08:00",
    },
  ];
}

export function getFollowUpRules(): FollowUpRule[] {
  return [
    { id: "fr1", name: "Lead sem resposta 3 dias", daysNoResponse: 3, message: "Olá! Notei que não conseguimos conversar. Posso te ajudar com alguma dúvida?", active: true, segment: ["Lead", "Lead Quente"] },
    { id: "fr2", name: "Proposta sem retorno 5 dias", daysNoResponse: 5, message: "Sua proposta ainda está disponível! Tem alguma dúvida que posso esclarecer?", active: true, segment: ["Decisor"] },
    { id: "fr3", name: "Cliente inativo 30 dias", daysNoResponse: 30, message: "Faz tempo! Como estão as coisas por aí? Temos novidades que podem te interessar 😊", active: false, segment: ["Cliente", "Pós-venda"] },
  ];
}

export function getDisparosKpis() {
  return [
    { label: "Enviadas Hoje", value: "328", trend: "up" as const },
    { label: "Taxa de Entrega", value: "96,2%", trend: "up" as const },
    { label: "Taxa de Resposta", value: "34,8%", trend: "up" as const },
    { label: "Campanhas Ativas", value: "3", trend: "neutral" as const },
  ];
}

export function getClienteSites(): ClienteSite[] {
  return [
    { id: "1", name: "Landing Page Principal", url: "empresa.com/lp", status: "Ativo", leads: 89, conversion: 4.2 },
    { id: "2", name: "Página de Captura Ebook", url: "empresa.com/ebook", status: "Ativo", leads: 45, conversion: 12.8 },
    { id: "3", name: "LP Black Friday", url: "empresa.com/bf", status: "Inativo", leads: 230, conversion: 8.5 },
  ];
}

export function getPlanoVendasDefaults() {
  return {
    periodo: "mensal" as const,
    receitaAtual: 47500,
    receitaDesejada: 65000,
    mercado: "Serviços digitais",
    tipoVenda: "B2B" as const,
    metaFaturamento: 65000,
    ticketMedio: 4500,
    conversaoVenda: 20,
    conversaoProposta: 30,
    vendedores: 3,
    canais: ["Google Ads", "Instagram", "Indicação"] as string[],
    ferramentas: ["CRM", "WhatsApp", "Email"] as string[],
    tempoFechamento: 15,
    processoEstruturado: true,
    concorrentes: ["Concorrente A", "Concorrente B", ""] as string[],
    diferenciais: "Atendimento personalizado e resultados comprovados",
    posicionamento: "Na média",
    saturacao: 5,
    respostasDiagnostico: [4, 3, 3, 2, 4] as number[],
    vendasRealizadas: 34200,
    leadsAtivos: 134,
  };
}

export function getPlanoVendasData() {
  const d = getPlanoVendasDefaults();
  return {
    metaMensal: d.metaFaturamento,
    ticketMedio: d.ticketMedio,
    taxaConversao: d.conversaoVenda,
    leadsNecessarios: 78,
    vendasRealizadas: d.vendasRealizadas,
    leadsAtivos: d.leadsAtivos,
  };
}

export function getPlanoMarketingData() {
  return {
    objetivo: "Aumentar leads qualificados em 25%",
    orcamento: 12000,
    gasto: 7200,
    canais: [
      { name: "Instagram", active: true, frequency: "Diário" },
      { name: "Facebook", active: true, frequency: "3x/semana" },
      { name: "LinkedIn", active: true, frequency: "2x/semana" },
      { name: "Google Ads", active: true, frequency: "Contínuo" },
      { name: "TikTok", active: false, frequency: "—" },
      { name: "E-mail Marketing", active: true, frequency: "Semanal" },
    ],
  };
}

export function getTrafegoPagoData() {
  return {
    kpis: [
      { label: "Investimento", value: "R$ 7.200", trend: "up" as const },
      { label: "CPC Médio", value: "R$ 2,45", trend: "down" as const },
      { label: "CPL", value: "R$ 18,90", trend: "down" as const },
      { label: "Leads Gerados", value: "380", trend: "up" as const },
      { label: "Conversão", value: "4,8%", trend: "up" as const },
    ],
    campanhas: [
      { name: "Google Search — Produto X", platform: "Google", investment: 2500, leads: 120, cpl: 20.83 },
      { name: "Meta — Remarketing", platform: "Meta", investment: 1800, leads: 95, cpl: 18.95 },
      { name: "Google Display", platform: "Google", investment: 1500, leads: 85, cpl: 17.65 },
      { name: "Meta — Lookalike", platform: "Meta", investment: 1400, leads: 80, cpl: 17.50 },
    ],
  };
}

export function getRelatorioDashboardData() {
  return {
    vendasPorPeriodo: [
      { period: "Sem 1", vendas: 8500, leads: 32 },
      { period: "Sem 2", vendas: 9200, leads: 38 },
      { period: "Sem 3", vendas: 7800, leads: 29 },
      { period: "Sem 4", vendas: 8700, leads: 35 },
    ],
    conversaoPorCanal: [
      { canal: "Google Ads", taxa: 22 },
      { canal: "Instagram", taxa: 15 },
      { canal: "Indicação", taxa: 35 },
      { canal: "Site", taxa: 12 },
      { canal: "LinkedIn", taxa: 8 },
    ],
    receitaAcumulada: [
      { mes: "Set", receita: 38000 },
      { mes: "Out", receita: 42000 },
      { mes: "Nov", receita: 55000 },
      { mes: "Dez", receita: 48000 },
      { mes: "Jan", receita: 44000 },
      { mes: "Fev", receita: 34200 },
    ],
  };
}

// ===== CHAT HUB — WhatsApp =====

export interface WhatsAppAccount {
  id: string;
  name: string;
  phone: string;
  status: "connected" | "disconnected";
  agentType: "SDR" | "Closer" | "Suporte" | "Pós-venda" | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  sender: "contact" | "user" | "ia" | "system";
  senderName: string;
  text: string;
  time: string;
  avatar?: string;
}

export interface ChatConversation {
  id: string;
  accountId: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  attendanceStatus: "ia" | "humano" | "encerrado" | "espera";
  attendant?: string;
  tag: "Lead" | "Cliente" | "Pós-venda";
  crmLinked: boolean;
  crmStage?: string;
  crmResponsible?: string;
  messages: ChatMessage[];
}

export function getChatAccounts(): WhatsAppAccount[] {
  return [
    { id: "wa1", name: "WA Comercial", phone: "(11) 99900-0001", status: "connected", agentType: "SDR", unreadCount: 5 },
    { id: "wa2", name: "WA Suporte", phone: "(11) 99900-0002", status: "connected", agentType: "Suporte", unreadCount: 2 },
    { id: "wa3", name: "WA Pessoal", phone: "(11) 99900-0003", status: "disconnected", agentType: null, unreadCount: 0 },
  ];
}

export function getChatConversations(): ChatConversation[] {
  return [
    {
      id: "c1", accountId: "wa1", contactName: "João Silva", contactPhone: "(11) 99999-1111", contactEmail: "joao@email.com",
      avatar: "JS", lastMessage: "Olá, quero saber sobre o plano empresarial", lastMessageTime: "10m",
      unread: 2, attendanceStatus: "ia", tag: "Lead", crmLinked: true, crmStage: "Proposta", crmResponsible: "Você",
      messages: [
        { id: "m1", sender: "contact", senderName: "João Silva", text: "Oi, boa tarde!", time: "14:20", avatar: "JS" },
        { id: "m2", sender: "ia", senderName: "IA (SDR)", text: "Olá João! Bem-vindo 🤖 Como posso te ajudar hoje?", time: "14:20" },
        { id: "m3", sender: "contact", senderName: "João Silva", text: "Quero saber sobre o plano empresarial, valores e o que inclui", time: "14:22", avatar: "JS" },
        { id: "m4", sender: "ia", senderName: "IA (SDR)", text: "Claro! Nosso plano empresarial inclui CRM completo, automação de marketing e suporte dedicado. Posso agendar uma demonstração para você?", time: "14:22" },
        { id: "m5", sender: "contact", senderName: "João Silva", text: "Olá, quero saber sobre o plano empresarial", time: "14:25", avatar: "JS" },
      ],
    },
    {
      id: "c2", accountId: "wa1", contactName: "Maria Oliveira", contactPhone: "(11) 99999-2222", contactEmail: "maria@email.com",
      avatar: "MO", lastMessage: "Obrigada pelo retorno!", lastMessageTime: "25m",
      unread: 0, attendanceStatus: "humano", attendant: "Você", tag: "Cliente", crmLinked: true, crmStage: "Fechado", crmResponsible: "Você",
      messages: [
        { id: "m1", sender: "contact", senderName: "Maria Oliveira", text: "Preciso de ajuda com a integração", time: "13:40", avatar: "MO" },
        { id: "m2", sender: "system", senderName: "Sistema", text: "Conversa assumida por Você", time: "13:42" },
        { id: "m3", sender: "user", senderName: "Você", text: "Oi Maria! Claro, vou te ajudar. Qual integração está com problema?", time: "13:43" },
        { id: "m4", sender: "contact", senderName: "Maria Oliveira", text: "É a integração com o Google Ads, não está sincronizando", time: "13:45", avatar: "MO" },
        { id: "m5", sender: "user", senderName: "Você", text: "Entendi, vou verificar agora. Pode me enviar o ID da conta?", time: "13:46" },
        { id: "m6", sender: "contact", senderName: "Maria Oliveira", text: "Obrigada pelo retorno!", time: "13:50", avatar: "MO" },
      ],
    },
    {
      id: "c3", accountId: "wa1", contactName: "Carlos Mendes", contactPhone: "(11) 99999-3333",
      avatar: "CM", lastMessage: "Preciso de ajuda com proposta", lastMessageTime: "1h",
      unread: 1, attendanceStatus: "espera", tag: "Lead", crmLinked: false,
      messages: [
        { id: "m1", sender: "contact", senderName: "Carlos Mendes", text: "Bom dia, vocês fazem proposta customizada?", time: "12:30", avatar: "CM" },
        { id: "m2", sender: "ia", senderName: "IA (SDR)", text: "Bom dia Carlos! Sim, fazemos propostas 100% personalizadas. Vou transferir para um especialista.", time: "12:30" },
        { id: "m3", sender: "system", senderName: "Sistema", text: "IA transferiu para fila de espera", time: "12:31" },
        { id: "m4", sender: "contact", senderName: "Carlos Mendes", text: "Preciso de ajuda com proposta", time: "12:35", avatar: "CM" },
      ],
    },
    {
      id: "c4", accountId: "wa1", contactName: "Ana Costa", contactPhone: "(11) 99999-4444", contactEmail: "ana@email.com",
      avatar: "AC", lastMessage: "Contrato assinado! ✅", lastMessageTime: "2h",
      unread: 0, attendanceStatus: "encerrado", attendant: "Você", tag: "Cliente", crmLinked: true, crmStage: "Fechado", crmResponsible: "Você",
      messages: [
        { id: "m1", sender: "user", senderName: "Você", text: "Ana, segue o contrato para assinatura", time: "10:00" },
        { id: "m2", sender: "contact", senderName: "Ana Costa", text: "Recebi! Vou revisar e assinar hoje", time: "10:15", avatar: "AC" },
        { id: "m3", sender: "contact", senderName: "Ana Costa", text: "Contrato assinado! ✅", time: "11:30", avatar: "AC" },
        { id: "m4", sender: "system", senderName: "Sistema", text: "Conversa encerrada por Você", time: "11:35" },
      ],
    },
    {
      id: "c5", accountId: "wa2", contactName: "Pedro Lima", contactPhone: "(11) 99999-5555",
      avatar: "PL", lastMessage: "O sistema está lento hoje", lastMessageTime: "15m",
      unread: 3, attendanceStatus: "ia", tag: "Cliente", crmLinked: true, crmStage: "Fechado", crmResponsible: "Carlos",
      messages: [
        { id: "m1", sender: "contact", senderName: "Pedro Lima", text: "Olá, estou com problema no acesso", time: "14:00", avatar: "PL" },
        { id: "m2", sender: "ia", senderName: "IA (Suporte)", text: "Olá Pedro! Vou verificar seu acesso. Pode me informar seu e-mail cadastrado?", time: "14:00" },
        { id: "m3", sender: "contact", senderName: "Pedro Lima", text: "pedro@email.com", time: "14:02", avatar: "PL" },
        { id: "m4", sender: "ia", senderName: "IA (Suporte)", text: "Encontrei sua conta. Parece que houve uma atualização recente. Tente limpar o cache do navegador.", time: "14:03" },
        { id: "m5", sender: "contact", senderName: "Pedro Lima", text: "O sistema está lento hoje", time: "14:10", avatar: "PL" },
      ],
    },
    {
      id: "c6", accountId: "wa2", contactName: "Fernanda Souza", contactPhone: "(11) 99999-6666", contactEmail: "fernanda@email.com",
      avatar: "FS", lastMessage: "Resolvido, obrigada!", lastMessageTime: "45m",
      unread: 0, attendanceStatus: "encerrado", attendant: "Ana", tag: "Cliente", crmLinked: true, crmStage: "Fechado", crmResponsible: "Ana",
      messages: [
        { id: "m1", sender: "contact", senderName: "Fernanda Souza", text: "Oi, não consigo emitir a nota fiscal", time: "13:00", avatar: "FS" },
        { id: "m2", sender: "ia", senderName: "IA (Suporte)", text: "Olá Fernanda! Vou transferir para um atendente especializado.", time: "13:00" },
        { id: "m3", sender: "system", senderName: "Sistema", text: "Conversa assumida por Ana", time: "13:05" },
        { id: "m4", sender: "user", senderName: "Ana", text: "Oi Fernanda, já corrigi o problema. Tente novamente.", time: "13:10" },
        { id: "m5", sender: "contact", senderName: "Fernanda Souza", text: "Resolvido, obrigada!", time: "13:15", avatar: "FS" },
        { id: "m6", sender: "system", senderName: "Sistema", text: "Conversa encerrada por Ana", time: "13:20" },
      ],
    },
    {
      id: "c7", accountId: "wa1", contactName: "Ricardo Alves", contactPhone: "(11) 99999-7777", contactEmail: "ricardo@email.com",
      avatar: "RA", lastMessage: "Quando posso agendar a demo?", lastMessageTime: "3h",
      unread: 1, attendanceStatus: "ia", tag: "Lead", crmLinked: true, crmStage: "Contato", crmResponsible: "Ana",
      messages: [
        { id: "m1", sender: "contact", senderName: "Ricardo Alves", text: "Vi vocês no Instagram, quero conhecer", time: "11:00", avatar: "RA" },
        { id: "m2", sender: "ia", senderName: "IA (SDR)", text: "Oi Ricardo! Que legal! Temos planos a partir de R$ 297/mês. Quer agendar uma demonstração gratuita?", time: "11:00" },
        { id: "m3", sender: "contact", senderName: "Ricardo Alves", text: "Quando posso agendar a demo?", time: "11:05", avatar: "RA" },
      ],
    },
    {
      id: "c8", accountId: "wa2", contactName: "Patrícia Nunes", contactPhone: "(11) 99999-8888",
      avatar: "PN", lastMessage: "Gostaria de renovar meu plano", lastMessageTime: "5h",
      unread: 0, attendanceStatus: "humano", attendant: "Carlos", tag: "Pós-venda", crmLinked: true, crmStage: "Fechado", crmResponsible: "Carlos",
      messages: [
        { id: "m1", sender: "contact", senderName: "Patrícia Nunes", text: "Olá, meu plano vence semana que vem", time: "09:00", avatar: "PN" },
        { id: "m2", sender: "ia", senderName: "IA (Suporte)", text: "Oi Patrícia! Vou direcionar para nosso time de renovações.", time: "09:00" },
        { id: "m3", sender: "system", senderName: "Sistema", text: "Conversa assumida por Carlos", time: "09:05" },
        { id: "m4", sender: "user", senderName: "Carlos", text: "Oi Patrícia! Vou preparar uma proposta especial de renovação para você.", time: "09:10" },
        { id: "m5", sender: "contact", senderName: "Patrícia Nunes", text: "Gostaria de renovar meu plano", time: "09:15", avatar: "PN" },
      ],
    },
    {
      id: "c9", accountId: "wa3", contactName: "Lucas Ferreira", contactPhone: "(11) 99999-9999",
      avatar: "LF", lastMessage: "Mensagem não entregue", lastMessageTime: "1d",
      unread: 0, attendanceStatus: "espera", tag: "Lead", crmLinked: false,
      messages: [
        { id: "m1", sender: "contact", senderName: "Lucas Ferreira", text: "Tenho interesse nos serviços", time: "Ontem", avatar: "LF" },
        { id: "m2", sender: "system", senderName: "Sistema", text: "WhatsApp desconectado — mensagem não entregue", time: "Ontem" },
      ],
    },
  ];
}

export function getChatConversas() {
  return getChatConversations().slice(0, 3).map(c => ({
    id: c.id, name: c.contactName, lastMessage: c.lastMessage, time: c.lastMessageTime,
    messages: c.messages.map(m => ({ id: m.id, sender: m.senderName, text: m.text, time: m.time, avatar: m.avatar || "?" })),
  }));
}

// ===== AGENTES DE IA =====

export interface IAAgent {
  id: string;
  type: "SDR" | "Closer" | "Suporte" | "Pós-venda";
  name: string;
  description: string;
  active: boolean;
  linkedAccountId: string | null;
  linkedAccountName: string | null;
  tags: string[];
  tone: "formal" | "casual" | "tecnico" | "amigavel";
  instructions: string;
  workingHours: { start: string; end: string };
  autoReply: boolean;
  stats: {
    conversationsToday: number;
    resolved: number;
    avgResponseTime: string;
  };
}

export function getIAAgents(): IAAgent[] {
  return [
    {
      id: "ag1", type: "SDR", name: "SDR — Qualificação de Leads",
      description: "Aborda leads novos automaticamente, qualifica com perguntas-chave e agenda demonstrações com o time comercial.",
      active: true, linkedAccountId: "wa1", linkedAccountName: "WA Comercial",
      tags: ["Lead"], tone: "amigavel",
      instructions: "Cumprimente o lead pelo nome, pergunte qual o segmento da empresa, porte e principal necessidade. Se qualificado, ofereça agendamento de demo.",
      workingHours: { start: "08:00", end: "18:00" }, autoReply: true,
      stats: { conversationsToday: 12, resolved: 8, avgResponseTime: "15s" },
    },
    {
      id: "ag2", type: "Closer", name: "Closer — Fechamento de Vendas",
      description: "Envia propostas, quebra objeções comuns e conduz o lead até o fechamento com técnicas de negociação.",
      active: true, linkedAccountId: "wa1", linkedAccountName: "WA Comercial",
      tags: ["Lead", "Cliente"], tone: "formal",
      instructions: "Apresente a proposta de forma clara, destaque os diferenciais, use gatilhos de urgência e escassez. Ao detectar objeção, aplique técnica de contorno.",
      workingHours: { start: "09:00", end: "19:00" }, autoReply: true,
      stats: { conversationsToday: 6, resolved: 4, avgResponseTime: "22s" },
    },
    {
      id: "ag3", type: "Suporte", name: "Suporte — Atendimento ao Cliente",
      description: "Responde dúvidas de clientes ativos, resolve problemas técnicos e escala para humano quando necessário.",
      active: true, linkedAccountId: "wa2", linkedAccountName: "WA Suporte",
      tags: ["Cliente"], tone: "tecnico",
      instructions: "Identifique o problema do cliente, busque na base de conhecimento, ofereça solução passo a passo. Se não resolver em 3 tentativas, transfira para humano.",
      workingHours: { start: "07:00", end: "22:00" }, autoReply: true,
      stats: { conversationsToday: 18, resolved: 15, avgResponseTime: "8s" },
    },
    {
      id: "ag4", type: "Pós-venda", name: "Pós-venda — Retenção e NPS",
      description: "Realiza follow-up com clientes, coleta NPS, identifica risco de churn e propõe reativação.",
      active: false, linkedAccountId: null, linkedAccountName: null,
      tags: ["Pós-venda"], tone: "casual",
      instructions: "Envie mensagem de check-in após 7, 30 e 90 dias. Pergunte nível de satisfação (0-10). Se nota < 7, escale para gerente de contas.",
      workingHours: { start: "09:00", end: "17:00" }, autoReply: false,
      stats: { conversationsToday: 0, resolved: 0, avgResponseTime: "—" },
    },
  ];
}
