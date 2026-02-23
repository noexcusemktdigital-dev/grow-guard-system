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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let followupsSent = 0;

    for (const agent of agents) {
      const promptConfig = agent.prompt_config || {};
      const followup = promptConfig.followup || {};

      if (!followup.enabled) continue;

      const delayHours = followup.delay_hours || 24;
      const maxAttempts = followup.max_attempts || 3;
      const cutoffTime = new Date(Date.now() - delayHours * 60 * 60 * 1000).toISOString();

      // Check credit balance
      const { data: wallet } = await adminClient
        .from("credit_wallets")
        .select("balance")
        .eq("organization_id", agent.organization_id)
        .maybeSingle();

      if (wallet && wallet.balance <= 0) continue;

      // Find contacts assigned to this agent in AI mode
      const { data: contacts } = await adminClient
        .from("whatsapp_contacts")
        .select("id, phone, name, last_message_at")
        .eq("organization_id", agent.organization_id)
        .eq("agent_id", agent.id)
        .eq("attending_mode", "ai");

      if (!contacts || contacts.length === 0) continue;

      for (const contact of contacts) {
        // Get last message
        const { data: lastMessages } = await adminClient
          .from("whatsapp_messages")
          .select("direction, created_at, metadata")
          .eq("contact_id", contact.id)
          .eq("organization_id", agent.organization_id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!lastMessages || lastMessages.length === 0) continue;

        const lastMsg = lastMessages[0];

        // Only follow up if last message was from the agent (outbound) and enough time passed
        if (lastMsg.direction !== "outbound") continue;
        if (new Date(lastMsg.created_at) > new Date(cutoffTime)) continue;

        // Count existing follow-ups
        const followupCount = lastMessages.filter(
          (m: any) => m.direction === "outbound" && m.metadata?.followup === true
        ).length;

        if (followupCount >= maxAttempts) {
          // Handoff: agent exhausted all follow-up attempts — transfer to human
          await adminClient.from("whatsapp_contacts").update({ attending_mode: "human" }).eq("id", contact.id);
          const { data: members } = await adminClient.from("organization_memberships").select("user_id").eq("organization_id", agent.organization_id);
          if (members) {
            await adminClient.from("client_notifications").insert(
              members.map((m: any) => ({
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

        // Generate follow-up message
        const { data: history } = await adminClient
          .from("whatsapp_messages")
          .select("direction, content")
          .eq("contact_id", contact.id)
          .eq("organization_id", agent.organization_id)
          .order("created_at", { ascending: false })
          .limit(10);

        const chatHistory = (history || []).reverse().map((m: any) => ({
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

          // Send via Z-API
          const { data: instance } = await adminClient
            .from("whatsapp_instances")
            .select("*")
            .eq("organization_id", agent.organization_id)
            .single();

          if (!instance || instance.status !== "connected") continue;

          const cleanPhone = contact.phone.replace(/[\s\-\+\(\)]/g, "");
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("agent-followup-cron error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
