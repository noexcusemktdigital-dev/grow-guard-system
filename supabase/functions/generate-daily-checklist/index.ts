// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { debitIfGPSDone } from '../_shared/credits.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { SYSTEM_PROMPT, buildUserPrompt, PROMPT_VERSION } from '../_shared/prompts/generate-daily-checklist.ts';

const CREDIT_COST = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: getCorsHeaders(req) });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: getCorsHeaders(req) });
    }

    const userId = user.id;

    const _rl = await checkRateLimit(userId, null, 'generate-daily-checklist', { windowSeconds: 60, maxRequests: 30 });
    if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

    const { data: orgData } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (!orgData) {
      return new Response(JSON.stringify({ error: "No organization found" }), { status: 400, headers: getCorsHeaders(req) });
    }

    const orgId = orgData.organization_id;
    const today = new Date().toISOString().split("T")[0];

    // Check if already generated today
    const { data: existing } = await supabase
      .from("client_checklist_items")
      .select("id")
      .eq("user_id", userId)
      .eq("date", today)
      .eq("source", "system")
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: "Already generated", created: 0 }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── Collect user context ──
    const now = new Date();
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

    // CRM: leads without contact, hot stalled, new leads
    const [
      { count: leadsNoContact },
      { count: hotStalled },
      { count: overdueTasks },
      { count: pendingProposals },
      { count: newLeadsToday },
      { count: unreadMessages },
      { count: contactsNoReply },
      { count: pendingContent },
      { count: draftPosts },
      { data: goalsData },
      { data: gamData },
      { data: walletData },
      { data: strategyData },
      { data: templates },
    ] = await Promise.all([
      // 1. Leads assigned to user with no activities
      supabase.from("crm_leads").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("assigned_to", userId)
        .is("won_at", null).is("lost_at", null)
        .lt("updated_at", oneDayAgo),

      // 2. Hot leads stalled >2 days
      supabase.from("crm_leads").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("assigned_to", userId)
        .eq("temperature", "hot").is("won_at", null).is("lost_at", null)
        .lt("updated_at", twoDaysAgo),

      // 3. Overdue CRM tasks
      supabase.from("crm_tasks").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("assigned_to", userId)
        .is("completed_at", null).lt("due_date", now.toISOString()),

      // 4. Pending proposals
      supabase.from("crm_proposals").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("created_by", userId).eq("status", "sent"),

      // 5. New leads created today
      supabase.from("crm_leads").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).gte("created_at", today),

      // 6. Unread WhatsApp messages
      supabase.from("whatsapp_messages").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("direction", "inbound").eq("status", "received")
        .gte("created_at", oneDayAgo),

      // 7. Contacts without reply >24h
      supabase.from("whatsapp_contacts").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("has_unread", true)
        .lt("last_message_at", oneDayAgo),

      // 8. Content pending approval
      supabase.from("client_content").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("status", "pending"),

      // 9. Draft posts
      supabase.from("client_posts").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("status", "draft"),

      // 10. Active goals
      supabase.from("goals").select("title, metric, current_value, target_value")
        .eq("organization_id", orgId).eq("status", "active").limit(5),

      // 11. Gamification
      supabase.from("client_gamification").select("*")
        .eq("user_id", userId).eq("organization_id", orgId).maybeSingle(),

      // 12. Credit wallet
      supabase.from("credit_wallets").select("balance")
        .eq("organization_id", orgId).maybeSingle(),

      // 13. Strategy plans
      supabase.from("client_content").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("type", "strategy"),

      // 14. Custom checklist templates
      supabase.from("checklist_templates").select("*")
        .eq("organization_id", orgId).eq("is_active", true).eq("frequency", "daily"),
    ]);

    // Build context snapshot
    const context = {
      crm: {
        leads_sem_contato_24h: leadsNoContact || 0,
        leads_quentes_parados_2d: hotStalled || 0,
        tarefas_vencidas: overdueTasks || 0,
        propostas_pendentes: pendingProposals || 0,
        leads_novos_hoje: newLeadsToday || 0,
      },
      comunicacao: {
        mensagens_nao_lidas: unreadMessages || 0,
        contatos_sem_resposta_24h: contactsNoReply || 0,
      },
      conteudo: {
        roteiros_pendentes_aprovacao: pendingContent || 0,
        postagens_rascunho: draftPosts || 0,
      },
      metas: (goalsData || []).map((g: { title: string; current_value: number; target_value: number }) => ({
        titulo: g.title,
        atual: g.current_value,
        alvo: g.target_value,
        percentual: g.target_value > 0 ? Math.round((g.current_value / g.target_value) * 100) : 0,
      })),
      gamificacao: {
        streak: gamData?.streak_days || 0,
        xp: gamData?.xp || 0,
        nivel: gamData?.level || 1,
      },
      creditos: walletData?.balance ?? 0,
      tem_estrategia: (strategyData as { count?: number })?.count ? (strategyData as { count: number }).count > 0 : false,
    };

    // Custom templates to include
    const templateTasks = (templates || []).map((t: { title: string }) => t.title);

    let tasks: { title: string; category: string; priority: string }[] = [];

    if (lovableApiKey) {
      // Call Lovable AI for intelligent task generation
      const userPrompt = buildUserPrompt({ today, context, templateTasks });
      console.log(`[generate-daily-checklist] prompt_version=${PROMPT_VERSION}`);

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            tools: [{
              type: "function",
              function: {
                name: "generate_checklist",
                description: "Gera o checklist diário personalizado",
                parameters: {
                  type: "object",
                  properties: {
                    tasks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string", description: "Título curto e acionável da tarefa" },
                          category: { type: "string", enum: ["comercial", "marketing", "operacional", "estrategico"] },
                          priority: { type: "string", enum: ["alta", "media", "baixa"] },
                        },
                        required: ["title", "category", "priority"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["tasks"],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "generate_checklist" } },
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            const parsed = JSON.parse(toolCall.function.arguments);
            tasks = (parsed.tasks || []).slice(0, 10);
          }
        } else {
          console.error("AI gateway error:", aiResponse.status, await aiResponse.text());
        }
      } catch (aiErr) {
        console.error("AI call failed:", aiErr);
      }
    }

    // Fallback if AI didn't return tasks
    if (tasks.length === 0) {
      tasks = [
        { title: "Verificar leads novos no CRM", category: "comercial", priority: "alta" },
        { title: "Responder mensagens pendentes", category: "comercial", priority: "alta" },
        { title: "Atualizar pipeline de vendas", category: "comercial", priority: "media" },
      ];

      if ((context.crm.leads_quentes_parados_2d) > 0) {
        tasks.push({ title: `Follow-up em ${context.crm.leads_quentes_parados_2d} leads quentes parados`, category: "comercial", priority: "alta" });
      }
      if ((context.crm.tarefas_vencidas) > 0) {
        tasks.push({ title: `Resolver ${context.crm.tarefas_vencidas} tarefas vencidas do CRM`, category: "operacional", priority: "alta" });
      }
      if ((context.crm.propostas_pendentes) > 0) {
        tasks.push({ title: "Acompanhar propostas enviadas", category: "comercial", priority: "media" });
      }

      // Include custom templates
      for (const t of (templates || [])) {
        tasks.push({ title: t.title, category: t.category || "operacional", priority: "media" });
      }
    }

    // Insert tasks
    const inserts = tasks.map((t) => ({
      title: t.title,
      category: t.category,
      source: "system",
      user_id: userId,
      organization_id: orgId,
      date: today,
      is_completed: false,
    }));

    const { error: insertError } = await supabase.from("client_checklist_items").insert(inserts);
    if (insertError) throw insertError;

    // Debit credits — only after first GPS is approved
    try {
      await debitIfGPSDone(
        supabase,
        orgId,
        CREDIT_COST,
        "Checklist diário gerado por IA",
        "generate-daily-checklist",
        supabaseUrl,
        supabaseKey,
      );
    } catch (debitErr) {
      console.error("Debit error (non-blocking):", debitErr);
    }

    // Update streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const { data: yesterdayItems } = await supabase
      .from("client_checklist_items")
      .select("is_completed")
      .eq("user_id", userId)
      .eq("date", yesterday);

    const allCompletedYesterday = yesterdayItems && yesterdayItems.length > 0 && yesterdayItems.every((i: { is_completed: boolean }) => i.is_completed);

    if (gamData) {
      const newStreak = allCompletedYesterday ? (gamData.streak_days || 0) + 1 : allCompletedYesterday === false ? 0 : gamData.streak_days || 0;
      const streakBonus = newStreak > 0 && newStreak % 7 === 0 ? 200 : 0;
      await supabase.from("client_gamification").update({
        streak_days: newStreak,
        xp: (gamData.xp || 0) + streakBonus,
        last_activity_at: new Date().toISOString(),
      }).eq("id", gamData.id);
    } else {
      await supabase.from("client_gamification").insert({
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
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
