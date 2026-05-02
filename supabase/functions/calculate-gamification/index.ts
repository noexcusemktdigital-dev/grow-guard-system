// Consolidates 18 parallel queries from ClienteGamificacao into one round-trip.
// Returns aggregates only — no raw arrays — except for what the UI strictly needs
// (team ranking entries, claim ids).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'calculate-gamification');
  const log = makeLogger(ctx);
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.slice(7);
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: orgIdData } = await admin.rpc("get_user_org_id", { _user_id: userId, _portal: "saas" });
    const orgId = (orgIdData as string | null) ?? null;
    if (!orgId) {
      return new Response(JSON.stringify({ error: "no_organization" }), {
        status: 404, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // All reads in parallel.
    const [
      profileRes, orgRes, gamificationRes,
      leadsRes, teamRes, evalsRes,
      contentsCountRes, dispatchesCountRes, sitesCountRes, agentsRes,
      waInstanceRes, membersRes, teamsRes, activeStrategyRes,
      calendarCountRes, checklistDoneCountRes, academyDoneCountRes,
      customFunnelsCountRes, claimsRes, teamGamificationRes,
    ] = await Promise.all([
      admin.from("profiles").select("full_name, phone, job_title, avatar_url").eq("id", userId).maybeSingle(),
      admin.from("organizations").select("name, cnpj, address, phone, logo_url").eq("id", orgId).maybeSingle(),
      admin.from("client_gamification").select("xp, streak_days, points, title, last_activity_at").eq("user_id", userId).eq("organization_id", orgId).maybeSingle(),
      admin.from("crm_leads").select("id, value, won_at, lost_at, phone, email").eq("organization_id", orgId),
      admin.from("crm_team_members" as never).select("user_id, full_name").eq("organization_id", orgId),
      admin.from("evaluations").select("score").eq("evaluated_user_id", userId),
      admin.from("client_content").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
      admin.from("client_dispatches").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
      admin.from("client_sites").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
      admin.from("client_ai_agents").select("id, status").eq("organization_id", orgId),
      admin.from("whatsapp_instances").select("status").eq("organization_id", orgId).maybeSingle(),
      admin.from("organization_members").select("user_id").eq("organization_id", orgId),
      admin.from("organization_teams" as never).select("id").eq("organization_id", orgId),
      admin.from("marketing_strategies").select("id, status").eq("organization_id", orgId).eq("status", "approved").limit(1).maybeSingle(),
      admin.from("calendar_events").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
      admin.from("client_checklist_items").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_completed", true),
      admin.from("academy_progress").select("id", { count: "exact", head: true }).eq("user_id", userId).not("completed_at", "is", null),
      admin.from("crm_funnels").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
      admin.from("gamification_claims" as never).select("reward_id").eq("organization_id", orgId),
      admin.from("client_gamification").select("user_id, xp, title, streak_days").eq("organization_id", orgId),
    ]);

    const orgLeads = (leadsRes.data ?? []) as Array<{ value: number | null; won_at: string | null; lost_at: string | null; phone: string | null; email: string | null }>;
    const totalLeads = orgLeads.length;
    let wonLeads = 0, wonValue = 0, pipelineValue = 0, completeLeads = 0;
    for (const l of orgLeads) {
      const v = Number(l.value) || 0;
      if (l.won_at) { wonLeads++; wonValue += v; }
      else if (!l.lost_at) pipelineValue += v;
      if (v > 0 && l.phone && l.email) completeLeads++;
    }

    const agents = (agentsRes.data ?? []) as Array<{ status: string }>;
    const activeAgents = agents.filter(a => a.status === "active").length;
    const waConnected = waInstanceRes.data?.status === "connected";
    const hasStrategy = !!activeStrategyRes.data;

    const evals = (evalsRes.data ?? []) as Array<{ score: number }>;
    const avgEval = evals.length > 0
      ? (evals.reduce((s, e) => s + (e.score ?? 0), 0) / evals.length)
      : null;

    const teamGamification = (teamGamificationRes.data ?? []) as Array<{ user_id: string; xp: number; title: string; streak_days: number }>;
    const totalOrgXp = teamGamification.reduce((s, g) => s + (g.xp ?? 0), 0);

    // Build team ranking by joining team members with gamification rows.
    const team = (teamRes.data ?? []) as Array<{ user_id: string; full_name: string }>;
    const gamMap = new Map(teamGamification.map(g => [g.user_id, g]));
    const teamRanking = team
      .map(m => {
        const g = gamMap.get(m.user_id);
        return {
          user_id: m.user_id,
          full_name: m.full_name,
          xp: g?.xp ?? 0,
          title: g?.title ?? "Novato",
          streak_days: g?.streak_days ?? 0,
        };
      })
      .sort((a, b) => b.xp - a.xp);

    return new Response(JSON.stringify({
      org_id: orgId,
      profile: profileRes.data ?? null,
      org: orgRes.data ?? null,
      gamification: gamificationRes.data ?? { xp: 0, streak_days: 0, points: 0, title: "Novato", last_activity_at: null },
      counts: {
        total_leads: totalLeads,
        won_leads: wonLeads,
        won_value: wonValue,
        pipeline_value: pipelineValue,
        complete_leads: completeLeads,
        contents: contentsCountRes.count ?? 0,
        dispatches: dispatchesCountRes.count ?? 0,
        sites: sitesCountRes.count ?? 0,
        active_agents: activeAgents,
        members: (membersRes.data ?? []).length,
        teams: (teamsRes.data ?? []).length,
        calendar_events: calendarCountRes.count ?? 0,
        checklist_done: checklistDoneCountRes.count ?? 0,
        academy_done: academyDoneCountRes.count ?? 0,
        custom_funnels: customFunnelsCountRes.count ?? 0,
      },
      flags: {
        wa_connected: waConnected,
        has_strategy: hasStrategy,
      },
      avg_eval: avgEval,
      evals_count: evals.length,
      total_org_xp: totalOrgXp,
      team_ranking: teamRanking,
      claimed_reward_ids: (claimsRes.data ?? []).map((c: { reward_id: string }) => c.reward_id),
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[calculate-gamification] error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
