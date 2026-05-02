/**
 * Analytics agnostic — provider plug-in.
 *
 * Como usar:
 *   import { analytics } from '@/lib/analytics';
 *   analytics.track('signup_completed', { plan: 'pro', userId: user.id });
 *
 * Provider atual: 'noop' (stub que loga em dev).
 * Para trocar: implementar AnalyticsProvider e setar via setAnalyticsProvider().
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  userId?: string;
  organizationId?: string;
  timestamp?: string;
}

export interface AnalyticsProvider {
  identify(userId: string, traits?: Record<string, unknown>): void;
  track(event: AnalyticsEvent): void;
  page(name: string, properties?: Record<string, unknown>): void;
  reset(): void;
}

// PII keys que NUNCA devem ir em events
const PII_BLOCKLIST = ['email','cpf','cnpj','phone','telefone','password','senha','token','access_token','secret','api_key'];

function sanitize(properties: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!properties) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (PII_BLOCKLIST.some(p => k.toLowerCase().includes(p))) continue;
    out[k] = v;
  }
  return out;
}

class NoopProvider implements AnalyticsProvider {
  identify(userId: string, traits?: Record<string, unknown>) {
    if (import.meta.env.DEV) console.debug('[analytics:noop] identify', userId, sanitize(traits));
  }
  track(event: AnalyticsEvent) {
    if (import.meta.env.DEV) console.debug('[analytics:noop] track', event.name, sanitize(event.properties));
  }
  page(name: string, properties?: Record<string, unknown>) {
    if (import.meta.env.DEV) console.debug('[analytics:noop] page', name, sanitize(properties));
  }
  reset() {
    if (import.meta.env.DEV) console.debug('[analytics:noop] reset');
  }
}

let provider: AnalyticsProvider = new NoopProvider();

export function setAnalyticsProvider(p: AnalyticsProvider) {
  provider = p;
}

export const analytics = {
  identify(userId: string, traits?: Record<string, unknown>) {
    provider.identify(userId, sanitize(traits));
  },
  track(name: string, properties?: Record<string, unknown>) {
    provider.track({
      name,
      properties: sanitize(properties),
      timestamp: new Date().toISOString(),
    });
  },
  page(name: string, properties?: Record<string, unknown>) {
    provider.page(name, sanitize(properties));
  },
  reset() {
    provider.reset();
  },
};
