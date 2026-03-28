import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaasFetch } from "./asaas-fetch.ts";

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

interface CustomerInput {
  orgId: string;
  name: string;
  cpfCnpj?: string | null;
  email?: string | null;
  phone?: string | null;
}

/**
 * Get or create an Asaas customer, preventing duplicates.
 * Flow:
 *  1. Check asaas_customer_id in organizations table
 *  2. If missing, search Asaas by externalReference (orgId)
 *  3. If not found, create customer (requires valid cpfCnpj)
 *  4. Save asaas_customer_id back to organizations
 */
export async function getOrCreateAsaasCustomer(
  adminClient: ReturnType<typeof createClient>,
  asaasApiKey: string,
  input: CustomerInput
): Promise<string> {
  const { orgId, name, cpfCnpj, email, phone } = input;

  // 1. Check DB
  const { data: org } = await adminClient
    .from("organizations")
    .select("asaas_customer_id")
    .eq("id", orgId)
    .single();

  if (org?.asaas_customer_id) {
    return org.asaas_customer_id;
  }

  // 2. Search Asaas by externalReference
  const searchRes = await asaasFetch(
    `${ASAAS_BASE}/customers?externalReference=${encodeURIComponent(orgId)}`,
    { headers: { access_token: asaasApiKey, "User-Agent": "NOE-Platform" } }
  );
  const searchData = await searchRes.json();

  if (searchData?.data?.length > 0) {
    const customerId = searchData.data[0].id;
    await adminClient
      .from("organizations")
      .update({ asaas_customer_id: customerId })
      .eq("id", orgId);
    return customerId;
  }

  // 3. Validate cpfCnpj
  if (!cpfCnpj || cpfCnpj.replace(/\D/g, "").length < 11) {
    throw new Error("CPF/CNPJ é obrigatório para gerar cobrança. Cadastre o documento da organização antes de prosseguir.");
  }

  // 4. Create customer
  const createRes = await asaasFetch(`${ASAAS_BASE}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
    body: JSON.stringify({
      name,
      cpfCnpj: cpfCnpj.replace(/\D/g, ""),
      email: email || undefined,
      phone: phone || undefined,
      externalReference: orgId,
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    console.error("Asaas customer creation failed:", createData);
    throw new Error(`Falha ao criar cliente no Asaas: ${JSON.stringify(createData.errors || createData)}`);
  }

  const customerId = createData.id;

  // 5. Save to DB
  await adminClient
    .from("organizations")
    .update({ asaas_customer_id: customerId })
    .eq("id", orgId);

  return customerId;
}

/**
 * Fetch PIX QR code with retry (Asaas may need time to generate after payment creation).
 */
export async function fetchPixQrCode(
  asaasApiKey: string,
  paymentId: string,
  retries = 2,
  delayMs = 1500
): Promise<{ encodedImage: string | null; payload: string | null }> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
      const res = await asaasFetch(`${ASAAS_BASE}/payments/${paymentId}/pixQrCode`, {
        headers: { access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
      });
      if (res.ok) {
        const data = await res.json();
        return { encodedImage: data.encodedImage || null, payload: data.payload || null };
      }
      const errBody = await res.text();
      console.warn(`[fetchPixQrCode] Attempt ${attempt + 1} failed (${res.status}): ${errBody}`);
    } catch (e: unknown) {
      console.warn(`[fetchPixQrCode] Attempt ${attempt + 1} error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { encodedImage: null, payload: null };
}

/**
 * Build split array for Asaas payment.
 * Calculates a weighted split percentage based on base value vs surplus.
 *
 * Rules:
 *   Base value  → 80% franqueadora, 20% franqueado
 *   Surplus     → 20% franqueadora, 80% franqueado
 *
 * The Asaas split sends the franqueadora's weighted % to her wallet;
 * the remainder stays with the franchisee (charge emitter).
 */
export async function buildSplitConfig(
  adminClient: ReturnType<typeof createClient>,
  orgId: string,
  baseValue: number,
  surplusValue: number = 0
): Promise<{ walletId: string; percentualValue: number }[] | null> {
  // Get org and parent
  const { data: org } = await adminClient
    .from("organizations")
    .select("id, parent_org_id, asaas_wallet_id")
    .eq("id", orgId)
    .single();

  if (!org?.parent_org_id) {
    // This is the matriz itself, no split needed
    return null;
  }

  // Get parent org's wallet ID
  const { data: parentOrg } = await adminClient
    .from("organizations")
    .select("asaas_wallet_id")
    .eq("id", org.parent_org_id)
    .single();

  if (!parentOrg?.asaas_wallet_id) {
    console.warn(`Parent org ${org.parent_org_id} has no asaas_wallet_id configured. Split skipped.`);
    return null;
  }

  const totalCharge = baseValue + surplusValue;
  if (totalCharge <= 0) return null;

  // Weighted calculation
  const franqueadoraFromBase = baseValue * 0.80;
  const franqueadoraFromSurplus = surplusValue * 0.20;
  const totalFranqueadora = franqueadoraFromBase + franqueadoraFromSurplus;
  const splitPercent = Math.round((totalFranqueadora / totalCharge) * 10000) / 100; // 2 decimal places

  console.log(`Split calc: base=${baseValue}, surplus=${surplusValue}, franqueadora%=${splitPercent}`);

  return [
    {
      walletId: parentOrg.asaas_wallet_id,
      percentualValue: splitPercent,
    },
  ];
}
