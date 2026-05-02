// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaasFetch } from "../_shared/asaas-fetch.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { assertOrgMember, authErrorResponse } from '../_shared/auth.ts';

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

async function fetchAllPages(baseUrl: string, apiKey: string): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const url = `${baseUrl}${sep}limit=100&offset=${offset}`;
    const res = await asaasFetch(url, { headers: { access_token: apiKey, "User-Agent": "NOE-Platform" } });
    const data = await res.json();
    const items = data.data ?? [];
    all.push(...items);
    hasMore = data.hasMore === true && items.length > 0;
    offset += 100;
  }
  return all;
}

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'asaas-list-payments');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    console.log("[asaas-list-payments] Request received:", req.method);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth via getUser
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[asaas-list-payments] No auth header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("[asaas-list-payments] Auth failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { organization_id, network, all, startDate, endDate, status: statusFilter } = await req.json();

    // ── MODE: all ── fetch ALL payments from the account with full pagination
    if (all) {
      let url = `${ASAAS_BASE}/payments?`;
      const params: string[] = [];
      if (startDate) params.push(`dateCreated[ge]=${startDate}`);
      if (endDate) params.push(`dateCreated[le]=${endDate}`);
      if (statusFilter) params.push(`status=${statusFilter}`);
      url += params.join("&");

      const rawPayments = await fetchAllPages(url, asaasApiKey);
      console.log(`[asaas-list-payments] Fetched ${rawPayments.length} payments (all mode)`);

      const uniqueCustomerIds = [...new Set(rawPayments.map((p: Record<string, unknown>) => p.customer as string).filter(Boolean))] as string[];
      const customerNameMap: Record<string, string> = {};
      await Promise.all(
        uniqueCustomerIds.map(async (custId) => {
          try {
            const custRes = await asaasFetch(`${ASAAS_BASE}/customers/${custId}`, {
              headers: { access_token: asaasApiKey, "User-Agent": "NOE-Platform" },
            });
            const custData = await custRes.json();
            customerNameMap[custId] = custData.name || custData.company || custId;
          } catch {
            customerNameMap[custId] = custId;
          }
        })
      );

      const allPayments = rawPayments.map((p: Record<string, unknown>) => ({
        id: p.id, value: p.value, netValue: p.netValue ?? p.value,
        status: p.status,
        dueDate: p.dueDate, paymentDate: p.paymentDate,
        billingType: p.billingType, description: p.description,
        invoiceUrl: p.invoiceUrl, bankSlipUrl: p.bankSlipUrl,
        pixQrCode: p.pixQrCodeUrl,
        externalReference: p.externalReference || null,
        orgName: customerNameMap[p.customer as string] || "",
        orgId: null, customerAsaasId: p.customer,
      }));

      allPayments.sort((a, b) => ((b.dueDate as string) || "").localeCompare((a.dueDate as string) || ""));

      return new Response(JSON.stringify({ payments: allPayments }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── MODE: network ──
    if (!organization_id) {
      return new Response(JSON.stringify({ error: "organization_id required" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // BOLA/IDOR guard: ensure caller belongs to the target org
    await assertOrgMember(adminClient, user.id, organization_id);
    let orgsToQuery: { id: string; name: string; asaas_customer_id: string }[] = [];

    if (network) {
      const { data: allOrgs } = await adminClient
        .from("organizations")
        .select("id, name, asaas_customer_id")
        .or(`id.eq.${organization_id},parent_org_id.eq.${organization_id}`);
      orgsToQuery = (allOrgs || []).filter((o: { id: string; name: string; asaas_customer_id: string }) => o.asaas_customer_id);
    } else {
      const { data: org } = await adminClient
        .from("organizations")
        .select("id, name, asaas_customer_id")
        .eq("id", organization_id)
        .single();
      if (org?.asaas_customer_id) orgsToQuery = [org];
    }

    if (orgsToQuery.length === 0) {
      return new Response(JSON.stringify({ payments: [] }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const allPayments: Record<string, unknown>[] = [];
    await Promise.all(
      orgsToQuery.map(async (org) => {
        let url = `${ASAAS_BASE}/payments?customer=${org.asaas_customer_id}`;
        if (startDate) url += `&dateCreated[ge]=${startDate}`;
        if (endDate) url += `&dateCreated[le]=${endDate}`;
        try {
          const items = await fetchAllPages(url, asaasApiKey);
          for (const p of items) {
            allPayments.push({
              id: p.id, value: p.value, netValue: p.netValue ?? p.value,
              status: p.status,
              dueDate: p.dueDate, paymentDate: p.paymentDate,
              billingType: p.billingType, description: p.description,
              invoiceUrl: p.invoiceUrl, bankSlipUrl: p.bankSlipUrl,
              pixQrCode: p.pixQrCodeUrl,
              externalReference: p.externalReference || null,
              orgName: org.name, orgId: org.id,
              customerAsaasId: org.asaas_customer_id,
            });
          }
        } catch (e: unknown) {
          console.error(`Error fetching payments for org ${org.id}:`, e);
        }
      })
    );

    allPayments.sort((a, b) => ((b.dueDate as string) || "").localeCompare((a.dueDate as string) || ""));

    return new Response(JSON.stringify({ payments: allPayments }), {
      headers: { ...withCorrelationHeader(ctx, getCorsHeaders(req)), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    log.error("asaas-list-payments error", { error: String(err) });
    return authErrorResponse(err, getCorsHeaders(req));
  }
});
