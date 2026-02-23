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
      .select("*, agent_id, attending_mode, phone, crm_lead_id")
      .eq("id", contact_id)
      .eq("organization_id", organization_id)
      .single();

    if (!contact || contact.attending_mode !== "ai") {
      return new Response(JSON.stringify({ skipped: true, reason: "not in ai mode" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find active AI agent for this org
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

    // Assign agent if not set
    if (!contact.agent_id) {
      await adminClient
        .from("whatsapp_contacts")
        .update({ agent_id: agent.id })
        .eq("id", contact_id);
    }

    // Fetch CRM lead context if linked
    let leadContext = "";
    let leadData: any = null;
    let funnelStages: any[] = [];

    if (contact.crm_lead_id) {
      const { data: lead } = await adminClient
        .from("crm_leads")
        .select("id, name, stage, value, tags, funnel_id")
        .eq("id", contact.crm_lead_id)
        .single();

      if (lead) {
        leadData = lead;

        // Fetch funnel stages
        if (lead.funnel_id) {
          const { data: funnel } = await adminClient
            .from("crm_funnels")
            .select("stages")
            .eq("id", lead.funnel_id)
            .single();
          if (funnel?.stages && Array.isArray(funnel.stages)) {
            funnelStages = funnel.stages;
          }
        }

        const stageNames = funnelStages.map((s: any) => s.label || s.key).join(", ");
        leadContext = `\n\nInformações do lead vinculado:
- Nome: ${lead.name}
- Etapa atual: ${lead.stage}
- Valor potencial: R$ ${lead.value || 0}
- Tags: ${(lead.tags || []).join(", ") || "nenhuma"}
${stageNames ? `- Etapas disponíveis: ${stageNames}` : ""}

Você pode executar ações automáticas incluindo tags especiais no FINAL da sua resposta (o usuário NÃO verá essas tags):
- Para mover o lead de etapa: [AI_ACTION:MOVE_STAGE:nome_da_etapa]
- Para transferir para atendimento humano: [AI_ACTION:HANDOFF:motivo]
- Para atualizar valor do lead: [AI_ACTION:UPDATE_LEAD:value=10000]
- Para adicionar tag: [AI_ACTION:UPDATE_LEAD:tags_add=nome_da_tag]

Use essas ações quando a conversa indicar mudança de status. Por exemplo:
- Cliente confirmou interesse → mova para etapa de proposta/diagnóstico
- Cliente quer falar com humano → faça handoff
- Cliente informou orçamento → atualize o valor`;
      }
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

    systemPrompt += leadContext;
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
    let replyText = aiData.choices?.[0]?.message?.content || "";
    const tokensUsed = aiData.usage?.total_tokens || 0;

    if (!replyText) {
      return new Response(JSON.stringify({ skipped: true, reason: "empty ai response" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and execute AI actions
    const actionRegex = /\[AI_ACTION:([A-Z_]+):([^\]]+)\]/g;
    const actions: { type: string; value: string }[] = [];
    let match;
    while ((match = actionRegex.exec(replyText)) !== null) {
      actions.push({ type: match[1], value: match[2] });
    }

    // Remove action tags from reply text
    const cleanReply = replyText.replace(/\[AI_ACTION:[^\]]+\]/g, "").trim();

    // Execute actions
    for (const action of actions) {
      try {
        if (action.type === "MOVE_STAGE" && leadData) {
          // Find matching stage key
          const targetStage = funnelStages.find(
            (s: any) => (s.label || "").toLowerCase() === action.value.toLowerCase() || (s.key || "") === action.value
          );
          const stageKey = targetStage?.key || action.value;

          await adminClient
            .from("crm_leads")
            .update({ stage: stageKey })
            .eq("id", leadData.id);

          // Log activity
          await adminClient.from("crm_activities").insert({
            organization_id,
            lead_id: leadData.id,
            type: "note",
            title: `IA moveu lead para etapa "${targetStage?.label || stageKey}"`,
            description: `Ação automática da IA durante conversa WhatsApp`,
          });

          console.log(`AI ACTION: Moved lead ${leadData.id} to stage ${stageKey}`);
        }

        if (action.type === "HANDOFF") {
          // Switch to human mode
          await adminClient
            .from("whatsapp_contacts")
            .update({ attending_mode: "human" })
            .eq("id", contact_id);

          // Create notification for all org members (simplified: notify admins)
          // Get org members
          const { data: members } = await adminClient
            .from("organization_memberships")
            .select("user_id")
            .eq("organization_id", organization_id);

          if (members) {
            const notifications = members.map((m: any) => ({
              organization_id,
              user_id: m.user_id,
              title: "IA solicitou transbordo",
              message: `Motivo: ${action.value}. Contato: ${contact.name || contact.phone}`,
              type: "warning",
              action_url: "/cliente/chat",
            }));

            await adminClient.from("client_notifications").insert(notifications);
          }

          console.log(`AI ACTION: Handoff requested for contact ${contact_id} - reason: ${action.value}`);
        }

        if (action.type === "UPDATE_LEAD" && leadData) {
          const [field, val] = action.value.split("=");
          if (field === "value") {
            await adminClient
              .from("crm_leads")
              .update({ value: parseFloat(val) })
              .eq("id", leadData.id);
          } else if (field === "tags_add") {
            const currentTags = leadData.tags || [];
            if (!currentTags.includes(val)) {
              await adminClient
                .from("crm_leads")
                .update({ tags: [...currentTags, val] })
                .eq("id", leadData.id);
            }
          }
          console.log(`AI ACTION: Updated lead ${leadData.id} - ${action.value}`);
        }
      } catch (actionErr) {
        console.error(`Error executing AI action ${action.type}:`, actionErr);
      }
    }

    // Send reply via Z-API (use clean text without action tags)
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
      body: JSON.stringify({ phone: cleanPhone, message: cleanReply }),
    });

    const zapiData = await zapiRes.json();
    const messageStatus = zapiRes.ok ? "sent" : "failed";

    // Save outbound message (with clean text)
    await adminClient.from("whatsapp_messages").insert({
      organization_id,
      contact_id,
      message_id_zapi: zapiData?.messageId || null,
      direction: "outbound",
      type: "text",
      content: cleanReply,
      status: messageStatus,
      metadata: {
        ...zapiData,
        ai_generated: true,
        agent_id: agent.id,
        ai_actions: actions.length > 0 ? actions : undefined,
      },
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
      output_message: cleanReply,
      tokens_used: tokensUsed,
      model,
    });

    return new Response(JSON.stringify({ success: true, reply: cleanReply, actions }), {
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
