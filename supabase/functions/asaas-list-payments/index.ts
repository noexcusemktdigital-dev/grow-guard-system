import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { asaasFetch } from "../_shared/asaas-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_BASE = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("[asaas-list-payments] Auth failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { organization_id, network, all, startDate, endDate } = await req.json();

    // ── MODE: all ── fetch ALL payments from the account
    if (all) {
      let url = `${ASAAS_BASE}/payments?limit=100&offset=0`;
      if (startDate) url += `&dateCreated[ge]=${startDate}`;
      if (endDate) url += `&dateCreated[le]=${endDate}`;

      const res = await asaasFetch(url, { headers: { access_token: asaasApiKey } });
      const data = await res.json();
      const rawPayments = data.data ?? [];

      const uniqueCustomerIds = [...new Set(rawPayments.map((p: any) => p.customer).filter(Boolean))] as string[];
      const customerNameMap: Record<string, string> = {};
      await Promise.all(
        uniqueCustomerIds.map(async (custId) => {
          try {
            const custRes = await asaasFetch(`${ASAAS_BASE}/customers/${custId}`, {
              headers: { access_token: asaasApiKey },
            });
            const custData = await custRes.json();
            customerNameMap[custId] = custData.name || custData.company || custId;
          } catch {
            customerNameMap[custId] = custId;
          }
        })
      );

      const allPayments = rawPayments.map((p: any) => ({
        id: p.id, value: p.value, status: p.status,
        dueDate: p.dueDate, paymentDate: p.paymentDate,
        billingType: p.billingType, description: p.description,
        invoiceUrl: p.invoiceUrl, bankSlipUrl: p.bankSlipUrl,
        pixQrCode: p.pixQrCodeUrl,
        orgName: customerNameMap[p.customer] || "",
        orgId: null, customerAsaasId: p.customer,
      }));

      allPayments.sort((a: any, b: any) => (b.dueDate || "").localeCompare(a.dueDate || ""));

      return new Response(JSON.stringify({ payments: allPayments }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── MODE: network ──
    if (!organization_id) {
      return new Response(JSON.stringify({ error: "organization_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    let orgsToQuery: { id: string; name: string; asaas_customer_id: string }[] = [];

    if (network) {
      const { data: allOrgs } = await adminClient
        .from("organizations")
        .select("id, name, asaas_customer_id")
        .or(`id.eq.${organization_id},parent_org_id.eq.${organization_id}`);
      orgsToQuery = (allOrgs || []).filter((o: any) => o.asaas_customer_id);
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allPayments: any[] = [];
    await Promise.all(
      orgsToQuery.map(async (org) => {
        let url = `${ASAAS_BASE}/payments?customer=${org.asaas_customer_id}&limit=100&offset=0`;
        if (startDate) url += `&dateCreated[ge]=${startDate}`;
        if (endDate) url += `&dateCreated[le]=${endDate}`;
        try {
          const res = await asaasFetch(url, { headers: { access_token: asaasApiKey } });
          const data = await res.json();
          for (const p of data.data ?? []) {
            allPayments.push({
              id: p.id, value: p.value, status: p.status,
              dueDate: p.dueDate, paymentDate: p.paymentDate,
              billingType: p.billingType, description: p.description,
              invoiceUrl: p.invoiceUrl, bankSlipUrl: p.bankSlipUrl,
              pixQrCode: p.pixQrCodeUrl, orgName: org.name, orgId: org.id,
            });
          }
        } catch (e: any) {
          console.error(`Error fetching payments for org ${org.id}:`, e);
        }
      })
    );

    allPayments.sort((a, b) => (b.dueDate || "").localeCompare(a.dueDate || ""));

    return new Response(JSON.stringify({ payments: allPayments }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("asaas-list-payments error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
