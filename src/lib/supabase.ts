// @ts-nocheck
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function getPortalStorageKey(): string {
  const path = window.location.pathname;
  const isSaas =
    path.startsWith("/cliente") ||
    path.startsWith("/app") ||
    path === "/" ||
    path.startsWith("/landing") ||
    path.startsWith("/termos") ||
    path.startsWith("/privacidade") ||
    path.startsWith("/reset-password");
  return isSaas ? "noe-saas-auth" : "noe-franchise-auth";
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storageKey: getPortalStorageKey(),
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
