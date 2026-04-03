import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function getPortalStorageKey(): string {
  const path = window.location.pathname;

  // For /reset-password, respect the ?portal= param so the recovery session
  // is stored under the same key the target portal will read.
  if (path.startsWith("/reset-password") || path.startsWith("/welcome")) {
    const portal = new URLSearchParams(window.location.search).get("portal");
    return portal === "franchise" ? "noe-franchise-auth" : "noe-saas-auth";
  }

  const isSaas =
    path.startsWith("/cliente") ||
    path.startsWith("/app") ||
    path === "/" ||
    path.startsWith("/landing") ||
    path.startsWith("/termos") ||
    path.startsWith("/privacidade");
  return isSaas ? "noe-saas-auth" : "noe-franchise-auth";
}

export const PORTAL_STORAGE_KEY = getPortalStorageKey();

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storageKey: getPortalStorageKey(),
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
