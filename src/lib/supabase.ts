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

// ARCH-002 / ARCH-003: Guard against SSR/test environments where window is not defined.
// Explicit portal routes must always win over any previously stored token key;
// otherwise a stale SaaS token can force the franchise portal into a reload loop.
function getPortalStorageKey(): string {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return "noe-saas-auth";
  }

  const path = window.location.pathname;

  const isExplicitFranchiseRoute =
    path.startsWith("/franqueadora") ||
    path.startsWith("/franqueado") ||
    path.startsWith("/acessofranquia");

  if (isExplicitFranchiseRoute) {
    return "noe-franchise-auth";
  }

  const isExplicitSaasRoute =
    path.startsWith("/cliente") ||
    path === "/" ||
    path.startsWith("/crescimento") ||
    path.startsWith("/termos") ||
    path.startsWith("/privacidade");

  if (isExplicitSaasRoute) {
    return "noe-saas-auth";
  }

  // For /reset-password, /welcome, /apresentacao — respect the ?portal= query param
  // so the recovery session is stored under the same key the target portal will read.
  if (
    path.startsWith("/reset-password") ||
    path.startsWith("/welcome") ||
    path.startsWith("/apresentacao")
  ) {
    const portal = new URLSearchParams(window.location.search).get("portal");
    if (portal === "franchise") return "noe-franchise-auth";
    if (portal === "saas") return "noe-saas-auth";
  }

  if (typeof localStorage !== "undefined") {
    const hasFranchise = !!localStorage.getItem("noe-franchise-auth");
    const hasSaas = !!localStorage.getItem("noe-saas-auth");
    if (hasFranchise && !hasSaas) return "noe-franchise-auth";
    if (hasSaas && !hasFranchise) return "noe-saas-auth";
  }

  return "noe-saas-auth";
}

export const PORTAL_STORAGE_KEY = getPortalStorageKey();

// Guard against SSR for localStorage reference
const _storage =
  typeof window !== "undefined" && typeof localStorage !== "undefined"
    ? localStorage
    : undefined;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storageKey: PORTAL_STORAGE_KEY,
    storage: _storage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
