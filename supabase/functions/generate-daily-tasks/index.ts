// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { debitIfGPSDone } from '../_shared/credits.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { SYSTEM_PROMPT, buildUserPrompt, PROMPT_VERSION } from '../_shared/prompts/generate-daily-tasks.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

const CREDIT_COST = 5;

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'generate-daily-tasks');
  const log = makeLogger(ctx);
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

    const callerUserId = user.id;

    const _rl = await checkRateLimit(callerUserId, null, 'generate-daily-tasks', { windowSeconds: 60, maxRequests: 30 });
    if (!_rl.allowed) return rateLimitResponse(_rl, getCorsHeaders(req));

    const body = await req.json().catch(() => ({}));
    const targetUserId: string = body.target_user_id || callerUserId;

    // Get caller's org
    const { data: orgData } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", callerUserId)
      .limit(1)
      .single();

    if (!orgData) {
      return new Response(JSON.stringify({ error: "No organization found" }), { status: 400, headers: getCorsHeaders(req) });
    }

    const orgId = orgData.organization_id;

    // If generating for another user, verify caller is admin
    if (targetUserId !== callerUserId) {
      const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: callerUserId, _portal: "saas" });
      if (roleData !== "cliente_admin") {
        return new Response(JSON.stringify({ error: "Apenas administradores podem gerar tarefas para outros" }), {
          status: 403, headers: getCorsHeaders(req),
        });
      }
      // Verify target is in same org
      const { data: targetMember } = await supabase
        .from("organization_memberships")
        .select("id")
        .eq("user_id", targetUserId)
        .eq("organization_id", orgId)
        .maybeSingle();
      if (!targetMember) {
        return new Response(JSON.stringify({ error: "Usuário não pertence à organização" }), {
          status: 400, headers: getCorsHeaders(req),
        });
      }
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if already generated today for target user
    const { data: existing } = await supabase
      .from("client_tasks")
      .select("id")
      .eq("organization_id", orgId)
      .eq("assigned_to", targetUserId)
      .eq("due_date", today)
      .eq("source", "system")
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: "Already generated", created: 0 }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Check credits first
    const { data: walletData } = await supabase
      .from("credit_wallets")
      .select("balance")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (!walletData || walletData.balance < CREDIT_COST) {
      return new Response(JSON.stringify({ error: "Créditos insuficientes. Necessário: " + CREDIT_COST }), {
        status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── Collect CRM context for target user ──
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const now = new Date();

    const [
      { count: leadsNoContact },
      { count: hotStalled },
      { count: overdueTasks },
      { count: pendingProposals },
      { count: newLeadsToday },
      { count: unreadMessages },
      { count: contactsNoReply },
      { count: pendingContent },
      { data: goalsData },
    ] = await Promise.all([
      supabase.from("crm_leads").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("assigned_to", targetUserId)
        .is("won_at", null).is("lost_at", null)
        .lt("updated_at", oneDayAgo),

      supabase.from("crm_leads").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("assigned_to", targetUserId)
        .eq("temperature", "hot").is("won_at", null).is("lost_at", null)
        .lt("updated_at", twoDaysAgo),

      supabase.from("crm_tasks").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("assigned_to", targetUserId)
        .is("completed_at", null).lt("due_date", now.toISOString()),

      supabase.from("crm_proposals").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("created_by", targetUserId).eq("status", "sent"),

      supabase.from("crm_leads").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).gte("created_at", today),

      supabase.from("whatsapp_messages").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("direction", "inbound").eq("status", "received")
        .gte("created_at", oneDayAgo),

      supabase.from("whatsapp_contacts").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("has_unread", true)
        .lt("last_message_at", oneDayAgo),

      supabase.from("client_content").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("status", "pending"),

      supabase.from("goals").select("title, metric, current_value, target_value")
        .eq("organization_id", orgId).eq("status", "active").limit(5),
    ]);

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
      },
      metas: (goalsData || []).map((g: { title: string; current_value: number; target_value: number }) => ({
        titulo: g.title,
        atual: g.current_value,
        alvo: g.target_value,
        percentual: g.target_value > 0 ? Math.round((g.current_value / g.target_value) * 100) : 0,
      })),
      creditos: walletData?.balance ?? 0,
    };

    const priorityMap: Record<string, string> = { alta: "high", media: "medium", baixa: "low" };

    let tasks: { title: string; category: string; priority: string }[] = [];

    if (lovableApiKey) {
      const userPrompt = buildUserPrompt({ today, context });
      console.log(`[generate-daily-tasks] prompt_version=${PROMPT_VERSION}`);

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
                name: "generate_tasks",
                description: "Gera tarefas diárias personalizadas",
                parameters: {
                  type: "object",
                  properties: {
                    tasks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
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
            tool_choice: { type: "function", function: { name: "generate_tasks" } },
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
    }

    // Insert into client_tasks
    const inserts = tasks.map((t) => ({
      title: t.title,
      description: null,
      due_date: today,
      priority: priorityMap[t.priority] || t.priority || "medium",
      source: "system",
      status: "pending",
      assigned_to: targetUserId,
      created_by: callerUserId,
      organization_id: orgId,
    }));

    const { error: insertError } = await supabase.from("client_tasks").insert(inserts);
    if (insertError) throw insertError;

    // Debit credits — only after first GPS is approved
    try {
      await debitIfGPSDone(
        supabase,
        orgId,
        CREDIT_COST,
        "Tarefas diárias geradas por IA",
        "generate-daily-tasks",
        supabaseUrl,
        supabaseKey,
      );
    } catch (debitErr) {
      console.error("Debit error (non-blocking):", debitErr);
    }

    return new Response(JSON.stringify({ message: "OK", created: inserts.length }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error(err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
