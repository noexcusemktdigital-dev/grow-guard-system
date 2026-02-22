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
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { organization_id, contact_id, message_text } = await req.json();

    if (!organization_id || !contact_id || !message_text) {
      return new Response(JSON.stringify({ error: "Missing params" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get contact and check attending_mode
    const { data: contact } = await adminClient
      .from("whatsapp_contacts")
      .select("*, agent_id, attending_mode, phone")
      .eq("id", contact_id)
      .eq("organization_id", organization_id)
      .single();

    if (!contact || contact.attending_mode !== "ai") {
      return new Response(JSON.stringify({ skipped: true, reason: "not in ai mode" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find active AI agent for this org (use contact's agent_id or first active)
    let agentQuery = adminClient
      .from("client_ai_agents")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("status", "active")
      .eq("channel", "whatsapp");

    if (contact.agent_id) {
      agentQuery = agentQuery.eq("id", contact.agent_id);
    }

    const { data: agents } = await agentQuery.limit(1);
    const agent = agents?.[0];

    if (!agent) {
      return new Response(JSON.stringify({ skipped: true, reason: "no active agent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If contact has no agent_id assigned, assign this one
    if (!contact.agent_id) {
      await adminClient
        .from("whatsapp_contacts")
        .update({ agent_id: agent.id })
        .eq("id", contact_id);
    }

    // Fetch last 20 messages for context
    const { data: history } = await adminClient
      .from("whatsapp_messages")
      .select("direction, content, created_at")
      .eq("contact_id", contact_id)
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })
      .limit(20);

    const chatHistory = (history || []).reverse().map((m: any) => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.content || "",
    }));

    // Build system prompt from agent config
    const persona = agent.persona || {};
    const promptConfig = agent.prompt_config || {};
    const knowledgeBase = agent.knowledge_base || [];

    let systemPrompt = promptConfig.system_prompt || `Você é ${agent.name}, um assistente virtual.`;

    if (persona.tone) systemPrompt += `\nTom de voz: ${persona.tone}`;
    if (persona.personality) systemPrompt += `\nPersonalidade: ${persona.personality}`;
    if (agent.description) systemPrompt += `\nDescrição: ${agent.description}`;

    if (Array.isArray(knowledgeBase) && knowledgeBase.length > 0) {
      const kbText = knowledgeBase
        .map((item: any) => (typeof item === "string" ? item : item.content || JSON.stringify(item)))
        .join("\n---\n");
      systemPrompt += `\n\nBase de conhecimento:\n${kbText}`;
    }

    systemPrompt += "\n\nResponda de forma concisa e natural, como em uma conversa de WhatsApp. Use parágrafos curtos.";

    const model = promptConfig.model || "google/gemini-3-flash-preview";

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory,
          { role: "user", content: message_text },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);

      // Log the failure
      await adminClient.from("ai_conversation_logs").insert({
        organization_id,
        contact_id,
        agent_id: agent.id,
        input_message: message_text,
        output_message: `[ERROR ${status}] ${errText}`,
        tokens_used: 0,
        model,
      });

      return new Response(JSON.stringify({ error: "AI gateway error", status }), {
        status: status === 429 || status === 402 ? status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const replyText = aiData.choices?.[0]?.message?.content || "";
    const tokensUsed = aiData.usage?.total_tokens || 0;

    if (!replyText) {
      return new Response(JSON.stringify({ skipped: true, reason: "empty ai response" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send reply via Z-API
    const { data: instance } = await adminClient
      .from("whatsapp_instances")
      .select("*")
      .eq("organization_id", organization_id)
      .single();

    if (!instance || instance.status !== "connected") {
      console.error("WhatsApp instance not connected");
      return new Response(JSON.stringify({ error: "WhatsApp not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanPhone = contact.phone.replace(/[\s\-\+\(\)]/g, "");
    const zapiUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/send-text`;
    const zapiRes = await fetch(zapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": instance.client_token,
      },
      body: JSON.stringify({ phone: cleanPhone, message: replyText }),
    });

    const zapiData = await zapiRes.json();
    const messageStatus = zapiRes.ok ? "sent" : "failed";

    // Save outbound message
    await adminClient.from("whatsapp_messages").insert({
      organization_id,
      contact_id,
      message_id_zapi: zapiData?.messageId || null,
      direction: "outbound",
      type: "text",
      content: replyText,
      status: messageStatus,
      metadata: { ...zapiData, ai_generated: true, agent_id: agent.id },
    });

    // Update contact last_message_at
    await adminClient
      .from("whatsapp_contacts")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", contact_id);

    // Log AI conversation
    await adminClient.from("ai_conversation_logs").insert({
      organization_id,
      contact_id,
      agent_id: agent.id,
      input_message: message_text,
      output_message: replyText,
      tokens_used: tokensUsed,
      model,
    });

    return new Response(JSON.stringify({ success: true, reply: replyText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-agent-reply error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
