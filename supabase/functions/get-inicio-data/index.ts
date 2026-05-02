// @ts-nocheck
// Consolidated dashboard data for ClienteInicio.
// Replaces 13+ parallel client queries with a single round-trip.
// Returns aggregated summaries (counts/sums) instead of raw arrays whenever possible.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'get-inicio-data');
  const log = makeLogger(ctx);
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate user via JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.slice(7);
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Use admin client for cross-table reads (we already validated the user
    // and we filter every query by user_id / org_id below).
    const admin = createClient(supabaseUrl, serviceKey);

    // Resolve org_id for this user (saas portal context).
    const { data: orgIdData } = await admin.rpc("get_user_org_id", {
      _user_id: userId,
      _portal: "saas",
    });
    const orgId = (orgIdData as string | null) ?? null;
    if (!orgId) {
      return new Response(JSON.stringify({ error: "no_organization" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const prevMonthEnd = monthStart;
    const todayStr = now.toISOString().slice(0, 10);
    const sla48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    // Run all reads in parallel.
    const [
      profileRes,
      orgRes,
      gamificationRes,
      leadsRes,
      activeGoalsRes,
      checklistRes,
      myTasksRes,
      announcementsRes,
      announcementViewsRes,
      waInstanceRes,
      waContactsRes,
      agentsRes,
      dailyMessageRes,
    ] = await Promise.all([
      admin.from("profiles").select("id, full_name, avatar_url, phone, job_title").eq("id", userId).maybeSingle(),
      admin.from("organizations").select("id, name, cnpj, address, phone, logo_url").eq("id", orgId).maybeSingle(),
      admin.from("client_gamification").select("xp, streak_days, points, title, last_activity_at").eq("user_id", userId).eq("organization_id", orgId).maybeSingle(),
      // Trim columns to what ClienteInicio actually consumes.
      admin.from("crm_leads")
        .select("id, value, won_at, lost_at, created_at, updated_at, assigned_to")
        .eq("organization_id", orgId),
      admin.from("goals").select("id, title, target_value, metric, status, period_start, period_end").eq("organization_id", orgId).eq("status", "active"),
      admin.from("client_checklist_items").select("id, title, is_completed, due_date").eq("user_id", userId).eq("due_date", todayStr),
      admin.from("crm_tasks").select("id, status, due_date").eq("organization_id", orgId).eq("assigned_to", userId).eq("status", "pending"),
      admin.from("announcements").select("id, title, priority, status, published_at").eq("organization_id", orgId).eq("status", "active").order("published_at", { ascending: false }).limit(10),
      admin.from("announcement_views").select("announcement_id").eq("user_id", userId),
      admin.from("whatsapp_instances").select("id, status").eq("organization_id", orgId).maybeSingle(),
      admin.from("whatsapp_contacts").select("id, unread_count").eq("organization_id", orgId).gt("unread_count", 0),
      admin.from("client_ai_agents").select("id, status").eq("organization_id", orgId).eq("status", "active"),
      admin.from("daily_messages").select("message, author").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const allLeads = (leadsRes.data ?? []) as Array<{
      id: string; value: number | null; won_at: string | null; lost_at: string | null;
      created_at: string; updated_at: string; assigned_to: string | null;
    }>;

    // Aggregate leads server-side.
    let thisMonth = 0, prevMonth = 0, wonThisMonth = 0, wonPrevMonth = 0;
    let revenueThisMonth = 0, revenuePrevMonth = 0;
    let myCount = 0, myWon = 0;
    let leadsWithoutContact48h = 0;
    const wonThisMonthLeads: Array<{ won_at: string; value: number }> = [];
    const todayLeadsCount = (() => {
      let n = 0;
      for (const l of allLeads) if (l.created_at?.startsWith(todayStr)) n++;
      return n;
    })();

    for (const l of allLeads) {
      const created = l.created_at;
      const wonAt = l.won_at;
      if (created >= monthStart) thisMonth++;
      else if (created >= prevMonthStart && created < prevMonthEnd) prevMonth++;
      if (wonAt) {
        const v = Number(l.value) || 0;
        if (wonAt >= monthStart) {
          wonThisMonth++;
          revenueThisMonth += v;
          wonThisMonthLeads.push({ won_at: wonAt, value: v });
        } else if (wonAt >= prevMonthStart && wonAt < prevMonthEnd) {
          wonPrevMonth++;
          revenuePrevMonth += v;
        }
      }
      if (l.assigned_to === userId) {
        myCount++;
        if (wonAt) myWon++;
      }
      if (!l.won_at && !l.lost_at && l.updated_at < sla48h) leadsWithoutContact48h++;
    }

    // Weekly revenue buckets for the chart (1..31).
    const weekly = [
      { week: "Sem 1", receita: 0 },
      { week: "Sem 2", receita: 0 },
      { week: "Sem 3", receita: 0 },
      { week: "Sem 4", receita: 0 },
    ];
    for (const l of wonThisMonthLeads) {
      const day = new Date(l.won_at).getDate();
      const idx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
      weekly[idx].receita += l.value;
    }

    // Goal progress: keep simple — current value = sum of won_at lead values
    // within goal period (matches what useGoalProgress does for revenue metric).
    const goals = (activeGoalsRes.data ?? []) as Array<{
      id: string; title: string; target_value: number; metric: string | null;
      period_start: string; period_end: string;
    }>;
    const goalProgress: Record<string, { currentValue: number; percent: number; remaining: number }> = {};
    for (const g of goals) {
      let current = 0;
      for (const l of allLeads) {
        if (!l.won_at) continue;
        if (l.won_at >= g.period_start && l.won_at <= g.period_end) {
          current += Number(l.value) || 0;
        }
      }
      const target = Number(g.target_value) || 0;
      const percent = target > 0 ? (current / target) * 100 : 0;
      goalProgress[g.id] = { currentValue: current, percent, remaining: Math.max(target - current, 0) };
    }

    const viewedIds = new Set(((announcementViewsRes.data ?? []) as Array<{ announcement_id: string }>).map(v => v.announcement_id));
    const unreadAnnouncements = ((announcementsRes.data ?? []) as Array<{ id: string; title: string; priority: string | null; published_at: string | null }>)
      .filter(a => a.published_at && !viewedIds.has(a.id))
      .slice(0, 3);

    const payload = {
      org_id: orgId,
      profile: profileRes.data ?? null,
      org: orgRes.data ?? null,
      gamification: gamificationRes.data ?? { xp: 0, streak_days: 0, points: 0, title: "Novato", last_activity_at: null },
      leads_summary: {
        this_month: thisMonth,
        prev_month: prevMonth,
        won_this_month: wonThisMonth,
        won_prev_month: wonPrevMonth,
        revenue_this_month: revenueThisMonth,
        revenue_prev_month: revenuePrevMonth,
        my_count: myCount,
        my_won: myWon,
        leads_without_contact_48h: leadsWithoutContact48h,
        today_count: todayLeadsCount,
        weekly_revenue: weekly,
        total: allLeads.length,
      },
      active_goals: goals,
      goal_progress: goalProgress,
      checklist_today: checklistRes.data ?? [],
      my_pending_tasks: (myTasksRes.data ?? []).length,
      announcements_unread: unreadAnnouncements,
      wa_status: waInstanceRes.data?.status ?? null,
      wa_unread_conversations: (waContactsRes.data ?? []).length,
      active_agents_count: (agentsRes.data ?? []).length,
      daily_message: dailyMessageRes.data ?? null,
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[get-inicio-data] error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
