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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { agent_config, message, history } = await req.json();

    if (!agent_config || !message) {
      return new Response(JSON.stringify({ error: "Missing agent_config or message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const persona = agent_config.persona || {};
    const promptConfig = agent_config.prompt_config || {};
    const knowledgeBase = agent_config.knowledge_base || [];
    const role = agent_config.role || "sdr";

    const rolePrompts: Record<string, string> = {
      sdr: "Você atua como SDR. Seu foco é qualificar leads, fazer perguntas abertas para entender necessidades e agendar reuniões com closers.",
      closer: "Você atua como Closer. Seu foco é apresentar propostas de valor, negociar, superar objeções e fechar vendas.",
      pos_venda: "Você atua como Pós-venda. Seu foco é garantir satisfação, coletar feedback, identificar oportunidades de upsell e fidelizar.",
      suporte: "Você atua como Suporte. Seu foco é resolver problemas com empatia, coletar informações relevantes e escalar quando necessário.",
    };

    // Build system prompt
    let systemPrompt = promptConfig.system_prompt || `Você é ${agent_config.name || "um assistente virtual"}.`;
    systemPrompt += `\n\n${rolePrompts[role] || ""}`;

    if (persona.generated_description) {
      systemPrompt += `\n\nPersona: ${persona.generated_description}`;
    } else {
      if (persona.formality) systemPrompt += `\nFormalidade: ${persona.formality}`;
      if (persona.emojis) systemPrompt += `\nEmojis: ${persona.emojis}`;
      if (persona.message_length) systemPrompt += `\nMensagens: ${persona.message_length}`;
      if (persona.traits?.length) systemPrompt += `\nTraços: ${persona.traits.join(", ")}`;
    }

    if (persona.restrictions) systemPrompt += `\n\nRestrições: ${persona.restrictions}`;

    if (Array.isArray(knowledgeBase) && knowledgeBase.length > 0) {
      const kbText = knowledgeBase
        .slice(0, 10)
        .map((item: any) => typeof item === "string" ? item : item.content || item.name || "")
        .filter(Boolean)
        .join("\n---\n");
      if (kbText) systemPrompt += `\n\nBase de conhecimento:\n${kbText}`;
    }

    if (agent_config.objectives?.length) {
      systemPrompt += `\n\nSeus objetivos: ${agent_config.objectives.join(", ")}`;
    }

    systemPrompt += "\n\nEsta é uma SIMULAÇÃO de teste. Responda normalmente como faria em uma conversa real de WhatsApp.";

    const chatHistory = (history || []).map((m: any) => ({ role: m.role, content: m.content }));
    const model = promptConfig.modelo ? `google/${promptConfig.modelo}` : "google/gemini-3-flash-preview";

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
          { role: "user", content: message },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", errText);
      return new Response(JSON.stringify({ error: "Simulation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResponse.json();
    let reply = data.choices?.[0]?.message?.content || "";

    // Parse actions (for display only in simulation)
    const actionRegex = /\[AI_ACTION:([A-Z_]+):([^\]]+)\]/g;
    const actions: { type: string; value: string }[] = [];
    let match;
    while ((match = actionRegex.exec(reply)) !== null) {
      actions.push({ type: match[1], value: match[2] });
    }
    reply = reply.replace(/\[AI_ACTION:[^\]]+\]/g, "").trim();

    return new Response(JSON.stringify({ reply, actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-agent-simulate error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
