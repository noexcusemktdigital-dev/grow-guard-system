// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'seed-diagnostic-user');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = "diagnostico@noexcuse.com";
    const password = "Diag@2026!Pro";

    // 1. Create user
    const { data: userData, error: userErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Diagnóstico PRO", signup_source: "saas" },
      });

    if (userErr && !userErr.message.includes("already been registered")) {
      throw userErr;
    }

    let userId = userData?.user?.id;

    // If user already exists, find them
    if (!userId) {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existing = listData?.users?.find((u: { email?: string }) => u.email === email);
      if (existing) userId = existing.id;
    }

    if (!userId) throw new Error("Could not find or create user");

    // 2. Check if org already exists for this user
    const { data: existingMembership } = await supabaseAdmin
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    let orgId: string;

    if (existingMembership?.organization_id) {
      orgId = existingMembership.organization_id;
    } else {
      // Find the franqueadora org to set as parent
      const { data: franqueadoraOrg } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("type", "franqueadora")
        .limit(1)
        .maybeSingle();

      // Create org
      const { data: newOrg, error: orgErr } = await supabaseAdmin
        .from("organizations")
        .insert({
          name: "Diagnóstico PRO Ltda",
          type: "cliente",
          parent_org_id: franqueadoraOrg?.id || null,
        })
        .select("id")
        .single();

      if (orgErr) throw orgErr;
      orgId = newOrg.id;

      // Add membership
      await supabaseAdmin
        .from("organization_memberships")
        .insert({ user_id: userId, organization_id: orgId, role: "cliente_admin" });
    }

    // 3. User role
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "cliente_admin" }, { onConflict: "user_id,role" });

    // 4. Profile
    await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        full_name: "Diagnóstico PRO",
        job_title: "QA Tester",
      }, { onConflict: "id" });

    // 5. Subscription PRO (active)
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("organization_id", orgId)
      .limit(1)
      .maybeSingle();

    if (existingSub) {
      await supabaseAdmin
        .from("subscriptions")
        .update({
          plan: "pro",
          status: "active",
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", existingSub.id);
    } else {
      await supabaseAdmin.from("subscriptions").insert({
        organization_id: orgId,
        plan: "pro",
        status: "active",
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // 6. Credit wallet with 1000 credits (PRO)
    const { data: existingWallet } = await supabaseAdmin
      .from("credit_wallets")
      .select("id")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (existingWallet) {
      await supabaseAdmin
        .from("credit_wallets")
        .update({ balance: 1000 })
        .eq("id", existingWallet.id);
    } else {
      await supabaseAdmin
        .from("credit_wallets")
        .insert({ organization_id: orgId, balance: 1000 });
    }

    // 7. Seed default teams
    await supabaseAdmin.rpc("seed_default_teams", { _org_id: orgId });

    // 8. Seed some CRM data (funnel + leads)
    const { data: existingFunnel } = await supabaseAdmin
      .from("crm_funnels")
      .select("id")
      .eq("organization_id", orgId)
      .limit(1)
      .maybeSingle();

    let funnelId: string;
    if (existingFunnel) {
      funnelId = existingFunnel.id;
    } else {
      const { data: newFunnel } = await supabaseAdmin
        .from("crm_funnels")
        .insert({
          organization_id: orgId,
          name: "Funil Principal",
          stages: ["Novo", "Qualificação", "Proposta", "Negociação", "Fechamento"],
          is_default: true,
        })
        .select("id")
        .single();
      funnelId = newFunnel!.id;
    }

    // Add sample leads
    const leads = [
      { name: "João Silva", email: "joao@teste.com", phone: "(11) 91234-5678", source: "website", value: 5000, stage: "Novo" },
      { name: "Maria Santos", email: "maria@teste.com", phone: "(11) 98765-4321", source: "indicação", value: 12000, stage: "Qualificação" },
      { name: "Pedro Costa", email: "pedro@teste.com", phone: "(11) 95555-1234", source: "google_ads", value: 8500, stage: "Proposta" },
      { name: "Ana Oliveira", email: "ana@teste.com", phone: "(11) 94444-5678", source: "instagram", value: 3200, stage: "Negociação" },
      { name: "Lucas Ferreira", email: "lucas@teste.com", phone: "(11) 93333-9876", source: "website", value: 15000, stage: "Fechamento" },
    ];

    for (const lead of leads) {
      const { data: existingLead } = await supabaseAdmin
        .from("crm_leads")
        .select("id")
        .eq("organization_id", orgId)
        .eq("email", lead.email)
        .maybeSingle();

      if (!existingLead) {
        await supabaseAdmin.from("crm_leads").insert({
          organization_id: orgId,
          funnel_id: funnelId,
          assigned_to: userId,
          ...lead,
        });
      }
    }

    // 9. Sales plan answers
    const { data: existingSalesPlan } = await supabaseAdmin
      .from("sales_plan_answers")
      .select("id")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (!existingSalesPlan) {
      await supabaseAdmin.from("sales_plan_answers").insert({
        organization_id: orgId,
        user_id: userId,
        answers: {
          business_name: "Diagnóstico PRO Ltda",
          segment: "Tecnologia",
          target_audience: "PMEs de tecnologia",
          main_product: "Consultoria em marketing digital",
          monthly_revenue_goal: 50000,
          average_ticket: 5000,
          main_channels: ["WhatsApp", "Instagram", "Google"],
          competitors: "Agências tradicionais",
          differentials: "Atendimento personalizado e IA",
        },
        completed: true,
      });
    }

    // 10. Marketing strategy
    const { data: existingStrategy } = await supabaseAdmin
      .from("marketing_strategies")
      .select("id")
      .eq("organization_id", orgId)
      .eq("status", "active")
      .maybeSingle();

    if (!existingStrategy) {
      await supabaseAdmin.from("marketing_strategies").insert({
        organization_id: orgId,
        created_by: userId,
        status: "active",
        answers: {
          brand_voice: "Profissional mas acessível",
          content_pillars: ["Tecnologia", "Inovação", "Cases de sucesso"],
          posting_frequency: "3x por semana",
          platforms: ["Instagram", "LinkedIn"],
        },
        result: {
          strategy_text: "Estratégia focada em conteúdo educativo para PMEs tech",
          content_calendar: [],
        },
      });
    }

    // 11. Gamification entry
    await supabaseAdmin.from("client_gamification").upsert({
      organization_id: orgId,
      user_id: userId,
      xp: 250,
      points: 250,
      level: 3,
      streak_days: 5,
      last_activity_at: new Date().toISOString(),
    }, { onConflict: "organization_id,user_id" });

    return new Response(JSON.stringify({
      success: true,
      user: { id: userId, email, password },
      organization: { id: orgId, name: "Diagnóstico PRO Ltda" },
      plan: "pro",
      credits: 1000,
    }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("seed-diagnostic-user error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
