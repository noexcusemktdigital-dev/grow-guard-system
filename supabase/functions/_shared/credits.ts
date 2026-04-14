import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Verifica se a organização já completou o primeiro GPS.
 * Enquanto não completou, nenhum crédito deve ser debitado.
 */
export async function hasCompletedGPS(orgId: string, serviceRoleKey: string, supabaseUrl: string): Promise<boolean> {
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data } = await adminClient
    .from("marketing_strategies")
    .select("id")
    .eq("organization_id", orgId)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();
  return !!data;
}

/**
 * Debita créditos apenas se o GPS já foi concluído.
 * Retorna true se debitou, false se pulou (GPS não feito).
 */
export async function debitIfGPSDone(
  adminClient: ReturnType<typeof createClient>,
  orgId: string,
  amount: number,
  description: string,
  source: string,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<boolean> {
  const done = await hasCompletedGPS(orgId, serviceRoleKey, supabaseUrl);
  if (!done) return false;

  await adminClient.rpc("debit_credits", {
    _org_id: orgId,
    _amount: amount,
    _description: description,
    _source: source,
  });
  return true;
}
