// FIN-004: Singleton Realtime channel manager
//
// Consolidates multiple Supabase Realtime postgres_changes subscriptions into
// ONE channel per organization. This reduces connection count (and therefore
// Supabase billing) when several components or hooks subscribe to different
// tables filtered by the same org/user ID.
//
// Usage example (replaces individual supabase.channel() calls in hooks/pages):
//
//   import { subscribeToTable } from '@/lib/realtimeManager';
//
//   useEffect(() => {
//     const unsub = subscribeToTable(orgId, 'whatsapp_messages', (payload) => {
//       queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
//     });
//     return unsub; // cleanup on unmount
//   }, [orgId]);
//
// MIGRATION NOTE: Existing pages/hooks that call supabase.channel() directly
// still work correctly — this manager is additive. Migrate gradually by
// replacing per-component channel() calls with subscribeToTable() for the same
// org-scoped tables.

import { supabase } from "./supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type AnyRecord = Record<string, unknown>;
type TableChangeHandler = (payload: RealtimePostgresChangesPayload<AnyRecord>) => void;

interface ManagedChannel {
  channel: ReturnType<typeof supabase.channel>;
  /** table → list of handlers */
  handlers: Map<string, TableChangeHandler[]>;
  /** Count of active subscriptions — channel is removed when this reaches 0. */
  refCount: number;
  /** Status listeners (e.g. for polling fallback when realtime drops). */
  statusListeners: Array<(status: string) => void>;
  /** Last known channel status, replayed to new listeners. */
  lastStatus?: string;
}

// Module-level singletons — one channel per "scope key" (org or user ID).
const managed: Map<string, ManagedChannel> = new Map();

function scopeKey(scopeId: string): string {
  return `noe-rt-${scopeId}`;
}

/**
 * Subscribe to postgres_changes on `table` filtered by the calling component's
 * org/user scope. Returns an unsubscribe function suitable for use in
 * useEffect cleanup.
 *
 * Multiple calls with the same `scopeId` share a single Realtime channel,
 * reducing connection overhead.
 *
 * @param scopeId     - organization_id or user_id used to namespace the channel
 * @param table       - Supabase table name to watch (e.g. 'whatsapp_messages')
 * @param handler     - Called on any INSERT / UPDATE / DELETE for this table
 * @param filterCol   - Column to filter on (defaults to 'organization_id')
 * @returns cleanup   - Call in useEffect return / component unmount
 */
export function subscribeToTable(
  scopeId: string,
  table: string,
  handler: TableChangeHandler,
  filterCol = "organization_id",
  onStatus?: (status: string) => void,
): () => void {
  if (!scopeId) {
    // Guard: don't create channels for unauthenticated renders
    return () => {};
  }

  const key = scopeKey(scopeId);

  if (!managed.has(key)) {
    // Create the shared channel for this scope
    const channel = supabase.channel(key);
    managed.set(key, {
      channel,
      handlers: new Map(),
      refCount: 0,
      statusListeners: [],
    });
  }

  const entry = managed.get(key)!;

  // Register status listener if provided (shared across all subscribers of this scope)
  if (onStatus) {
    entry.statusListeners.push(onStatus);
    // If channel already has a known status, fire immediately
    if (entry.lastStatus) onStatus(entry.lastStatus);
  }

  // Register handler
  if (!entry.handlers.has(table)) {
    entry.handlers.set(table, []);

    // Add a single postgres_changes listener for this table on the shared channel.
    entry.channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter: `${filterCol}=eq.${scopeId}`,
      },
      (payload: RealtimePostgresChangesPayload<AnyRecord>) => {
        const tableHandlers = entry.handlers.get(table) ?? [];
        for (const h of tableHandlers) {
          try {
            h(payload);
          } catch (err) {
            console.error(`[RealtimeManager] Handler error for table ${table}:`, err);
          }
        }
      },
    );
  }

  entry.handlers.get(table)!.push(handler);
  entry.refCount += 1;

  // Subscribe with status fan-out (idempotent — Supabase ignores re-subscribe)
  entry.channel.subscribe((status) => {
    entry.lastStatus = status;
    for (const listener of entry.statusListeners) {
      try { listener(status); } catch (err) {
        console.error("[RealtimeManager] Status listener error:", err);
      }
    }
  });

  // Return cleanup function
  return () => {
    const current = managed.get(key);
    if (!current) return;

    // Remove this specific handler
    const tableHandlers = current.handlers.get(table) ?? [];
    const idx = tableHandlers.indexOf(handler);
    if (idx !== -1) tableHandlers.splice(idx, 1);

    // Remove status listener if registered
    if (onStatus) {
      const sIdx = current.statusListeners.indexOf(onStatus);
      if (sIdx !== -1) current.statusListeners.splice(sIdx, 1);
    }

    current.refCount -= 1;

    // Tear down the channel only when no subscribers remain
    if (current.refCount <= 0) {
      supabase.removeChannel(current.channel);
      managed.delete(key);
    }
  };
}

/**
 * Force-remove ALL channels for a given scope (e.g. on logout).
 * Call this when the user's session ends to ensure clean teardown.
 */
export function unsubscribeAll(scopeId: string): void {
  const key = scopeKey(scopeId);
  const entry = managed.get(key);
  if (entry) {
    supabase.removeChannel(entry.channel);
    managed.delete(key);
  }
}

/** Diagnostic: returns active managed channel keys (for devtools/debug). */
export function getManagedChannelKeys(): string[] {
  return Array.from(managed.keys());
}
