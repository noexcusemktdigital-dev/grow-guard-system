// ========== TYPES ==========

export type CalendarLevel = "usuario" | "unidade" | "rede" | "colaborativa";
export type EventType = "Reunião" | "CS" | "Comercial" | "Treinamento" | "Evento" | "Prazo" | "Bloqueio";
export type EventStatus = "Confirmado" | "Pendente" | "Cancelado";
export type EventVisibility = "Privado" | "Interno unidade" | "Rede" | "Colaborativo";
export type InviteStatus = "Aceito" | "Recusado" | "Pendente";
export type RecurrenceType = "none" | "daily" | "weekly" | "biweekly" | "monthly";
export type BlockType = "disponivel" | "bloqueado";
export type SyncStatus = "synced" | "pending" | "error";

export interface CalendarParticipant {
  userId: string;
  nome: string;
  permissao: "editor" | "visualizador";
}

export interface CalendarConfig {
  id: string;
  nome: string;
  nivel: CalendarLevel;
  cor: string;
  ownerId: string;
  ownerNome: string;
  unidadeId?: string;
  participantes?: CalendarParticipant[];
  compartilharComUnidade: boolean;
  compartilharComFranqueadora: boolean;
  mostrarDetalhes: boolean;
}

export interface EventParticipant {
  userId: string;
  nome: string;
  unidadeNome?: string;
  email?: string;
  status: InviteStatus;
  respondidoEm?: string;
}

