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

    const { type, role, persona, knowledge_base, objectives, name } = await req.json();

    const roleDescriptions: Record<string, string> = {
      sdr: "SDR (Sales Development Representative) — foco em prospecção, qualificação de leads, perguntas abertas para identificar necessidades e agendar reuniões",
      closer: "Closer — foco em fechamento de vendas, apresentação de propostas, negociação, superação de objeções e senso de urgência",
      pos_venda: "Pós-venda — foco em acompanhamento, satisfação do cliente, coleta de feedback, oportunidades de upsell e fidelização",
      suporte: "Suporte/Atendimento — foco em resolução de problemas, empatia, coleta de informações do erro, escalação quando necessário",
    };

    let prompt = "";

    if (type === "greeting") {
      prompt = `Gere uma saudação personalizada para um agente de IA WhatsApp com estas características:
- Nome: ${name || "Agente"}
- Função: ${roleDescriptions[role] || role}
- Formalidade: ${persona?.formality || "profissional"}
- Uso de emojis: ${persona?.emojis || "pouco"}
- Traços: ${(persona?.traits || []).join(", ") || "não definidos"}

Escreva APENAS a saudação (1-3 frases curtas), sem explicações. A saudação deve ser natural para WhatsApp e refletir a personalidade configurada.`;
    } else if (type === "persona") {
      prompt = `Gere uma descrição completa de persona para um agente de IA com as seguintes características:
- Nome: ${name || "Agente"}
- Função: ${roleDescriptions[role] || role}
- Saudação: ${persona?.greeting || "informal"}
- Formalidade: ${persona?.formality || "profissional"}
- Uso de emojis: ${persona?.emojis || "pouco"}
- Comprimento de mensagens: ${persona?.message_length || "medias"}
- Traços de personalidade: ${(persona?.traits || []).join(", ") || "não definidos"}
- Restrições: ${persona?.restrictions || "nenhuma especificada"}

Escreva em português brasileiro, com 3-4 parágrafos descrevendo como esse agente deve se comportar, seu tom, estilo e abordagem. Seja específico e prático.`;
    } else if (type === "prompt") {
      const kbSummary = (knowledge_base || [])
        .slice(0, 5)
        .map((item: any) => typeof item === "string" ? item : item.content || item.name)
        .filter(Boolean)
        .join("; ");

      prompt = `Gere um system prompt completo para um agente de IA WhatsApp com as seguintes configurações:
- Nome: ${name || "Agente"}
- Função: ${roleDescriptions[role] || role}
- Saudação: ${persona?.greeting || "informal"}
- Formalidade: ${persona?.formality || "profissional"}
- Emojis: ${persona?.emojis || "pouco"}
- Mensagens: ${persona?.message_length || "medias"}
- Personalidade: ${(persona?.traits || []).join(", ") || "não definidos"}
- Restrições: ${persona?.restrictions || "nenhuma"}
- Objetivos: ${(objectives || []).join(", ") || "não definidos"}
${kbSummary ? `- Base de conhecimento inclui: ${kbSummary}` : ""}

Gere um system prompt detalhado e prático em português brasileiro. O prompt deve:
1. Definir claramente quem é o agente
2. Estabelecer regras de comportamento
3. Incluir instruções específicas para a função (${role})
4. Definir quando deve escalar para humano
5. Ser otimizado para conversas de WhatsApp (mensagens curtas, parágrafos separados)`;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um especialista em configuração de agentes de IA para WhatsApp comercial. Responda diretamente com o conteúdo solicitado, sem formatação markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResponse.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-generate-agent-config error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
