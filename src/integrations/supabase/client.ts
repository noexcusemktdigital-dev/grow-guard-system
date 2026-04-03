// ARCH-002: Re-exports the canonical portal-aware client from lib/supabase.ts.
// Do NOT create a second createClient() here — two clients = two auth sessions = diverging state.
// The canonical client handles portal isolation via storageKey (noe-saas-auth / noe-franchise-auth).
// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export { supabase } from '@/lib/supabase';