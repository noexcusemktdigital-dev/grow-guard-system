import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const rolePrompts: Record<string, string> = {
  sdr: "Você atua como SDR (Sales Development Representative). Seu foco principal é prospecção e qualificação de leads. Faça perguntas abertas para entender necessidades, identifique o decisor, colete informações relevantes e tente agendar reuniões com closers. Nunca tente fechar vendas diretamente.",
  closer: "Você atua como Closer de vendas. Seu foco é apresentar propostas de valor, negociar condições, superar objeções com argumentos sólidos e fechar vendas. Crie senso de urgência quando apropriado e sempre conduza a conversa para o fechamento.",
  pos_venda: "Você atua como agente de Pós-venda. Seu foco é garantir a satisfação do cliente, fazer follow-ups, coletar feedback, identificar oportunidades de upsell/cross-sell e construir relacionamento de longo prazo.",
  suporte: "Você atua como agente de Suporte/Atendimento. Seu foco é resolver problemas do cliente com empatia e eficiência, coletar informações relevantes sobre o problema, e escalar para humano quando não conseguir resolver.",
};

// ─── Engagement rule helpers ───

function isWithinWorkingHours(workingHours: any): boolean {
  if (!workingHours?.enabled) return true;
  const tz = workingHours.timezone || "America/Sao_Paulo";
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });
  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find((p: any) => p.type === "hour")?.value || "0");
  const minute = parseInt(parts.find((p: any) => p.type === "minute")?.value || "0");
  const currentMinutes = hour * 60 + minute;
  const [startH, startM] = (workingHours.start || "08:00").split(":").map(Number);
  const [endH, endM] = (workingHours.end || "18:00").split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function hoursSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
}

async function debitCredits(adminClient: any, orgId: string, tokensUsed: number, agentName: string) {
  const { data: wallet } = await adminClient
    .from("credit_wallets")
    .select("id, balance")
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!wallet) return;
  const newBalance = Math.max(0, wallet.balance - tokensUsed);
  await adminClient.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);
  await adminClient.from("credit_transactions").insert({
    organization_id: orgId,
    type: "consumption",
    amount: -tokensUsed,
    balance_after: newBalance,
    description: `Consumo IA — ${agentName}`,
    metadata: { source: "ai-agent-reply" },
  });
}

