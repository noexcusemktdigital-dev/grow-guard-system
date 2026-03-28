import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { user_id, company_name, franchisee_org_id, referral_code } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ---- Validate caller matches user_id ----
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user: caller } } = await userClient.auth.getUser();
      if (caller && caller.id !== user_id) {
        return new Response(JSON.stringify({ error: "Forbidden: user_id does not match authenticated user" }), {
          status: 403,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
    }

    // Ensure profile exists before creating memberships
    let userExists = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", user_id)
        .maybeSingle();
      if (profile) {
        userExists = true;
        break;
      }

      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user_id);
      if (authUser?.user) {
        const fullName = typeof authUser.user.user_metadata?.full_name === "string"
          ? authUser.user.user_metadata.full_name
          : "";

        const { error: profileInsertError } = await supabaseAdmin
          .from("profiles")
          .insert({ id: user_id, full_name: fullName } as any);

        if (!profileInsertError || profileInsertError.code === "23505") {
          userExists = true;
          break;
        }

        console.warn("Failed to create missing profile during signup:", profileInsertError);
      }

      await new Promise((r) => setTimeout(r, 500));
    }
    if (!userExists) {
      console.error(`User ${user_id} not found in profiles after 5s`);
      return new Response(JSON.stringify({ error: "User not ready yet. Please try again." }), {
        status: 503,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Check if user already has a role (avoid duplicate provisioning)
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingRole) {
      return new Response(JSON.stringify({ message: "User already provisioned" }), {
        status: 200,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Resolve referral_code to franchisee org
    let resolvedParentOrgId: string | null = franchisee_org_id || null;
    let discountPercent = 0;
    let referralOrgId: string | null = null;

    if (referral_code && !resolvedParentOrgId) {
      const { data: referralData } = await supabaseAdmin
        .from("organizations")
        .select("id, referral_code")
        .eq("referral_code", referral_code)
        .maybeSingle();

      if (referralData) {
        resolvedParentOrgId = referralData.id;
        referralOrgId = referralData.id;

        const { data: discountData } = await supabaseAdmin
          .from("referral_discounts")
          .select("discount_percent, is_active")
          .eq("organization_id", referralData.id)
          .eq("is_active", true)
          .maybeSingle();

        if (discountData) {
          discountPercent = discountData.discount_percent || 5;
          await supabaseAdmin.rpc("increment_referral_uses", { _org_id: referralData.id }).catch(() => {
            supabaseAdmin
              .from("referral_discounts")
              .update({ uses_count: (discountData as any).uses_count + 1 } as any)
              .eq("organization_id", referralData.id);
          });
        } else {
          discountPercent = 5;
        }

        console.log(`Referral resolved: code=${referral_code}, org=${referralData.id}, discount=${discountPercent}%`);
      }
    }

    // 1. Create organization
    const orgPayload: any = {
      name: company_name || "Minha Empresa",
      type: "cliente",
    };
    if (resolvedParentOrgId) {
      orgPayload.parent_org_id = resolvedParentOrgId;
    }

    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert(orgPayload)
      .select("id")
      .single();

    if (orgError) throw orgError;

    // 2. Create organization membership
    const { error: memberError } = await supabaseAdmin
      .from("organization_memberships")
      .insert({ user_id, organization_id: org.id, role: "cliente_admin" });

    if (memberError) throw memberError;

    // 3. Create user role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id, role: "cliente_admin" });

    if (roleError) throw roleError;

    // 4. Create trial subscription (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const subPayload: any = {
      organization_id: org.id,
      plan: "trial",
      status: "active",
      expires_at: expiresAt.toISOString(),
    };
    if (discountPercent > 0) {
      subPayload.discount_percent = discountPercent;
    }
    if (referralOrgId) {
      subPayload.referral_org_id = referralOrgId;
    }

    const { error: subError } = await supabaseAdmin
      .from("subscriptions")
      .insert(subPayload);

    if (subError) throw subError;

    // 5. Create credit wallet (200 credits for trial)
    const { error: walletError } = await supabaseAdmin
      .from("credit_wallets")
      .insert({ organization_id: org.id, balance: 200 });

    if (walletError) throw walletError;

    // 6. Auto-provision WhatsApp instance via IZITECH
    let whatsappProvisioned = false;
    try {
      const izitechKey = Deno.env.get("IZITECH_CROSS_API_KEY") || "";
      if (izitechKey) {
        const instanceName = (company_name || "empresa")
          .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").substring(0, 30);
        const noeWebhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook/${org.id}`;

        const izitechRes = await fetch(
          "https://mdmhsqcfmpyufohxjsrv.supabase.co/functions/v1/provision-instance",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": izitechKey },
            body: JSON.stringify({
              action: "create",
              instance_name: instanceName,
              customer_webhook_url: noeWebhookUrl,
            }),
            signal: AbortSignal.timeout(25000),
          }
        );

        const provisionData = await izitechRes.json().catch(() => ({}));

        if (provisionData.success && provisionData.instance) {
          // Save instance reference in NOE DB
          await supabaseAdmin.from("whatsapp_instances").upsert({
            organization_id: org.id,
            instance_id: instanceName,
            label: company_name || instanceName,
            provider: "evolution",
            status: "pending",
            webhook_url: noeWebhookUrl,
            base_url: "https://evo.grupolamadre.com.br",
            token: "managed-by-izitech",
            client_token: "managed-by-izitech",
          }, { onConflict: "organization_id,instance_id" });
          whatsappProvisioned = true;
          console.log(`WhatsApp auto-provisioned: instance=${instanceName}, org=${org.id}`);
        } else {
          console.warn(`WhatsApp auto-provision failed: ${provisionData.error || "unknown"}`);
        }
      }
    } catch (e) {
      // Non-blocking — user can set up WhatsApp manually later
      console.warn("WhatsApp auto-provision error (non-blocking):", e.message || e);
    }

    console.log(`SaaS signup: org=${org.id}, parent=${resolvedParentOrgId || 'none'}, referral=${referral_code || 'none'}, discount=${discountPercent}%, whatsapp=${whatsappProvisioned}`);

    return new Response(
      JSON.stringify({
        success: true,
        organization_id: org.id,
        referral_applied: !!referral_code && !!resolvedParentOrgId,
        discount_percent: discountPercent,
        whatsapp_provisioned: whatsappProvisioned,
      }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("signup-saas error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
