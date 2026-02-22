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

// Constants
export const roleDescriptions: Record<UserRole, { label: string; description: string; color: string }> = {
  admin: { label: "Admin", description: "Acesso total, gerencia plano, compra créditos, conecta WhatsApp", color: "bg-primary text-primary-foreground" },
  gestor_comercial: { label: "Gestor Comercial", description: "CRM, Chat, Scripts, Relatórios", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  marketing: { label: "Marketing", description: "Conteúdos, Sites, Tráfego, Campanhas", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  operador: { label: "Operador", description: "Apenas CRM e Chat", color: "bg-muted text-muted-foreground" },
};
