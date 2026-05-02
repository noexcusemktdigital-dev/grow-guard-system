// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'asaas-test-connection');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  try {
    // Auth check
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // --- Diagnostic: collect all variables ---
    const rawApiKey = Deno.env.get("ASAAS_API_KEY") || "";
    const asaasApiKey = rawApiKey.trim();
    const configuredBaseUrl = Deno.env.get("ASAAS_BASE_URL") || "(not set)";
    const hardcodedProdUrl = "https://api.asaas.com/v3";
    const testUrl = `${hardcodedProdUrl}/customers?limit=1`;

    const diagnostics = {
      configured_base_url: configuredBaseUrl,
      test_url_used: testUrl,
      key_length: asaasApiKey.length,
      key_prefix: asaasApiKey.substring(0, 20),
      key_suffix: asaasApiKey.substring(asaasApiKey.length - 10),
      key_has_whitespace: rawApiKey !== asaasApiKey,
      raw_key_length: rawApiKey.length,
    };

    console.log("[asaas-test] Diagnostics:", JSON.stringify(diagnostics));

    // --- Direct fetch (no proxy, no helper) ---
    const requestHeaders: Record<string, string> = {
      "access_token": asaasApiKey,
      "User-Agent": "NOE-Platform",
    };

    console.log("[asaas-test] Request headers:", JSON.stringify(
      Object.fromEntries(Object.entries(requestHeaders).map(([k, v]) => [k, k === "access_token" ? v.substring(0, 20) + "..." : v]))
    ));

    const res = await fetch(testUrl, { headers: requestHeaders });
    const rawBody = await res.text();

    console.log("[asaas-test] Response status:", res.status);
    console.log("[asaas-test] Response body (raw):", rawBody.substring(0, 500));

    // Parse response
    let parsed: { errors?: { code?: string }[]; totalCount?: number; data?: { name?: string }[] } | null = null;
    try { parsed = JSON.parse(rawBody); } catch { /* not JSON */ }

    // Detect error codes
    let errorCode: string | null = null;
    let errorHint: string | null = null;
    const ERROR_MAP: Record<string, string> = {
      invalid_environment: "Chave de API do ambiente errado (sandbox vs produção)",
      access_token_not_found: "Header access_token não enviado ou vazio",
      invalid_access_token_format: "Formato da chave de API inválido",
      invalid_access_token: "Chave de API revogada ou inválida",
      not_allowed_ip: "IP não autorizado na conta Asaas",
    };
    if (!res.ok && (parsed?.errors?.length ?? 0) > 0) {
      errorCode = parsed!.errors![0]?.code || null;
      errorHint = errorCode ? (ERROR_MAP[errorCode] || null) : null;
    }

    return new Response(
      JSON.stringify({
        connected: res.ok,
        status: res.status,
        diagnostics,
        customer_count: parsed?.totalCount ?? null,
        first_customer: parsed?.data?.[0]?.name ?? null,
        error_code: errorCode,
        error_hint: errorHint,
        raw_response: rawBody.substring(0, 300),
      }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[asaas-test] Fatal error:", errMsg);
    return new Response(
      JSON.stringify({ connected: false, error: errMsg }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
