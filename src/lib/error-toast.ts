import { toast } from 'sonner';
import { analytics } from './analytics';
import { ANALYTICS_EVENTS } from './analytics-events';

export interface ErrorToastOptions {
  /** Título do toast (default: 'Erro') */
  title?: string;
  /** Categoria do erro pra analytics (default: 'unknown') */
  category?: string;
  /** Inclui requestId no toast pra debug (default: true) */
  showRequestId?: boolean;
  /** Loga em console também (default: true em dev) */
  console?: boolean;
}

/**
 * Reporta erro de forma uniforme:
 * - Toast com mensagem user-friendly
 * - Console.error em dev
 * - Analytics track (sem PII)
 * - x-request-id mostrado para debug
 *
 * Uso:
 *   try {
 *     ...
 *   } catch (err) {
 *     reportError(err, { title: 'Falha ao salvar lead', category: 'lead_save' });
 *   }
 */
export function reportError(
  err: unknown,
  options: ErrorToastOptions = {}
): void {
  const {
    title = 'Erro',
    category = 'unknown',
    showRequestId = true,
    console: useConsole = import.meta.env.DEV,
  } = options;

  const message = err instanceof Error ? err.message : String(err);
  const requestId = (err as { requestId?: string })?.requestId;

  // User-friendly description
  let description = message;
  if (showRequestId && requestId) {
    description += ` (id: ${requestId.slice(0, 8)})`;
  }

  toast.error(title, { description });

  if (useConsole) {
    console.error(`[${category}] ${title}:`, err);
  }

  // Analytics — categoria sanitizada (sem PII)
  analytics.track(ANALYTICS_EVENTS.ERROR_DISPLAYED, {
    category,
    has_request_id: !!requestId,
  });
}

/** Helper para erro de invokeEdge — usa requestId automaticamente. */
export function reportEdgeError(
  result: { error: Error | null; requestId: string },
  options: ErrorToastOptions = {}
): void {
  if (!result.error) return;
  reportError(
    Object.assign(result.error, { requestId: result.requestId }),
    options
  );
}
