// @ts-nocheck
// Cliente types
export type ApprovalStatus = "pending" | "approved" | "changes_requested" | "rejected";

export type AgentRole = "sdr" | "closer" | "pos_venda" | "suporte";

export interface AiAgent {
  id: string;
  organization_id: string;
  created_by: string | null;
  name: string;
  avatar_url: string | null;
  status: string;
  description: string | null;
  persona: Record<string, unknown>;
  knowledge_base: Record<string, unknown>[];
  prompt_config: Record<string, unknown>;
  channel: string;
  tags: string[];
  role: AgentRole;
  gender: string | null;
  objectives: Record<string, unknown>[];
  crm_actions: Record<string, unknown>;
  whatsapp_instance_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface AgentRoleInfo {
  label: string;
  description: string;
  color: string;
  objectives: string[];
  longDescription: string;
  workflow: string[];
}

export const agentRoleConfig: Record<AgentRole, AgentRoleInfo> = {
  sdr: {
    label: "SDR",
    description: "Prospecção e qualificação",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    objectives: ["Qualificar lead (BANT)", "Identificar decisor", "Coletar necessidade e orçamento", "Agendar reunião com vendedor", "Enviar lead qualificado com resumo"],
    longDescription: "O agente SDR tem foco em qualificar leads com perguntas assertivas e objetivas. Ele identifica o decisor, compreende a necessidade real, avalia orçamento disponível e, quando o lead está qualificado, envia para os vendedores humanos com um resumo completo da qualificação. Nunca tenta fechar vendas — seu papel é preparar o terreno.",
    workflow: ["Recepcionar o contato com saudação personalizada", "Fazer perguntas de qualificação (BANT: Budget, Authority, Need, Timeline)", "Classificar o lead como Quente, Morno ou Frio", "Gerar resumo da qualificação para o vendedor", "Transferir (handoff) para atendimento humano com contexto completo"],
  },
  closer: {
    label: "Closer",
    description: "Fechamento de vendas",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    objectives: ["Qualificar rapidamente", "Apresentar produto/serviço", "Enviar links de venda", "Superar objeções", "Fechar venda diretamente"],
    longDescription: "O agente Closer combina qualificação rápida com fechamento direto. Diferente do SDR, ele não agenda reuniões — já apresenta os produtos/serviços, envia links de venda e conduz o lead até a conversão. Ideal para vendas de ticket mais baixo ou produtos com ciclo de venda curto.",
    workflow: ["Qualificar o interesse do lead rapidamente", "Apresentar o produto/serviço ideal para a necessidade", "Enviar link de venda ou página do produto", "Responder objeções com argumentos da base de conhecimento", "Conduzir ao fechamento e confirmar a venda"],
  },
  pos_venda: {
    label: "Pós-venda",
    description: "Feedback e NPS",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    objectives: ["Parabenizar pela compra/contratação", "Perguntar sobre a experiência", "Coletar nota NPS (1-10)", "Registrar feedback detalhado", "Identificar oportunidades de upsell"],
    longDescription: "O agente de Pós-venda é ativado após uma venda ou contratação. Seu foco é colher feedback genuíno e medir a satisfação do cliente (NPS). Ele parabeniza, pergunta sobre a experiência, coleta uma nota de 1 a 10, registra comentários e identifica possíveis melhorias ou oportunidades de upsell.",
    workflow: ["Parabenizar o cliente pela compra/contratação", "Perguntar sobre a experiência com o produto/serviço", "Solicitar nota NPS de 1 a 10", "Registrar comentário e feedback detalhado", "Agradecer e encerrar de forma positiva"],
  },
  suporte: {
    label: "Suporte",
    description: "Resolução de problemas",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    objectives: ["Compreender a dor real do cliente", "Diagnosticar o problema com perguntas assertivas", "Resolver usando a base de conhecimento", "Confirmar se o problema foi resolvido", "Encaminhar para especialista com diagnóstico completo"],
    longDescription: "O agente de Suporte foca em compreender profundamente a dor do cliente antes de tentar resolver. Ele faz perguntas diagnósticas assertivas, busca soluções na base de conhecimento, verifica se a resolução funcionou e, caso não consiga resolver, transfere para um humano especialista já com o problema completamente identificado e documentado.",
    workflow: ["Acolher o cliente e demonstrar empatia", "Fazer perguntas diagnósticas para entender o problema real", "Buscar solução na base de conhecimento", "Apresentar solução e confirmar se resolveu", "Se não resolveu, transferir para especialista com resumo do diagnóstico"],
  },
};

// Cliente types (extracted from clienteData.ts)

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
  transactions?: CreditTransaction[];
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

// CRM Expandido
export interface TimelineEntry {
  id: string;
  type: "message" | "stage_change" | "note" | "task" | "call" | "edit";
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
  stage: string;
  responsible: string;
  notes: string;
  createdAt: string;
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

// Disparos WhatsApp
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

export const roleDescriptions: Record<UserRole, { label: string; description: string; color: string }> = {
  admin: { label: "Admin", description: "Acesso total, gerencia plano, compra créditos, conecta WhatsApp", color: "bg-primary text-primary-foreground" },
  gestor_comercial: { label: "Gestor Comercial", description: "CRM, Chat, Scripts, Relatórios", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  marketing: { label: "Marketing", description: "Conteúdos, Sites, Tráfego, Campanhas", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  operador: { label: "Operador", description: "Apenas CRM e Chat", color: "bg-muted text-muted-foreground" },
};

