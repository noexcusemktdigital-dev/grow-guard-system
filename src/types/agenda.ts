// @ts-nocheck
// Agenda types and constants (extracted from agendaData.ts)
import {
  isSameDay, isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  startOfMonth, endOfMonth, parseISO, format, isWithinInterval
} from "date-fns";

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

// ========== Pure helper functions (no mock data) ==========

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
    Recusado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    Pendente: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return map[status];
}

export function getLevelLabel(nivel: CalendarLevel): string {
  const map: Record<CalendarLevel, string> = {
    usuario: "Pessoal", unidade: "Unidade", rede: "Rede", colaborativa: "Colaborativa",
  };
  return map[nivel];
}

export function getLevelColor(nivel: CalendarLevel): string {
  const map: Record<CalendarLevel, string> = {
    usuario: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    unidade: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    rede: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    colaborativa: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return map[nivel];
}

export function getEventColor(calendarId: string, calendars: CalendarConfig[]): string {
  return calendars.find(c => c.id === calendarId)?.cor ?? "#6B7280";
}

export function getRecurrenceLabel(r: RecurrenceType): string {
  const map: Record<RecurrenceType, string> = {
    none: "Nenhuma", daily: "Diária", weekly: "Semanal", biweekly: "Quinzenal", monthly: "Mensal",
  };
  return map[r];
}

export function getMonthDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: calStart, end: calEnd });
}

export function getPendingInvites(events: AgendaEvent[], userId: string): AgendaEvent[] {
  return events.filter(e =>
    e.participantes.some(p => p.userId === userId && p.status === "Pendente")
  );
}
