import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_id, company_name, franchisee_org_id, referral_code } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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

        // Get discount config
        const { data: discountData } = await supabaseAdmin
          .from("referral_discounts")
          .select("discount_percent, is_active")
          .eq("organization_id", referralData.id)
          .eq("is_active", true)
          .maybeSingle();

        if (discountData) {
          discountPercent = discountData.discount_percent || 5;
          // Increment uses_count
          await supabaseAdmin.rpc("increment_referral_uses", { _org_id: referralData.id }).catch(() => {
            // Fallback: direct update
            supabaseAdmin
              .from("referral_discounts")
              .update({ uses_count: (discountData as any).uses_count + 1 } as any)
              .eq("organization_id", referralData.id);
          });
        } else {
          discountPercent = 5; // Default 5% even if no config row
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

    console.log(`SaaS signup: org=${org.id}, parent=${resolvedParentOrgId || 'none'}, referral=${referral_code || 'none'}, discount=${discountPercent}%`);

    return new Response(
      JSON.stringify({
        success: true,
        organization_id: org.id,
        referral_applied: !!referral_code && !!resolvedParentOrgId,
        discount_percent: discountPercent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("signup-saas error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