export interface AgendaEvent {
  id: string;
  titulo: string;
  descricao: string;
  inicio: string;
  fim: string;
  allDay: boolean;
  calendarId: string;
  nivel: CalendarLevel;
  tipo: EventType;
  status: EventStatus;
  visibilidade: EventVisibility;
  recorrencia: RecurrenceType;
  participantes: EventParticipant[];
  local?: string;
  linkMeet?: string;
  anexos?: string[];
  criadoPor: string;
  criadoPorNome: string;
  unidadeId?: string;
  googleEventId?: string;
  googleCalendarId?: string;
  syncStatus?: SyncStatus;
  lastSyncedAt?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface TimeBlock {
  id: string;
  userId: string;
  userNome: string;
  titulo: string;
  inicio: string;
  fim: string;
  recorrencia: RecurrenceType;
  tipo: BlockType;
  criadoEm: string;
}

// ========== MOCK CALENDARS ==========

export const mockCalendars: CalendarConfig[] = [
  {
    id: "cal-1",
    nome: "Minha Agenda",
    nivel: "usuario",
    cor: "#3B82F6",
    ownerId: "u-davi",
    ownerNome: "Davi",
    compartilharComUnidade: false,
    compartilharComFranqueadora: false,
    mostrarDetalhes: true,
  },
  {
    id: "cal-2",
    nome: "Agenda Curitiba",
    nivel: "unidade",
    cor: "#10B981",
    ownerId: "u-davi",
    ownerNome: "Davi",
    unidadeId: "u1",
    compartilharComUnidade: true,
    compartilharComFranqueadora: true,
    mostrarDetalhes: true,
  },
  {
    id: "cal-3",
    nome: "Agenda da Rede",
    nivel: "rede",
    cor: "#8B5CF6",
    ownerId: "u-admin",
    ownerNome: "Admin Franqueadora",
    compartilharComUnidade: true,
    compartilharComFranqueadora: true,
    mostrarDetalhes: true,
  },
  {
    id: "cal-4",
    nome: "Projeto Expansão SP",
    nivel: "colaborativa",
    cor: "#F59E0B",
    ownerId: "u-davi",
    ownerNome: "Davi",
    participantes: [
      { userId: "u-davi", nome: "Davi", permissao: "editor" },
      { userId: "u-lucas", nome: "Lucas", permissao: "editor" },
      { userId: "u-amanda", nome: "Amanda", permissao: "visualizador" },
    ],
    compartilharComUnidade: false,
    compartilharComFranqueadora: false,
    mostrarDetalhes: true,
  },
  {
    id: "cal-5",
    nome: "Onboarding Bahia",
    nivel: "colaborativa",
    cor: "#14B8A6",
    ownerId: "u-lucas",
    ownerNome: "Lucas",
    participantes: [
      { userId: "u-lucas", nome: "Lucas", permissao: "editor" },
      { userId: "u-davi", nome: "Davi", permissao: "visualizador" },
    ],
    compartilharComUnidade: false,
    compartilharComFranqueadora: false,
    mostrarDetalhes: true,
  },
];

// ========== MOCK EVENTS ==========

export const mockEvents: AgendaEvent[] = [
  // --- Pessoais (usuario) ---
  {
    id: "ev-1", titulo: "Revisão de metas pessoais", descricao: "Revisar OKRs do trimestre",
    inicio: "2026-02-23T09:00:00", fim: "2026-02-23T10:00:00", allDay: false,
    calendarId: "cal-1", nivel: "usuario", tipo: "Reunião", status: "Confirmado",
    visibilidade: "Privado", recorrencia: "none", participantes: [],
    criadoPor: "u-davi", criadoPorNome: "Davi", criadoEm: "2026-02-15T08:00:00", atualizadoEm: "2026-02-15T08:00:00",
  },
  {
    id: "ev-2", titulo: "Almoço com investidor", descricao: "Reunião informal com potencial investidor",
    inicio: "2026-02-25T12:00:00", fim: "2026-02-25T13:30:00", allDay: false,
    calendarId: "cal-1", nivel: "usuario", tipo: "Comercial", status: "Pendente",
    visibilidade: "Privado", recorrencia: "none", participantes: [],
    local: "Restaurante Madalosso", criadoPor: "u-davi", criadoPorNome: "Davi",
    criadoEm: "2026-02-16T10:00:00", atualizadoEm: "2026-02-16T10:00:00",
  },
  {
    id: "ev-3", titulo: "1:1 com Lucas", descricao: "Acompanhamento semanal",
    inicio: "2026-02-24T14:00:00", fim: "2026-02-24T14:30:00", allDay: false,
    calendarId: "cal-1", nivel: "usuario", tipo: "Reunião", status: "Confirmado",
    visibilidade: "Interno unidade", recorrencia: "weekly",
    participantes: [
      { userId: "u-lucas", nome: "Lucas", unidadeNome: "Curitiba", status: "Aceito", respondidoEm: "2026-02-17T09:00:00" },
    ],
    linkMeet: "https://meet.google.com/abc-defg-hij",
    criadoPor: "u-davi", criadoPorNome: "Davi", criadoEm: "2026-02-10T08:00:00", atualizadoEm: "2026-02-10T08:00:00",
  },
  {
    id: "ev-4", titulo: "Planejamento de conteúdo", descricao: "Definir pautas do mês",
    inicio: "2026-03-02T10:00:00", fim: "2026-03-02T11:00:00", allDay: false,
    calendarId: "cal-1", nivel: "usuario", tipo: "Reunião", status: "Confirmado",
    visibilidade: "Privado", recorrencia: "monthly", participantes: [],
    criadoPor: "u-davi", criadoPorNome: "Davi", criadoEm: "2026-02-18T09:00:00", atualizadoEm: "2026-02-18T09:00:00",
  },
  // --- Unidade ---
  {
    id: "ev-5", titulo: "Reunião com cliente Alfa", descricao: "Apresentação de proposta comercial",
    inicio: "2026-02-22T10:00:00", fim: "2026-02-22T11:30:00", allDay: false,
    calendarId: "cal-2", nivel: "unidade", tipo: "Comercial", status: "Confirmado",
    visibilidade: "Interno unidade", recorrencia: "none",
    participantes: [
      { userId: "u-davi", nome: "Davi", unidadeNome: "Curitiba", status: "Aceito" },
      { userId: "u-lucas", nome: "Lucas", unidadeNome: "Curitiba", status: "Aceito" },
    ],
    local: "Sala 3 - Escritório Curitiba", unidadeId: "u1",
    criadoPor: "u-davi", criadoPorNome: "Davi", criadoEm: "2026-02-14T08:00:00", atualizadoEm: "2026-02-14T08:00:00",
  },
  {
    id: "ev-6", titulo: "Standup diário", descricao: "Alinhamento rápido do time",
    inicio: "2026-02-21T08:30:00", fim: "2026-02-21T08:45:00", allDay: false,
    calendarId: "cal-2", nivel: "unidade", tipo: "Reunião", status: "Confirmado",
    visibilidade: "Interno unidade", recorrencia: "daily",
    participantes: [
      { userId: "u-davi", nome: "Davi", unidadeNome: "Curitiba", status: "Aceito" },
      { userId: "u-lucas", nome: "Lucas", unidadeNome: "Curitiba", status: "Aceito" },
      { userId: "u-amanda", nome: "Amanda", unidadeNome: "Curitiba", status: "Aceito" },
    ],
    linkMeet: "https://meet.google.com/xyz-1234", unidadeId: "u1",
    criadoPor: "u-lucas", criadoPorNome: "Lucas", criadoEm: "2026-01-10T08:00:00", atualizadoEm: "2026-01-10T08:00:00",
  },
  {
    id: "ev-7", titulo: "CS - Acompanhamento Cliente Beta", descricao: "Revisão trimestral de satisfação",
    inicio: "2026-02-26T15:00:00", fim: "2026-02-26T16:00:00", allDay: false,
    calendarId: "cal-2", nivel: "unidade", tipo: "CS", status: "Pendente",
    visibilidade: "Interno unidade", recorrencia: "none",
    participantes: [
      { userId: "u-amanda", nome: "Amanda", unidadeNome: "Curitiba", status: "Pendente" },
    ],
    local: "Online", linkMeet: "https://zoom.us/j/123456", unidadeId: "u1",
    criadoPor: "u-davi", criadoPorNome: "Davi", criadoEm: "2026-02-18T10:00:00", atualizadoEm: "2026-02-18T10:00:00",
  },
  {
    id: "ev-8", titulo: "Treinamento técnico interno", descricao: "Workshop de novas funcionalidades do sistema",
    inicio: "2026-02-28T14:00:00", fim: "2026-02-28T17:00:00", allDay: false,
    calendarId: "cal-2", nivel: "unidade", tipo: "Treinamento", status: "Confirmado",
    visibilidade: "Interno unidade", recorrencia: "none",
    participantes: [
      { userId: "u-davi", nome: "Davi", unidadeNome: "Curitiba", status: "Aceito" },
      { userId: "u-lucas", nome: "Lucas", unidadeNome: "Curitiba", status: "Aceito" },
      { userId: "u-amanda", nome: "Amanda", unidadeNome: "Curitiba", status: "Pendente" },
    ],
    local: "Sala de treinamento - Curitiba", unidadeId: "u1",
    criadoPor: "u-lucas", criadoPorNome: "Lucas", criadoEm: "2026-02-15T11:00:00", atualizadoEm: "2026-02-15T11:00:00",
  },
  // --- Rede ---
  {
    id: "ev-9", titulo: "Convenção Anual da Rede", descricao: "Evento anual com todas as unidades. Apresentação de resultados e planos.",
    inicio: "2026-03-15T09:00:00", fim: "2026-03-15T18:00:00", allDay: true,
    calendarId: "cal-3", nivel: "rede", tipo: "Evento", status: "Confirmado",
    visibilidade: "Rede", recorrencia: "none",
    participantes: [
      { userId: "u-davi", nome: "Davi", unidadeNome: "Curitiba", status: "Aceito" },
      { userId: "u-lucas", nome: "Lucas", unidadeNome: "Curitiba", status: "Pendente" },
    ],
    local: "Centro de Convenções - São Paulo",
    criadoPor: "u-admin", criadoPorNome: "Admin Franqueadora", criadoEm: "2026-01-20T08:00:00", atualizadoEm: "2026-01-20T08:00:00",
  },
  {
    id: "ev-10", titulo: "Fechamento DRE Fevereiro", descricao: "Prazo final para envio dos dados financeiros",
    inicio: "2026-02-28T23:59:00", fim: "2026-02-28T23:59:00", allDay: true,
    calendarId: "cal-3", nivel: "rede", tipo: "Prazo", status: "Confirmado",
    visibilidade: "Rede", recorrencia: "monthly", participantes: [],
    criadoPor: "u-admin", criadoPorNome: "Admin Franqueadora", criadoEm: "2026-01-05T08:00:00", atualizadoEm: "2026-01-05T08:00:00",
  },
  {
    id: "ev-11", titulo: "Treinamento Rede - Vendas Consultivas", descricao: "Treinamento obrigatório para todos os franqueados sobre nova metodologia de vendas.",
    inicio: "2026-03-05T10:00:00", fim: "2026-03-05T12:00:00", allDay: false,
    calendarId: "cal-3", nivel: "rede", tipo: "Treinamento", status: "Confirmado",
    visibilidade: "Rede", recorrencia: "none",
    participantes: [
      { userId: "u-davi", nome: "Davi", unidadeNome: "Curitiba", status: "Pendente" },
      { userId: "u-amanda", nome: "Amanda", unidadeNome: "Curitiba", status: "Pendente" },
    ],
    linkMeet: "https://meet.google.com/rede-vendas",
    criadoPor: "u-admin", criadoPorNome: "Admin Franqueadora", criadoEm: "2026-02-10T08:00:00", atualizadoEm: "2026-02-10T08:00:00",
  },
  {
    id: "ev-12", titulo: "Lançamento Campanha Março", descricao: "Kick-off da campanha de marketing de março",
    inicio: "2026-03-01T09:00:00", fim: "2026-03-01T10:00:00", allDay: false,
    calendarId: "cal-3", nivel: "rede", tipo: "Evento", status: "Confirmado",
    visibilidade: "Rede", recorrencia: "none", participantes: [],
    linkMeet: "https://meet.google.com/campanha-mar",
    criadoPor: "u-admin", criadoPorNome: "Admin Franqueadora", criadoEm: "2026-02-20T08:00:00", atualizadoEm: "2026-02-20T08:00:00",
  },
  // --- Colaborativas ---
  {
    id: "ev-13", titulo: "Sprint Planning - Expansão SP", descricao: "Planejamento quinzenal do projeto de expansão para São Paulo",
    inicio: "2026-02-24T10:00:00", fim: "2026-02-24T11:30:00", allDay: false,
    calendarId: "cal-4", nivel: "colaborativa", tipo: "Reunião", status: "Confirmado",
    visibilidade: "Colaborativo", recorrencia: "biweekly",
    participantes: [
      { userId: "u-davi", nome: "Davi", status: "Aceito" },
      { userId: "u-lucas", nome: "Lucas", status: "Aceito" },
      { userId: "u-amanda", nome: "Amanda", status: "Pendente" },
    ],
    linkMeet: "https://meet.google.com/exp-sp",
    criadoPor: "u-davi", criadoPorNome: "Davi", criadoEm: "2026-02-10T08:00:00", atualizadoEm: "2026-02-10T08:00:00",
  },
  {
    id: "ev-14", titulo: "Visita técnica - Ponto comercial SP", descricao: "Visita ao ponto comercial em avaliação",
    inicio: "2026-03-10T14:00:00", fim: "2026-03-10T17:00:00", allDay: false,
    calendarId: "cal-4", nivel: "colaborativa", tipo: "Comercial", status: "Pendente",
    visibilidade: "Colaborativo", recorrencia: "none",
    participantes: [
      { userId: "u-davi", nome: "Davi", status: "Aceito" },
      { userId: "u-lucas", nome: "Lucas", status: "Pendente" },
    ],
    local: "Av. Paulista, 1000 - São Paulo",
    criadoPor: "u-davi", criadoPorNome: "Davi", criadoEm: "2026-02-20T08:00:00", atualizadoEm: "2026-02-20T08:00:00",
  },
  {
    id: "ev-15", titulo: "Onboarding Bahia - Kick-off", descricao: "Reunião inicial de onboarding da unidade Bahia",
    inicio: "2026-02-27T09:00:00", fim: "2026-02-27T11:00:00", allDay: false,
    calendarId: "cal-5", nivel: "colaborativa", tipo: "Reunião", status: "Confirmado",
    visibilidade: "Colaborativo", recorrencia: "none",
    participantes: [
      { userId: "u-lucas", nome: "Lucas", status: "Aceito" },
      { userId: "u-davi", nome: "Davi", status: "Aceito" },
    ],
    linkMeet: "https://meet.google.com/onb-bahia",
    criadoPor: "u-lucas", criadoPorNome: "Lucas", criadoEm: "2026-02-18T08:00:00", atualizadoEm: "2026-02-18T08:00:00",
  },
  {
    id: "ev-16", titulo: "Onboarding Bahia - Treinamento Operacional", descricao: "Treinamento de operações para equipe Bahia",
    inicio: "2026-03-06T09:00:00", fim: "2026-03-06T12:00:00", allDay: false,
    calendarId: "cal-5", nivel: "colaborativa", tipo: "Treinamento", status: "Confirmado",
    visibilidade: "Colaborativo", recorrencia: "none",
    participantes: [
      { userId: "u-lucas", nome: "Lucas", status: "Aceito" },
      { userId: "u-davi", nome: "Davi", status: "Pendente" },
    ],
    linkMeet: "https://meet.google.com/onb-bahia-2",
    criadoPor: "u-lucas", criadoPorNome: "Lucas", criadoEm: "2026-02-20T08:00:00", atualizadoEm: "2026-02-20T08:00:00",
  },
  // --- Cancelado ---
  {
    id: "ev-17", titulo: "Reunião com fornecedor cancelada", descricao: "Cancelada por indisponibilidade do fornecedor",
    inicio: "2026-02-21T16:00:00", fim: "2026-02-21T17:00:00", allDay: false,
    calendarId: "cal-2", nivel: "unidade", tipo: "Comercial", status: "Cancelado",
    visibilidade: "Interno unidade", recorrencia: "none", participantes: [],
    unidadeId: "u1",
    criadoPor: "u-davi", criadoPorNome: "Davi", criadoEm: "2026-02-12T08:00:00", atualizadoEm: "2026-02-19T08:00:00",
  },
];

// ========== MOCK TIME BLOCKS ==========

export const mockTimeBlocks: TimeBlock[] = [
  {
    id: "tb-1", userId: "u-davi", userNome: "Davi",
    titulo: "Disponível para CS", inicio: "2026-02-24T14:00:00", fim: "2026-02-24T18:00:00",
    recorrencia: "weekly", tipo: "disponivel", criadoEm: "2026-02-01T08:00:00",
  },
  {
    id: "tb-2", userId: "u-davi", userNome: "Davi",
    titulo: "Bloqueado - Foco", inicio: "2026-02-25T08:00:00", fim: "2026-02-25T10:00:00",
    recorrencia: "daily", tipo: "bloqueado", criadoEm: "2026-02-01T08:00:00",
  },
];

// ========== MOCK USERS ==========

export const mockAgendaUsers = [
  { id: "u-davi", nome: "Davi", unidadeNome: "Curitiba", email: "davi@franquia.com" },
  { id: "u-lucas", nome: "Lucas", unidadeNome: "Curitiba", email: "lucas@franquia.com" },
  { id: "u-amanda", nome: "Amanda", unidadeNome: "Curitiba", email: "amanda@franquia.com" },
  { id: "u-admin", nome: "Admin Franqueadora", unidadeNome: "Sede", email: "admin@franqueadora.com" },
  { id: "u-carlos", nome: "Carlos", unidadeNome: "São Paulo", email: "carlos@franquia.com" },
  { id: "u-julia", nome: "Julia", unidadeNome: "Bahia", email: "julia@franquia.com" },
];

// ========== HELPERS ==========

import {
  isSameDay, isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  startOfMonth, endOfMonth, parseISO, format, isWithinInterval
} from "date-fns";

export function getEventsForDate(date: Date, calendarIds: string[]): AgendaEvent[] {
  return mockEvents.filter(e =>
    calendarIds.includes(e.calendarId) && isSameDay(parseISO(e.inicio), date)
  );
}

export function getEventsForWeek(date: Date, calendarIds: string[]): AgendaEvent[] {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return mockEvents.filter(e => {
    const d = parseISO(e.inicio);
    return calendarIds.includes(e.calendarId) && isWithinInterval(d, { start, end });
  });
}

export function getEventsForMonth(date: Date, calendarIds: string[]): AgendaEvent[] {
  return mockEvents.filter(e => {
    const d = parseISO(e.inicio);
    return calendarIds.includes(e.calendarId) && isSameMonth(d, date);
  });
}

export function getEventColor(calendarId: string): string {
  return mockCalendars.find(c => c.id === calendarId)?.cor ?? "#6B7280";
}

export function getTypeIcon(tipo: EventType): string {
  const map: Record<EventType, string> = {
    "Reunião": "Users", CS: "HeadphonesIcon", Comercial: "TrendingUp",
    Treinamento: "GraduationCap", Evento: "Calendar", Prazo: "Clock", Bloqueio: "Lock",
  };
  return map[tipo] || "Calendar";
}

export function getStatusColor(status: EventStatus): string {
  const map: Record<EventStatus, string> = {
    Confirmado: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    Pendente: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    Cancelado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return map[status];
}

export function getInviteStatusColor(status: InviteStatus): string {
  const map: Record<InviteStatus, string> = {
    Aceito: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    Pendente: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    Recusado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return map[status];
}

export function getLevelLabel(nivel: CalendarLevel): string {
  const map: Record<CalendarLevel, string> = {
    usuario: "Usuário", unidade: "Unidade", rede: "Rede", colaborativa: "Colaborativa",
  };
  return map[nivel];
}

export function getRecurrenceLabel(r: RecurrenceType): string {
  const map: Record<RecurrenceType, string> = {
    none: "Nenhuma", daily: "Diária", weekly: "Semanal", biweekly: "Quinzenal", monthly: "Mensal",
  };
  return map[r];
}

export function getPendingInvites(userId: string): AgendaEvent[] {
  return mockEvents.filter(e =>
    e.participantes.some(p => p.userId === userId && p.status === "Pendente")
  );
}

export function getBlocksForUser(userId: string): TimeBlock[] {
  return mockTimeBlocks.filter(b => b.userId === userId);
}

export function isTimeAvailable(userId: string, inicio: string, fim: string): boolean {
  const blocks = getBlocksForUser(userId).filter(b => b.tipo === "bloqueado");
  const start = parseISO(inicio);
  const end = parseISO(fim);
  return !blocks.some(b => {
    const bs = parseISO(b.inicio);
    const be = parseISO(b.fim);
    return start < be && end > bs;
  });
}

export function getMonthDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: calStart, end: calEnd });
}
