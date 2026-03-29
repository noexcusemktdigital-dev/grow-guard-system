// @ts-nocheck
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
}

const isDev = import.meta.env.DEV;

function formatMessage(context: string | undefined, message: string): string {
  return context ? `[${context}] ${message}` : message;
}

export const logger = {
  error(message: string, data?: unknown, context?: string) {
    if (isDev) {
      console.error(formatMessage(context, message), data ?? '');
    }
    // In production, could send to Supabase or monitoring service
  },
  warn(message: string, data?: unknown, context?: string) {
    if (isDev) {
      console.warn(formatMessage(context, message), data ?? '');
    }
  },
  info(message: string, data?: unknown, context?: string) {
    if (isDev) {
      console.info(formatMessage(context, message), data ?? '');
    }
  },
  debug(message: string, data?: unknown, context?: string) {
    if (isDev) {
      console.debug(formatMessage(context, message), data ?? '');
    }
  },
};