async function executeHandoff(adminClient: any, orgId: string, contactId: string, agentName: string, reason: string) {
  await adminClient.from("whatsapp_contacts").update({ attending_mode: "human" }).eq("id", contactId);
  const { data: members } = await adminClient.from("organization_memberships").select("user_id").eq("organization_id", orgId);
  if (members) {
    await adminClient.from("client_notifications").insert(
      members.map((m: any) => ({
        organization_id: orgId,
        user_id: m.user_id,
        title: "IA transferiu atendimento",
        message: `Agente ${agentName}: ${reason}`,
        type: "warning",
        action_url: "/cliente/chat",
      }))
    );
  }
}

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

    const { organization_id, contact_id, message_text, message_type } = await req.json();

    if (!organization_id || !contact_id || !message_text) {
      return new Response(JSON.stringify({ error: "Missing params" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── CHECK 1: Credit balance ───
    const { data: wallet } = await adminClient
      .from("credit_wallets")
      .select("balance")
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (wallet && wallet.balance <= 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no_credits" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get contact
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

    // Find active AI agent
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

    // Check whatsapp_instance_ids restriction
    const instanceIds = agent.whatsapp_instance_ids || [];
    if (instanceIds.length > 0) {
      const { data: instance } = await adminClient
        .from("whatsapp_instances")
        .select("id")
        .eq("organization_id", organization_id)
        .single();
      if (instance && !instanceIds.includes(instance.id)) {
        return new Response(JSON.stringify({ skipped: true, reason: "agent not assigned to this instance" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Assign agent if not set
    if (!contact.agent_id) {
      await adminClient.from("whatsapp_contacts").update({ agent_id: agent.id }).eq("id", contact_id);
    }

    const promptConfig = agent.prompt_config || {};
    const engagementRules = promptConfig.engagement_rules || {};

    // ─── CHECK 2: Working hours ───
    if (!isWithinWorkingHours(engagementRules.working_hours)) {
      return new Response(JSON.stringify({ skipped: true, reason: "outside_working_hours" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── CHECK 3: Message count limit ───
    const maxMessages = engagementRules.max_messages ?? 30;
    const { count: msgCount } = await adminClient
      .from("whatsapp_messages")
      .select("id", { count: "exact", head: true })
      .eq("contact_id", contact_id)
      .eq("organization_id", organization_id);

    if ((msgCount ?? 0) >= maxMessages) {
      const limitAction = engagementRules.limit_action || "handoff";
      if (limitAction === "handoff") {
        await executeHandoff(adminClient, organization_id, contact_id, agent.name, `Limite de ${maxMessages} mensagens atingido`);
      }
      return new Response(JSON.stringify({ skipped: true, reason: "message_limit_reached", action: limitAction }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── CHECK 4: Inactivity timeout ───
    const timeoutHours = engagementRules.inactivity_timeout_hours ?? 48;
    const { data: lastContactMsg } = await adminClient
      .from("whatsapp_messages")
      .select("created_at")
      .eq("contact_id", contact_id)
      .eq("organization_id", organization_id)
      .eq("direction", "inbound")
      .order("created_at", { ascending: false })
      .limit(2);

    // If there's a previous inbound message and the gap is > timeout
    if (lastContactMsg && lastContactMsg.length >= 2) {
      const previousMsgTime = lastContactMsg[1].created_at;
      if (hoursSince(previousMsgTime) > timeoutHours) {
        const timeoutAction = engagementRules.timeout_action || "handoff";
        if (timeoutAction === "handoff") {
          await executeHandoff(adminClient, organization_id, contact_id, agent.name, `Contato retornou após ${timeoutHours}h de inatividade`);
          return new Response(JSON.stringify({ skipped: true, reason: "inactivity_timeout", action: "handoff" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (timeoutAction === "ignore") {
          return new Response(JSON.stringify({ skipped: true, reason: "inactivity_timeout", action: "ignore" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // "restart" — continue normally (reset context effectively by limiting history)
      }
    }

    // ─── All checks passed — process message ───

    // Handle audio transcription if message_type is audio
    let processedMessage = message_text;
    if (message_type === "audio" && message_text.startsWith("http")) {
      try {
        const transcribeRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Transcreva o áudio a seguir. Retorne apenas o texto transcrito, sem formatação." },
              { role: "user", content: `Transcreva este áudio: ${message_text}` },
            ],
          }),
        });
        if (transcribeRes.ok) {
          const transcribeData = await transcribeRes.json();
          const transcribed = transcribeData.choices?.[0]?.message?.content;
          if (transcribed) processedMessage = transcribed;
        }
      } catch (e) {
        console.error("Audio transcription failed:", e);
      }
    }

    // Fetch CRM lead context
    let leadContext = "";
    let leadData: any = null;
    let funnelStages: any[] = [];
    const crmActions = agent.crm_actions || {};

    if (contact.crm_lead_id) {
      const { data: lead } = await adminClient
        .from("crm_leads")
        .select("id, name, stage, value, tags, funnel_id")
        .eq("id", contact.crm_lead_id)
        .single();

      if (lead) {
        leadData = lead;
        if (lead.funnel_id) {
          const { data: funnel } = await adminClient.from("crm_funnels").select("stages").eq("id", lead.funnel_id).single();
          if (funnel?.stages && Array.isArray(funnel.stages)) funnelStages = funnel.stages;
        }

        const stageNames = funnelStages.map((s: any) => s.label || s.key).join(", ");
        leadContext = `\n\nInformações do lead vinculado:
- Nome: ${lead.name}
- Etapa atual: ${lead.stage}
- Valor potencial: R$ ${lead.value || 0}
- Tags: ${(lead.tags || []).join(", ") || "nenhuma"}
${stageNames ? `- Etapas disponíveis: ${stageNames}` : ""}

Ações automáticas disponíveis (inclua no FINAL da resposta, o usuário NÃO verá):`;

        if (crmActions.can_move_stage) leadContext += "\n- [AI_ACTION:MOVE_STAGE:nome_da_etapa]";
        if (crmActions.can_handoff) leadContext += "\n- [AI_ACTION:HANDOFF:motivo]";
        if (crmActions.can_update_value) leadContext += "\n- [AI_ACTION:UPDATE_LEAD:value=10000]";
        if (crmActions.can_add_tags) leadContext += "\n- [AI_ACTION:UPDATE_LEAD:tags_add=nome_da_tag]";
      }
    }

    // Fetch message history — if "restart" after timeout, limit to recent only
    const timeoutAction = engagementRules.timeout_action || "handoff";
    const historyLimit = (timeoutAction === "restart" && lastContactMsg && lastContactMsg.length >= 2 && hoursSince(lastContactMsg[1].created_at) > timeoutHours) ? 2 : 20;

    const { data: history } = await adminClient
      .from("whatsapp_messages")
      .select("direction, content, created_at")
      .eq("contact_id", contact_id)
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: false })
      .limit(historyLimit);

    const chatHistory = (history || []).reverse().map((m: any) => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.content || "",
    }));

    // Build system prompt with role-specific instructions
    const persona = agent.persona || {};
    const knowledgeBase = agent.knowledge_base || [];
    const role = agent.role || "sdr";
    const objectives = agent.objectives || [];

    let systemPrompt = promptConfig.system_prompt || `Você é ${agent.name}, um assistente virtual.`;

    if (rolePrompts[role]) systemPrompt += `\n\n${rolePrompts[role]}`;

    if (persona.generated_description) {
      systemPrompt += `\n\nPersona: ${persona.generated_description}`;
    } else {
      if (persona.formality) systemPrompt += `\nFormalidade: ${persona.formality}`;
      if (persona.emojis) systemPrompt += `\nEmojis: ${persona.emojis}`;
      if (persona.message_length) systemPrompt += `\nMensagens: ${persona.message_length}`;
      if (persona.traits?.length) systemPrompt += `\nTraços: ${persona.traits.join(", ")}`;
    }

    if (persona.restrictions) systemPrompt += `\n\nRestrições: ${persona.restrictions}`;
    if (agent.gender) systemPrompt += `\nGênero da persona: ${agent.gender}`;
    if (agent.description) systemPrompt += `\nDescrição: ${agent.description}`;

    if (objectives.length > 0) {
      systemPrompt += `\n\nSeus objetivos nesta conversa: ${objectives.join(", ")}`;
    }

    // Add objections from prompt_config
    const objections = promptConfig.objections || [];
    if (objections.length > 0) {
      systemPrompt += `\n\nObjeções comuns e como responder:\n${objections.map((o: any) => `- Objeção: "${o.objection}" → Resposta sugerida: "${o.response}"`).join("\n")}`;
    }

    if (Array.isArray(knowledgeBase) && knowledgeBase.length > 0) {
      const kbText = knowledgeBase
        .map((item: any) => typeof item === "string" ? item : item.content || JSON.stringify(item))
        .join("\n---\n");
      systemPrompt += `\n\nBase de conhecimento:\n${kbText}`;
    }

    systemPrompt += leadContext;
    systemPrompt += "\n\nResponda de forma concisa e natural, como em uma conversa de WhatsApp. Use parágrafos curtos.";

    const model = promptConfig.model || "google/gemini-3-flash-preview";

    // Call AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory,
          { role: "user", content: processedMessage },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      await adminClient.from("ai_conversation_logs").insert({
        organization_id, contact_id, agent_id: agent.id,
        input_message: processedMessage, output_message: `[ERROR ${status}] ${errText}`, tokens_used: 0, model,
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
    const cleanReply = replyText.replace(/\[AI_ACTION:[^\]]+\]/g, "").trim();

    // Execute actions
    for (const action of actions) {
      try {
        if (action.type === "MOVE_STAGE" && leadData && crmActions.can_move_stage) {
          const targetStage = funnelStages.find(
            (s: any) => (s.label || "").toLowerCase() === action.value.toLowerCase() || (s.key || "") === action.value
          );
          const stageKey = targetStage?.key || action.value;
          await adminClient.from("crm_leads").update({ stage: stageKey }).eq("id", leadData.id);
          await adminClient.from("crm_activities").insert({
            organization_id, lead_id: leadData.id, type: "note",
            title: `IA moveu lead para etapa "${targetStage?.label || stageKey}"`,
            description: `Ação automática da IA (${agent.name} — ${(agent.role || "sdr").toUpperCase()})`,
          });
        }

        if (action.type === "HANDOFF" && crmActions.can_handoff) {
          await executeHandoff(adminClient, organization_id, contact_id, agent.name, action.value);
        }

        if (action.type === "UPDATE_LEAD" && leadData) {
          const [field, val] = action.value.split("=");
          if (field === "value" && crmActions.can_update_value) {
            await adminClient.from("crm_leads").update({ value: parseFloat(val) }).eq("id", leadData.id);
          } else if (field === "tags_add" && crmActions.can_add_tags) {
            const currentTags = leadData.tags || [];
            if (!currentTags.includes(val)) {
              await adminClient.from("crm_leads").update({ tags: [...currentTags, val] }).eq("id", leadData.id);
            }
          }
        }
      } catch (actionErr) {
        console.error(`Error executing AI action ${action.type}:`, actionErr);
      }
    }

    // Send via Z-API
    const { data: instance } = await adminClient.from("whatsapp_instances").select("*").eq("organization_id", organization_id).single();
    if (!instance || instance.status !== "connected") {
      return new Response(JSON.stringify({ error: "WhatsApp not connected" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanPhone = contact.phone.replace(/[\s\-\+\(\)]/g, "");
    const zapiUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/send-text`;
    const zapiRes = await fetch(zapiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Client-Token": instance.client_token },
      body: JSON.stringify({ phone: cleanPhone, message: cleanReply }),
    });

    const zapiData = await zapiRes.json();
    const messageStatus = zapiRes.ok ? "sent" : "failed";

    await adminClient.from("whatsapp_messages").insert({
      organization_id, contact_id,
      message_id_zapi: zapiData?.messageId || null,
      direction: "outbound", type: "text", content: cleanReply, status: messageStatus,
      metadata: { ...zapiData, ai_generated: true, agent_id: agent.id, agent_role: agent.role, ai_actions: actions.length > 0 ? actions : undefined },
    });

    await adminClient.from("whatsapp_contacts").update({ last_message_at: new Date().toISOString() }).eq("id", contact_id);

    await adminClient.from("ai_conversation_logs").insert({
      organization_id, contact_id, agent_id: agent.id,
      input_message: processedMessage, output_message: cleanReply, tokens_used: tokensUsed, model,
    });

    // ─── Debit credits after successful response ───
    await debitCredits(adminClient, organization_id, tokensUsed, agent.name);

    return new Response(JSON.stringify({ success: true, reply: cleanReply, actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-agent-reply error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
