import {
  isSameDay, isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  startOfMonth, endOfMonth, parseISO, isWithinInterval
} from "date-fns";
import type { AgendaEvent, RecurrenceType, TimeBlock } from "@/types/agenda";
import { mockEvents, mockTimeBlocks, mockCalendars } from "@/mocks/agenda";

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