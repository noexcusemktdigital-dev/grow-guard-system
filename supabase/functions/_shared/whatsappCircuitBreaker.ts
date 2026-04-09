// INT-004: Circuit Breaker for WhatsApp provider failover
//
// State is stored in an in-memory map scoped to the Deno edge function isolate.
// When one provider accumulates FAILURE_THRESHOLD failures within TIMEOUT_MS,
// its circuit opens and getPreferredProvider() routes to the fallback provider
// (if configured). After TIMEOUT_MS without a new failure the circuit auto-resets.
//
// Usage in whatsapp-send (already integrated below the provider dispatch block):
//   import { recordSuccess, recordFailure, getPreferredProvider } from '../_shared/whatsappCircuitBreaker.ts';

export type WhatsAppProvider = "evolution" | "z-api";

interface CircuitState {
  failures: number;
  lastFailure: number; // Unix ms timestamp
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
}

// Module-level map — shared across requests within the same isolate lifetime.
const circuitState: Record<string, CircuitState> = {};

const FAILURE_THRESHOLD = 3;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function stateKey(provider: WhatsAppProvider, instanceId: string): string {
  return `${provider}:${instanceId}`;
}

/** Call after a successful send to reset the failure counter. */
export function recordSuccess(
  provider: WhatsAppProvider,
  instanceId: string,
): void {
  const key = stateKey(provider, instanceId);
  circuitState[key] = { failures: 0, lastFailure: 0, state: "CLOSED" };
}

/** Call after a failed send attempt (HTTP error, network error, etc.). */
export function recordFailure(
  provider: WhatsAppProvider,
  instanceId: string,
): void {
  const key = stateKey(provider, instanceId);
  const current = circuitState[key] ?? {
    failures: 0,
    lastFailure: 0,
    state: "CLOSED",
  };
  const failures = current.failures + 1;
  const nextState: CircuitState = {
    failures,
    lastFailure: Date.now(),
    state: failures >= FAILURE_THRESHOLD ? "OPEN" : "CLOSED",
  };
  circuitState[key] = nextState;

  if (nextState.state === "OPEN") {
    console.warn(
      `[CircuitBreaker] Provider ${provider}/${instanceId} circuit OPEN after ${failures} consecutive failures`,
    );
  }
}

/**
 * Returns true when the circuit is OPEN (provider should be skipped).
 * Auto-resets to CLOSED after TIMEOUT_MS so the provider gets another chance.
 */
export function isOpen(
  provider: WhatsAppProvider,
  instanceId: string,
): boolean {
  const key = stateKey(provider, instanceId);
  const state = circuitState[key];
  if (!state || state.state === "CLOSED") return false;

  // Auto-reset after timeout window
  if (Date.now() - state.lastFailure > TIMEOUT_MS) {
    circuitState[key] = { failures: 0, lastFailure: 0, state: "CLOSED" };
    console.info(
      `[CircuitBreaker] Provider ${provider}/${instanceId} auto-reset to CLOSED after timeout`,
    );
    return false;
  }

  return true;
}

/**
 * Returns the best available provider/instanceId pair given a primary and
 * optional fallback. Returns null when ALL providers are OPEN (message cannot
 * be sent — caller should return 503).
 */
export function getPreferredProvider(
  primaryProvider: WhatsAppProvider,
  primaryInstanceId: string,
  fallbackProvider?: WhatsAppProvider,
  fallbackInstanceId?: string,
): { provider: WhatsAppProvider; instanceId: string } | null {
  if (!isOpen(primaryProvider, primaryInstanceId)) {
    return { provider: primaryProvider, instanceId: primaryInstanceId };
  }

  console.warn(
    `[CircuitBreaker] Primary ${primaryProvider}/${primaryInstanceId} is OPEN — trying fallback`,
  );

  if (
    fallbackProvider &&
    fallbackInstanceId &&
    !isOpen(fallbackProvider, fallbackInstanceId)
  ) {
    return { provider: fallbackProvider, instanceId: fallbackInstanceId };
  }

  console.error(
    `[CircuitBreaker] All providers OPEN — message cannot be sent`,
  );
  return null;
}

/** Read-only snapshot of the current circuit state (for monitoring/logging). */
export function getCircuitSnapshot(): Record<string, CircuitState> {
  return { ...circuitState };
}
