// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'agent-followup-cron');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: withCorrelationHeader(ctx, getCorsHeaders(req)) });
  }

  // SEC-NOE-002: Cron secret validation — reject all requests without CRON_SECRET
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    console.error("[agent-followup-cron] CRON_SECRET not configured — rejecting all requests");
    return new Response(JSON.stringify({ error: "Service misconfigured" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // PERF early-exit: if there are no active WhatsApp agents at all, skip the
    // expensive batch pre-fetch (wallets + instances) and message scans.
    const { count: activeAgentsCount } = await adminClient
      .from("client_ai_agents")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("channel", "whatsapp");
    if (!activeAgentsCount || activeAgentsCount === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "no_active_agents" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Find all active agents with followup enabled
    const { data: agents, error: agentsErr } = await adminClient
      .from("client_ai_agents")
      .select("*")
      .eq("status", "active")
      .eq("channel", "whatsapp");

    if (agentsErr || !agents) {
      return new Response(JSON.stringify({ error: "Failed to fetch agents" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let followupsSent = 0;

    // DATA-002: Batch pre-fetch wallets and instances for all unique orgs (eliminates N+1)
    const uniqueOrgIds = [...new Set(agents.map((a: { organization_id: string }) => a.organization_id))];

    const [{ data: wallets }, { data: instances }] = await Promise.all([
      adminClient.from("credit_wallets").select("organization_id, balance").in("organization_id", uniqueOrgIds),
      adminClient.from("whatsapp_instances").select("*").in("organization_id", uniqueOrgIds).eq("status", "connected"),
    ]);

    const walletMap = new Map((wallets || []).map((w: { organization_id: string; balance: number }) => [w.organization_id, w]));
    // Keep only first connected instance per org (same semantics as .single() was)
    const instanceMap = new Map<string, Record<string, unknown>>();
    for (const inst of (instances || [])) {
      if (!instanceMap.has(inst.organization_id)) instanceMap.set(inst.organization_id, inst);
    }

    for (const agent of agents) {
      const promptConfig = agent.prompt_config || {};
      const followup = promptConfig.followup || {};

      if (!followup.enabled) continue;

      const delayHours = followup.delay_hours || 24;
      const maxAttempts = followup.max_attempts || 3;
      const cutoffTime = new Date(Date.now() - delayHours * 60 * 60 * 1000).toISOString();

      // FIN-001: wallet IS NULL (não apenas zero) também deve pular — sem wallet = sem créditos
      // DATA-002: wallet looked up from pre-fetched map, not a per-agent query
      const wallet = walletMap.get(agent.organization_id);
      if (!wallet || wallet.balance <= 0) continue;

      // Find contacts assigned to this agent in AI mode
      const { data: contacts } = await adminClient
        .from("whatsapp_contacts")
        .select("id, phone, name, last_message_at")
        .eq("organization_id", agent.organization_id)
        .eq("agent_id", agent.id)
        .eq("attending_mode", "ai");

      if (!contacts || contacts.length === 0) continue;

      for (const contact of contacts) {
        // DATA-002: Single query replaces two separate lastMessages + history queries
        const { data: messages } = await adminClient
          .from("whatsapp_messages")
          .select("direction, created_at, content, metadata")
          .eq("contact_id", contact.id)
          .eq("organization_id", agent.organization_id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!messages || messages.length === 0) continue;

        const lastMsg = messages[0];

        // Only follow up if last message was from the agent (outbound) and enough time passed
        if (lastMsg.direction !== "outbound") continue;
        if (new Date(lastMsg.created_at) > new Date(cutoffTime)) continue;

        // Count existing follow-ups (from same fetched messages)
        const lastMessages = messages.slice(0, 5);
        const followupCount = lastMessages.filter(
          (m: { direction: string; metadata?: { followup?: boolean } }) => m.direction === "outbound" && m.metadata?.followup === true
        ).length;

        if (followupCount >= maxAttempts) {
          // Handoff: agent exhausted all follow-up attempts — transfer to human
          await adminClient.from("whatsapp_contacts").update({ attending_mode: "human" }).eq("id", contact.id);
          const { data: members } = await adminClient.from("organization_memberships").select("user_id").eq("organization_id", agent.organization_id);
          if (members) {
            await adminClient.from("client_notifications").insert(
              members.map((m: { user_id: string }) => ({
                organization_id: agent.organization_id,
                user_id: m.user_id,
                title: "Follow-up esgotado",
                message: `Agente ${agent.name}: contato ${contact.name || contact.phone} não respondeu após ${maxAttempts} tentativas de follow-up. Transferido para atendimento humano.`,
                type: "warning",
                action_url: "/cliente/chat",
              }))
            );
          }
          continue;
        }

        // Build chat history from the already-fetched messages (no extra query needed)
        const history = messages;

        const chatHistory = (history || []).reverse().map((m: { direction: string; content: string }) => ({
          role: m.direction === "inbound" ? "user" : "assistant",
          content: m.content || "",
        }));

        const followupPrompt = `Você é ${agent.name}. O contato não respondeu sua última mensagem há mais de ${delayHours} horas. Envie uma mensagem de follow-up educada e breve para reengajar a conversa. Não seja insistente. Este é o follow-up #${followupCount + 1} de no máximo ${maxAttempts}.`;

        try {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: promptConfig.model || "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: followupPrompt },
                ...chatHistory,
              ],
            }),
          });

          if (!aiRes.ok) continue;

          const aiData = await aiRes.json();
          const followupText = aiData.choices?.[0]?.message?.content?.trim();
          const tokensUsed = aiData.usage?.total_tokens || 0;

          if (!followupText) continue;

          // DATA-002: Instance looked up from pre-fetched map, not a per-contact query
          const instance = instanceMap.get(agent.organization_id);
          if (!instance) continue;

          const cleanPhone = contact.phone.replace(/[\s+()-]/g, "");
          const zapiUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/send-text`;
          const zapiRes = await fetch(zapiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Client-Token": instance.client_token },
            body: JSON.stringify({ phone: cleanPhone, message: followupText }),
          });

          const zapiData = await zapiRes.json();

          await adminClient.from("whatsapp_messages").insert({
            organization_id: agent.organization_id,
            contact_id: contact.id,
            message_id_zapi: zapiData?.messageId || null,
            direction: "outbound",
            type: "text",
            content: followupText,
            status: zapiRes.ok ? "sent" : "failed",
            metadata: { ai_generated: true, agent_id: agent.id, followup: true, followup_number: followupCount + 1 },
          });

          await adminClient.from("whatsapp_contacts").update({ last_message_at: new Date().toISOString() }).eq("id", contact.id);

          await adminClient.from("ai_conversation_logs").insert({
            organization_id: agent.organization_id,
            contact_id: contact.id,
            agent_id: agent.id,
            input_message: `[FOLLOWUP #${followupCount + 1}]`,
            output_message: followupText,
            tokens_used: tokensUsed,
            model: promptConfig.model || "google/gemini-3-flash-preview",
          });

          // Debit credits
          if (wallet && tokensUsed > 0) {
            const newBalance = Math.max(0, wallet.balance - tokensUsed);
            await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("organization_id", agent.organization_id);
            await adminClient.from("credit_transactions").insert({
              organization_id: agent.organization_id,
              type: "consumption",
              amount: -tokensUsed,
              balance_after: newBalance,
              description: `Follow-up IA — ${agent.name}`,
              metadata: { source: "agent-followup-cron", followup_number: followupCount + 1 },
            });
          }

          followupsSent++;
        } catch (e) {
          console.error(`Followup error for contact ${contact.id}:`, e);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, followups_sent: followupsSent }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("agent-followup-cron error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
