// ARCH-002: Canonical Supabase client for data access (NOT for OAuth handoff).
//
// storageKey is derived from window.location.pathname to isolate sessions between
// the two portals (SaaS at /cliente/* and Franchise at /admin/* etc.) that share
// the same domain. This is intentional — do NOT collapse to a single key without
// verifying that portal session isolation is no longer required.
//
// SSR / test safety: getPortalStorageKey() guards against environments where
// `window` is not available and falls back to 'noe-saas-auth'.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ARCH-002: Guard against SSR/test environments where window is not defined.
function getPortalStorageKey(): string {
  // SSR / Vitest / non-browser environments
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return "noe-saas-auth";
  }

  const path = window.location.pathname;

  // For /reset-password, /welcome, /apresentacao — respect the ?portal= query param
  // so the recovery session is stored under the same key the target portal will read.
  if (
    path.startsWith("/reset-password") ||
    path.startsWith("/welcome") ||
    path.startsWith("/apresentacao")
  ) {
    const portal = new URLSearchParams(window.location.search).get("portal");
    return portal === "franchise" ? "noe-franchise-auth" : "noe-saas-auth";
  }

  const isSaas =
    path.startsWith("/cliente") ||
    path === "/" ||
    path.startsWith("/crescimento") ||
    path.startsWith("/termos") ||
    path.startsWith("/privacidade");

  return isSaas ? "noe-saas-auth" : "noe-franchise-auth";
}

export const PORTAL_STORAGE_KEY = getPortalStorageKey();

// Guard against SSR for localStorage reference
const _storage =
  typeof window !== "undefined" && typeof localStorage !== "undefined"
    ? localStorage
    : undefined;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storageKey: getPortalStorageKey(),
    storage: _storage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
