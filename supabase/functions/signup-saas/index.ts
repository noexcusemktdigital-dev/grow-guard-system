// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { parseOrThrow, validationErrorResponse } from "../_shared/schemas.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// signup-saas has 3 modes (resend_only, legacy user_id, new email+password)
// Permissive schema validates common known fields, allows extra fields through
const SignupSaasBodySchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  full_name: z.string().max(300).optional(),
  company_name: z.string().max(300).optional(),
  referral_code: z.string().max(100).optional(),
  user_id: z.string().optional(),
  resend_only: z.boolean().optional(),
}).passthrough();

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "NoExcuse Digital <noreply@noexcusedigital.com.br>";

function buildConfirmationHtml(confirmationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Inter',Arial,sans-serif;">
  <div style="padding:40px 25px;max-width:560px;margin:0 auto;">
    <img src="https://gxrhdpbbxfipeopdyygn.supabase.co/storage/v1/object/public/email-assets/logo-noexcuse.png" alt="NoExcuse Digital" width="160" style="margin:0 0 24px;display:block;" />
    <h1 style="font-size:22px;font-weight:bold;color:#141a24;margin:0 0 20px;">Confirme seu e-mail</h1>
    <p style="font-size:14px;color:#6c7280;line-height:1.6;margin:0 0 25px;">
      Obrigado por se cadastrar na <strong>NoExcuse Digital</strong>! Clique no botão abaixo para confirmar seu e-mail e ativar sua conta.
    </p>
    <a href="${confirmationUrl}" style="display:inline-block;background-color:#E2233B;color:#ffffff;font-size:14px;border-radius:12px;padding:12px 24px;text-decoration:none;font-weight:500;">
      Confirmar meu e-mail
    </a>
    <p style="font-size:12px;color:#999999;margin:30px 0 0;">
      Se você não criou esta conta, pode ignorar este e-mail com segurança.
    </p>
  </div>
</body>
</html>`;
}

async function sendConfirmationEmail(email: string, confirmationUrl: string, resendApiKey: string): Promise<void> {
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [email],
      subject: "Confirme seu e-mail — NoExcuse Digital",
      html: buildConfirmationHtml(confirmationUrl),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("[signup-saas] Resend error:", res.status, body);
    throw new Error("Failed to send confirmation email");
  }
}

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'signup-saas');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL") || "https://sistema.noexcusedigital.com.br";
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    if (!resendApiKey) {
      console.error("[signup-saas] RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Configuração de e-mail não encontrada" }), { headers });
    }

    let body: z.infer<typeof SignupSaasBodySchema>;
    try {
      const raw = await req.json();
      body = parseOrThrow(SignupSaasBodySchema, raw);
    } catch (err) {
      const vr = validationErrorResponse(err, headers);
      if (vr) return vr;
      return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers });
    }

    // ---- RESEND ONLY MODE (re-send confirmation email) ----
    if (body.resend_only && body.email) {
      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email: body.email,
        options: { redirectTo: `${siteUrl}/app` },
      });

      if (linkErr || !linkData?.properties?.action_link) {
        console.error("[signup-saas] resend generateLink error:", linkErr);
        // Don't reveal if user exists
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      await sendConfirmationEmail(body.email, linkData.properties.action_link, resendApiKey);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // ---- LEGACY MODE (called with user_id from old frontend or Google OAuth) ----
    if (body.user_id) {
      return await handleLegacyProvisioning(supabaseAdmin, body, headers, supabaseUrl, req);
    }

    // ---- NEW SIGNUP MODE (email + password + full_name) ----
    const { email, password, full_name, company_name, referral_code } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email e senha são obrigatórios" }), { headers });
    }

    // 1. Create user via Admin API (no confirmation email sent)
    const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: full_name || "", signup_source: "saas" },
    });

    if (createErr) {
      // User already exists
      if (createErr.message?.includes("already") || createErr.message?.includes("exists") || (createErr as any).status === 422) {
        // Try to resend confirmation for unconfirmed users
        try {
          const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
            type: "signup",
            email,
            options: { redirectTo: `${siteUrl}/app` },
          });
          if (linkData?.properties?.action_link) {
            await sendConfirmationEmail(email, linkData.properties.action_link, resendApiKey);
          }
        } catch (e) {
          console.warn("[signup-saas] Failed to resend confirmation for existing user:", e);
        }
        return new Response(JSON.stringify({ error: "email_exists" }), { headers });
      }
      console.error("[signup-saas] createUser error:", createErr);
      return new Response(JSON.stringify({ error: createErr.message }), { headers });
    }

    const user = createData.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Erro ao criar usuário" }), { headers });
    }

    // 2. Generate confirmation link
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      options: { redirectTo: `${siteUrl}/app` },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      console.error("[signup-saas] generateLink error:", linkErr);
      // User was created but link failed — still continue with provisioning
    } else {
      // 3. Send branded confirmation email via Resend
      try {
        await sendConfirmationEmail(email, linkData.properties.action_link, resendApiKey);
      } catch (e) {
        console.error("[signup-saas] Failed to send confirmation email:", e);
      }
    }

    // 4. Ensure profile exists
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: user.id, full_name: full_name || "" } as Record<string, unknown>, { onConflict: "id" });
    if (profileErr) console.warn("[signup-saas] profile upsert warning:", profileErr);

    // 5. Save terms acceptance
    try {
      await supabaseAdmin.from("profiles").update({ accepted_terms_at: new Date().toISOString() } as Record<string, unknown>).eq("id", user.id);
    } catch { /* profile terms timestamp is best effort */ }

    // 6. Provision org/subscription/wallet (same logic as before)
    return await provisionUser(supabaseAdmin, user.id, company_name || (full_name ? full_name + "'s Company" : "Minha Empresa"), referral_code, headers, supabaseUrl);

  } catch (error) {
    console.error("signup-saas error:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers });
  }
});

// Legacy provisioning (called with user_id from Google OAuth flow)
async function handleLegacyProvisioning(
  supabaseAdmin: any, body: any, headers: Record<string, string>, supabaseUrl: string,
  req: Request
): Promise<Response> {
  const { company_name, referral_code } = body;

  // SEC-FIX API-003: user_id MUST come from the verified JWT — never from the request body.
  // This prevents IDOR where an attacker supplies an arbitrary user_id to hijack provisioning.
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  if (!token) {
    return new Response(JSON.stringify({ error: "Authorization required" }), { status: 401, headers });
  }
  const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !callerUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
  }
  // user_id is authoritative from the JWT — body.user_id is ignored entirely
  const user_id = callerUser.id;

  // Ensure profile exists
  let userExists = false;
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("id").eq("id", user_id).maybeSingle();
    if (profile) { userExists = true; break; }

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (authUser?.user) {
      const fullName = typeof authUser.user.user_metadata?.full_name === "string"
        ? authUser.user.user_metadata.full_name : "";
      const { error: profileInsertError } = await supabaseAdmin
        .from("profiles").insert({ id: user_id, full_name: fullName } as Record<string, unknown>);
      if (!profileInsertError || profileInsertError.code === "23505") { userExists = true; break; }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!userExists) {
    return new Response(JSON.stringify({ error: "User not ready yet. Please try again." }), { status: 200, headers });
  }

  return await provisionUser(supabaseAdmin, user_id, company_name || "Minha Empresa", referral_code, headers, supabaseUrl);
}

// Shared provisioning logic
async function provisionUser(
  supabaseAdmin: any, userId: string, companyName: string,
  referralCode: string | undefined, headers: Record<string, string>, supabaseUrl: string
): Promise<Response> {
  // Idempotency: try to insert role first
  const { data: insertedRole } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: userId, role: "cliente_admin" } as Record<string, unknown>)
    .select("id").maybeSingle();

  if (!insertedRole) {
    const { data: existingMembership } = await supabaseAdmin
      .from("organization_memberships").select("organization_id").eq("user_id", userId).maybeSingle();
    return new Response(JSON.stringify({
      success: true, message: "User already provisioned",
      organization_id: existingMembership?.organization_id || null,
    }), { headers });
  }

  // Resolve referral
  let resolvedParentOrgId: string | null = null;
  let discountPercent = 0;
  let referralOrgId: string | null = null;

  if (referralCode) {
    const { data: referralData } = await supabaseAdmin
      .from("organizations").select("id, referral_code").eq("referral_code", referralCode).maybeSingle();
    if (referralData) {
      resolvedParentOrgId = referralData.id;
      referralOrgId = referralData.id;
      const { data: discountData } = await supabaseAdmin
        .from("referral_discounts").select("discount_percent, is_active")
        .eq("organization_id", referralData.id).eq("is_active", true).maybeSingle();
      if (discountData) {
        discountPercent = discountData.discount_percent || 5;
        await supabaseAdmin.rpc("increment_referral_uses", { _org_id: referralData.id }).catch(() => {});
      } else {
        discountPercent = 5;
      }
    }
  }

  // Create organization
  const orgPayload: Record<string, unknown> = { name: companyName, type: "cliente", onboarding_completed: false };
  if (resolvedParentOrgId) orgPayload.parent_org_id = resolvedParentOrgId;

  const { data: org, error: orgError } = await supabaseAdmin
    .from("organizations").insert(orgPayload).select("id").single();
  if (orgError) throw orgError;

  // Create membership
  await supabaseAdmin.from("organization_memberships")
    .insert({ user_id: userId, organization_id: org.id, role: "cliente_admin" });

  // Create trial subscription (7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const subPayload: Record<string, unknown> = {
    organization_id: org.id, plan: "trial", status: "active", expires_at: expiresAt.toISOString(),
  };
  if (discountPercent > 0) subPayload.discount_percent = discountPercent;
  if (referralOrgId) subPayload.referral_org_id = referralOrgId;
  await supabaseAdmin.from("subscriptions").insert(subPayload);

  // Create credit wallet
  await supabaseAdmin.from("credit_wallets").insert({ organization_id: org.id, balance: 200 });

  // Auto-provision WhatsApp instance
  let whatsappProvisioned = false;
  try {
    const izitechKey = Deno.env.get("IZITECH_CROSS_API_KEY") || "";
    if (izitechKey) {
      const instanceName = (companyName || "empresa")
        .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").substring(0, 30);
      const noeWebhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook/${org.id}`;
      const izitechRes = await fetch(
        "https://mdmhsqcfmpyufohxjsrv.supabase.co/functions/v1/provision-instance",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": izitechKey },
          body: JSON.stringify({ action: "create", instance_name: instanceName, customer_webhook_url: noeWebhookUrl }),
          signal: AbortSignal.timeout(25000),
        }
      );
      const provisionData = await izitechRes.json().catch(() => ({}));
      if (provisionData.success && provisionData.instance) {
        await supabaseAdmin.from("whatsapp_instances").upsert({
          organization_id: org.id, instance_id: instanceName, label: companyName || instanceName,
          provider: "evolution", status: "pending", webhook_url: noeWebhookUrl,
          base_url: "https://evo.grupolamadre.com.br", token: "managed-by-izitech", client_token: "managed-by-izitech",
        }, { onConflict: "organization_id,instance_id" });
        whatsappProvisioned = true;
      }
    }
  } catch (e) {
    console.warn("WhatsApp auto-provision error (non-blocking):", e.message || e);
  }

  console.log(`SaaS signup: user=${userId}, org=${org.id}, referral=${referralCode || 'none'}, discount=${discountPercent}%, whatsapp=${whatsappProvisioned}`);

  return new Response(JSON.stringify({
    success: true, organization_id: org.id, user_id: userId,
    referral_applied: !!referralCode && !!resolvedParentOrgId,
    discount_percent: discountPercent, whatsapp_provisioned: whatsappProvisioned,
  }), { headers });
}
