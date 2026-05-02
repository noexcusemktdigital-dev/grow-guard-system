#!/usr/bin/env bash
#
# scripts/gen-supabase-types.sh
#
# Gera types TypeScript do schema Supabase do Sistema Noe.
# Roda contra o projeto remoto via Supabase CLI + API.
#
# Pre-requisito: `npx supabase login` ou variavel SUPABASE_ACCESS_TOKEN definida.
#
# Uso:
#   npm run types:supabase
#   SUPABASE_ACCESS_TOKEN=sbp_xxx npm run types:supabase

set -euo pipefail

PROJECT_ID="gxrhdpbbxfipeopdyygn"
OUTPUT="src/integrations/supabase/types.ts"

echo "[gen-types] Generating types for project ${PROJECT_ID}..."
npx supabase gen types typescript --project-id "${PROJECT_ID}" > "${OUTPUT}"
echo "[gen-types] Wrote ${OUTPUT}"
echo ""
echo "Usage examples:"
echo "  import type { Database } from '@/integrations/supabase/types';"
echo "  import type { Tables, TablesInsert, Enums } from '@/integrations/supabase/typed';"
echo ""
echo "  type Lead        = Tables<'crm_leads'>;"
echo "  type LeadInsert  = TablesInsert<'crm_leads'>;"
echo "  type Stage       = Enums<'lead_stage'>;"
