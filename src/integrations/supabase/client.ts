// ARCH-002: OAuth Transfer Client (INTENCIONAL — leia antes de alterar)
//
// Este client usa a storageKey PADRÃO do Supabase (sb-{project}-auth-token).
// Quando o Google OAuth redireciona o usuário de volta ao app, a sessão é gravada
// nesta chave padrão. O AuthContext detecta isso, transfere a sessão para a chave
// do portal correto (noe-saas-auth / noe-franchise-auth) via lib/supabase.ts,
// e faz signOut local deste client para limpar a chave padrão.
//
// NÃO use este client em componentes/hooks de dados — use lib/supabase.ts.
// O único consumidor legítimo fora do AuthContext é componentes de auth flow.
//
// Import the supabase client like this:
// import { supabase } from "@/lib/supabase";   ← para dados
// import { supabase } from "@/integrations/supabase/client"; ← APENAS auth context

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// storageKey padrão (undefined = usa sb-{project}-auth-token)
// necessário para capturar sessões OAuth antes da transferência para chave do portal
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: false, // desabilitado — este client é só para OAuth handoff, não para uso contínuo
  }
});