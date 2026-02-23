import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIXED_DAILY_TASKS = [
  { title: "Verificar leads novos no CRM", category: "comercial" },
  { title: "Responder mensagens pendentes", category: "comercial" },
  { title: "Atualizar pipeline de vendas", category: "comercial" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub as string;

    // Get user's org
    const { data: orgData } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (!orgData) {
      return new Response(JSON.stringify({ error: "No organization found" }), { status: 400, headers: corsHeaders });
    }

    const orgId = orgData.organization_id;
    const today = new Date().toISOString().split("T")[0];

    // Check if system tasks already generated today
    const { data: existing } = await supabase
      .from("client_checklist_items")
      .select("id")
      .eq("user_id", userId)
      .eq("date", today)
      .eq("source", "system")
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: "Already generated", created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build task list
    const tasks: { title: string; category: string }[] = [...FIXED_DAILY_TASKS];

    // Conditional: leads stuck > 2 days
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    const { count: stuckLeads } = await supabase
      .from("crm_leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("assigned_to", userId)
      .is("won_at", null)
      .is("lost_at", null)
      .lt("updated_at", twoDaysAgo);

    if (stuckLeads && stuckLeads > 0) {
      tasks.push({ title: `Fazer follow-up em ${stuckLeads} leads parados`, category: "comercial" });
    }

    // Conditional: overdue CRM tasks
    const { count: overdueTasks } = await supabase
      .from("crm_tasks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("assigned_to", userId)
      .is("completed_at", null)
      .lt("due_date", new Date().toISOString());

    if (overdueTasks && overdueTasks > 0) {
      tasks.push({ title: `Resolver ${overdueTasks} tarefas vencidas do CRM`, category: "operacional" });
    }

    // Conditional: pending proposals
    const { count: pendingProposals } = await supabase
      .from("crm_proposals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("created_by", userId)
      .eq("status", "sent");

    if (pendingProposals && pendingProposals > 0) {
      tasks.push({ title: "Acompanhar propostas enviadas", category: "comercial" });
    }

    // Also load custom templates from org
    const { data: templates } = await supabase
      .from("checklist_templates")
      .select("*")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .eq("frequency", "daily");

    if (templates) {
      for (const t of templates) {
        tasks.push({ title: t.title, category: t.category || "operacional" });
      }
    }

    // Insert all tasks
    const inserts = tasks.map((t) => ({
      title: t.title,
      category: t.category,
      source: "system",
      user_id: userId,
      organization_id: orgId,
      date: today,
      is_completed: false,
    }));

    const { error: insertError } = await supabase
      .from("client_checklist_items")
      .insert(inserts);

    if (insertError) throw insertError;

    // Update streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const { data: yesterdayItems } = await supabase
      .from("client_checklist_items")
      .select("is_completed")
      .eq("user_id", userId)
      .eq("date", yesterday);

    const allCompletedYesterday = yesterdayItems && yesterdayItems.length > 0 && yesterdayItems.every((i: any) => i.is_completed);

    const { data: gamData } = await supabase
      .from("client_gamification")
      .select("*")
      .eq("user_id", userId)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (gamData) {
      const newStreak = allCompletedYesterday ? (gamData.streak_days || 0) + 1 : allCompletedYesterday === false ? 0 : gamData.streak_days || 0;
      const streakBonus = newStreak > 0 && newStreak % 7 === 0 ? 200 : 0;
      await supabase
        .from("client_gamification")
        .update({
          streak_days: newStreak,
          xp: (gamData.xp || 0) + streakBonus,
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", gamData.id);
    } else {
      await supabase
        .from("client_gamification")
        .insert({
          user_id: userId,
          organization_id: orgId,
          streak_days: 0,
          xp: 0,
          title: "Novato",
          points: 0,
          level: 1,
        });
    }

    return new Response(JSON.stringify({ message: "OK", created: inserts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
