/**
 * typed.ts — Helper types para o cliente Supabase tipado do Sistema Noe.
 *
 * Gerado automaticamente a partir de `Database` (types.ts).
 * Nao editar types.ts manualmente — rodar `npm run types:supabase` apos migrations.
 *
 * Uso:
 *   import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/typed';
 *
 *   type Lead        = Tables<'crm_leads'>;
 *   type LeadInsert  = TablesInsert<'crm_leads'>;
 *   type LeadPatch   = TablesUpdate<'crm_leads'>;
 *   type Stage       = Enums<'lead_stage'>;
 */

import type { Database } from './types';

/** Row completo de uma tabela publica. */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/** Payload para INSERT em uma tabela publica. */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/** Payload para UPDATE em uma tabela publica. */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/** Valor de um enum publico do banco. */
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
